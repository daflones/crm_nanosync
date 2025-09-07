// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface reqPayload {
  paymentData: any;
  paymentMethod: string;
}

console.info("server started");

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const { paymentData, paymentMethod }: reqPayload = await req.json();
  
  try {
    // Validar dados obrigatórios
    if (!paymentData || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'Dados de pagamento obrigatórios' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json', 
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json', 
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
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
    }

    // Adicionar campos específicos para cartão
    if (paymentMethod === 'card') {
      payload.token = paymentData.token
      payload.installments = paymentData.installments || 1
      payload.issuer_id = paymentData.issuer_id
    }

    // Gerar chave de idempotência
    const idempotencyKey = `${paymentData.payer.email}-${Date.now()}`

    // Fazer chamada para API do Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Erro Mercado Pago:', result)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar pagamento',
          details: result 
        }),
        { 
          status: response.status, 
          headers: { 
            'Content-Type': 'application/json', 
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Salvar pagamento no banco de dados
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extrair user_id do JWT token (se disponível) ou usar email como fallback
    const authHeader = req.headers.get('authorization')
    let userId = null
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id
      } catch (error) {
        console.log('Erro ao extrair user do token:', error)
      }
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
      })

    if (dbError) {
      console.error('Erro ao salvar pagamento no banco:', dbError)
      // Não falhar a requisição, apenas logar o erro
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          'Content-Type': 'application/json', 
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json', 
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
});
