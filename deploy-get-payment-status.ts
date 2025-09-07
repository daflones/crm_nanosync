// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Connection': 'keep-alive'
};

console.info("get-payment-status function started");

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { paymentId } = await req.json();
    
    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID é obrigatório' }),
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

    console.log('Buscando status do pagamento:', paymentId);

    // Buscar status na API do Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Erro na API do Mercado Pago:', response.status);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar pagamento', 
          status: response.status 
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

    const result = await response.json();
    console.log('Status do pagamento:', { id: result.id, status: result.status });

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
