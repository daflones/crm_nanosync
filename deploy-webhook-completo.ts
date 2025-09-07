// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Connection': 'keep-alive'
};

console.info("webhook-mercadopago function started");

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Webhook Mercado Pago recebido:', req.method);
    
    // Log headers para debug
    console.log('Headers recebidos:', Object.fromEntries(req.headers.entries()));
    
    // Validar assinatura do webhook (opcional para testes)
    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');
    
    if (signature) {
      console.log('Assinatura recebida:', signature);
      // Por enquanto, apenas logar a assinatura para debug
      // A validação completa será implementada após os testes
    } else {
      console.log('Nenhuma assinatura encontrada no header');
    }
    
    // Parse webhook data from Mercado Pago
    const webhookData = await req.json();
    console.log('Dados do webhook:', webhookData);
    
    // Extract payment ID from webhook notification
    const paymentId = webhookData.data?.id || webhookData.id;
    
    if (!paymentId) {
      console.log('Payment ID não encontrado no webhook');
      return new Response('Payment ID missing', { status: 400, headers: corsHeaders });
    }
    
    // Verificar se é um evento de pagamento
    if (webhookData.type && webhookData.type !== 'payment') {
      console.log('Evento ignorado, não é de pagamento:', webhookData.type);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Buscar dados completos do pagamento na API do Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN não configurado');
      return new Response('Missing access token', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Buscando dados do pagamento na API:', paymentId);
    
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentResponse.ok) {
      console.error('Erro ao buscar pagamento:', paymentResponse.status, paymentResponse.statusText);
      const errorText = await paymentResponse.text();
      console.error('Detalhes do erro:', errorText);
      return new Response('Payment fetch error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const paymentData = await paymentResponse.json();
    console.log('Dados do pagamento obtidos:', paymentData);

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o pagamento já existe no banco
    const { data: existingPayment } = await supabase
      .from('pagamentos')
      .select('id, user_id')
      .eq('mercadopago_payment_id', paymentId.toString())
      .single();

    if (existingPayment) {
      // Pagamento já existe, apenas atualizar status
      console.log('Atualizando pagamento existente:', paymentId);
      
      const { error: updateError } = await supabase
        .from('pagamentos')
        .update({
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          response_data: paymentData,
          updated_at: new Date().toISOString()
        })
        .eq('mercadopago_payment_id', paymentId.toString());

      if (updateError) {
        console.error('Erro ao atualizar pagamento:', updateError);
      }
    } else {
      // Pagamento não existe, criar novo registro
      console.log('Criando novo registro de pagamento:', paymentId);
      
      // Tentar encontrar usuário pelo email
      let userId = null;
      if (paymentData.payer?.email) {
        const { data: user } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', paymentData.payer.email)
          .single();
        
        userId = user?.id;
      }

      // Determinar plano baseado na descrição
      const description = paymentData.description || '';
      let planoId = 'basic';
      if (description.includes('Pro')) planoId = 'pro';
      if (description.includes('Premium')) planoId = 'premium';

      const { error: insertError } = await supabase
        .from('pagamentos')
        .insert({
          user_id: userId,
          mercadopago_payment_id: paymentId.toString(),
          valor: paymentData.transaction_amount,
          descricao: paymentData.description,
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          plano_id: planoId,
          plano_nome: paymentData.description,
          payment_method_id: paymentData.payment_method_id,
          payment_type_id: paymentData.payment_type_id,
          payer_email: paymentData.payer?.email,
          payer_identification_type: paymentData.payer?.identification?.type,
          payer_identification_number: paymentData.payer?.identification?.number,
          response_data: paymentData,
          external_reference: paymentData.external_reference || `payment_${paymentId}`
        });

      if (insertError) {
        console.error('Erro ao inserir pagamento:', insertError);
        return new Response('Database insert error', { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    console.log('Pagamento processado no banco:', paymentId);

    // Se o pagamento foi aprovado, ativar assinatura do usuário
    if (paymentData.status === 'approved') {
      console.log('Pagamento aprovado, ativando assinatura...');

      // Buscar dados do pagamento para obter user_id
      const { data: payment, error: fetchError } = await supabase
        .from('pagamentos')
        .select('user_id, plano_id, plano_nome, plano_duracao_dias')
        .eq('mercadopago_payment_id', paymentId.toString())
        .single();

      if (fetchError || !payment) {
        console.error('Erro ao buscar dados do pagamento:', fetchError);
      } else if (payment.user_id) {
        // Calcular data de expiração (30 dias por padrão)
        const duracaoDias = payment.plano_duracao_dias || 30;
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + duracaoDias);

        // Atualizar perfil do usuário com assinatura ativa
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            plano_ativo: true,
            plano_id: payment.plano_id,
            plano_expira_em: dataExpiracao.toISOString(),
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.user_id);

        if (profileError) {
          console.error('Erro ao ativar assinatura:', profileError);
        } else {
          console.log('Assinatura ativada para usuário:', payment.user_id);
        }
      }
    }

    // Responder com sucesso para o Mercado Pago
    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Erro geral no webhook:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
