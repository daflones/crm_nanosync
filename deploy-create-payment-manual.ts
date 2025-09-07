// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface reqPayload {
  paymentData: any;
  paymentMethod: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Connection': 'keep-alive'
};

console.info("create-payment function started");

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { paymentData, paymentMethod }: reqPayload = await req.json();
    
    // Validar dados obrigatórios
    if (!paymentData || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'Dados de pagamento obrigatórios' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Obter token do Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Gerar chave de idempotência única
    const idempotencyKey = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('Criando pagamento:', { paymentMethod, amount: paymentData.transaction_amount });

    // Fazer requisição para API do Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erro na API do Mercado Pago:', result);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar pagamento', 
          details: result 
        }),
        { 
          status: response.status, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Salvar pagamento no banco de dados usando a estrutura existente
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrair user_id do JWT token
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
        console.log('User ID extraído:', userId);
      } catch (error) {
        console.error('Erro ao extrair user do token:', error);
      }
    }

    if (!userId) {
      console.error('User ID não encontrado - pagamento não será salvo no banco');
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Salvar no banco usando a estrutura existente
    const { error: dbError } = await supabase
      .from('pagamentos')
      .insert({
        user_id: userId,
        mercadopago_payment_id: result.id.toString(),
        valor: paymentData.transaction_amount,
        descricao: paymentData.description,
        status: result.status,
        status_detail: result.status_detail,
        plano_id: paymentData.description.includes('Básico') ? 'basic' : 
                 paymentData.description.includes('Pro') ? 'pro' : 'premium',
        plano_nome: paymentData.description,
        payment_method_id: paymentMethod,
        payment_type_id: result.payment_type_id,
        payer_email: paymentData.payer.email,
        payer_identification_type: paymentData.payer.identification.type,
        payer_identification_number: paymentData.payer.identification.number,
        response_data: result,
        external_reference: `user_${userId}_${Date.now()}`
      });

    if (dbError) {
      console.error('Erro ao salvar pagamento no banco:', dbError);
      console.error('Detalhes do erro:', JSON.stringify(dbError, null, 2));
    } else {
      console.log('Pagamento salvo no banco com sucesso!');
    }

    // Atualizar coluna payment_id na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ payment_id: result.id.toString() })
      .eq('id', userId);

    if (profileError) {
      console.error('Erro ao atualizar payment_id no profile:', profileError);
      console.error('Detalhes do erro do profile:', JSON.stringify(profileError, null, 2));
    } else {
      console.log('Payment ID atualizado no profile com sucesso:', result.id);
    }

    console.log('Pagamento criado com sucesso:', result.id);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Erro geral na função:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
