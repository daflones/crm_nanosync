// Código para colar diretamente no dashboard Supabase
// Function name: create-payment

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    const { paymentData, paymentMethod } = await req.json();
    
    if (!paymentData || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'Dados de pagamento obrigatórios' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Preparar payload para Mercado Pago
    const payload: any = {
      transaction_amount: paymentData.transaction_amount,
      description: paymentData.description,
      payment_method_id: paymentMethod === 'pix' ? 'pix' : paymentData.payment_method_id,
      payer: {
        email: paymentData.payer.email,
        first_name: paymentData.payer.first_name,
        last_name: paymentData.payer.last_name,
        identification: {
          type: paymentData.payer.identification.type,
          number: paymentData.payer.identification.number
        }
      }
    };

    // Adicionar campos específicos para cartão
    if (paymentMethod === 'card') {
      payload.token = paymentData.token;
      payload.installments = paymentData.installments || 1;
      payload.issuer_id = paymentData.issuer_id;
    }

    // Gerar chave de idempotência
    const idempotencyKey = `${paymentData.payer.email}-${Date.now()}`;

    // Fazer chamada para API do Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erro Mercado Pago:', result);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar pagamento',
          details: result 
        }),
        { 
          status: response.status, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
