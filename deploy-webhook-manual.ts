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
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const body = await req.json();
    console.log('Webhook recebido:', body);

    // Verificar se é um evento de pagamento
    if (body.type !== 'payment') {
      console.log('Evento ignorado, não é de pagamento:', body.type);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error('ID do pagamento não encontrado no webhook');
      return new Response('Payment ID missing', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Buscar dados completos do pagamento na API do Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('Token do Mercado Pago não configurado');
      return new Response('Configuration error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Buscando dados do pagamento:', paymentId);

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpResponse.ok) {
      console.error('Erro ao buscar pagamento no Mercado Pago:', mpResponse.status);
      return new Response('Error fetching payment', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const paymentData = await mpResponse.json();
    console.log('Dados do pagamento:', { 
      id: paymentData.id, 
      status: paymentData.status,
      status_detail: paymentData.status_detail 
    });

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Atualizar status do pagamento no banco
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
      return new Response('Database update error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Pagamento atualizado no banco:', paymentId);

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
        return new Response('Payment not found', { 
          status: 404, 
          headers: corsHeaders 
        });
      }

      if (payment.user_id) {
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
