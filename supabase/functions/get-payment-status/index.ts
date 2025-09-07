// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface reqPayload {
  paymentId: string;
}

console.info("payment status server started");

Deno.serve(async (req: Request) => {
  const { paymentId }: reqPayload = await req.json();
  
  try {
    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'ID do pagamento obrigatório' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }
        }
      )
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }
        }
      )
    }

    // Consultar status do pagamento no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao consultar pagamento',
          details: result 
        }),
        { 
          status: response.status, 
          headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }
        }
      )
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }
      }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }
      }
    )
  }
});
