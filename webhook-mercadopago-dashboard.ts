// Webhook handler for Mercado Pago payment notifications
// Copy this code directly into Supabase Dashboard > Edge Functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Mercado Pago access token
    const mercadoPagoToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse webhook payload
    const body = await req.json()
    console.log('Webhook recebido:', JSON.stringify(body, null, 2))

    // Validate webhook structure
    if (!body.type || !body.data?.id) {
      console.log('Webhook inválido - estrutura incorreta')
      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Process only payment events
    if (body.type !== 'payment') {
      console.log(`Evento ignorado: ${body.type}`)
      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    const paymentId = body.data.id
    console.log(`Processando pagamento ID: ${paymentId}`)

    // Fetch payment details from Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mpResponse.ok) {
      console.error(`Erro ao buscar pagamento ${paymentId}:`, mpResponse.status)
      return new Response('Error fetching payment', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    const paymentData = await mpResponse.json()
    console.log(`Dados do pagamento:`, JSON.stringify(paymentData, null, 2))

    // Update payment status in database
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('mercadopago_payment_id', paymentId)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar pagamento no banco:', fetchError)
      return new Response('Database error', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    if (!existingPayment) {
      console.log(`Pagamento ${paymentId} não encontrado no banco de dados`)
      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        mercadopago_data: paymentData,
        updated_at: new Date().toISOString()
      })
      .eq('mercadopago_payment_id', paymentId)

    if (updateError) {
      console.error('Erro ao atualizar pagamento:', updateError)
      return new Response('Update error', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    console.log(`Pagamento ${paymentId} atualizado com status: ${paymentData.status}`)

    // If payment is approved, activate user subscription
    if (paymentData.status === 'approved') {
      console.log(`Pagamento aprovado - ativando assinatura para usuário ${existingPayment.user_id}`)
      
      // Update user subscription status
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: existingPayment.user_id,
          plan_id: existingPayment.plan_id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          payment_id: existingPayment.id,
          updated_at: new Date().toISOString()
        })

      if (subscriptionError) {
        console.error('Erro ao ativar assinatura:', subscriptionError)
        // Don't fail the webhook, just log the error
      } else {
        console.log('Assinatura ativada com sucesso')
      }
    }

    // Always return 200 OK to acknowledge webhook receipt
    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})
