import { supabase } from '@/lib/supabase'

export interface PaymentData {
  transaction_amount: number
  token: string
  description: string
  installments: number
  payment_method_id: string
  payer: {
    email: string
    identification?: {
      type: string
      number: string
    }
  }
  external_reference?: string
  plan_id?: string
  plan_name?: string
}

export interface PaymentResponse {
  id: string
  status: string
  status_detail: string
  external_reference?: string
  transaction_amount: number
  description: string
  payment_method_id: string
  payment_type_id: string
  date_approved?: string
  date_last_updated?: string
  payer: {
    email: string
    identification?: {
      type: string
      number: string
    }
  }
  card?: {
    first_six_digits: string
    last_four_digits: string
    cardholder: {
      name: string
    }
  }
  transaction_details?: {
    net_received_amount: number
    total_paid_amount: number
    overpaid_amount: number
    installment_amount: number
    financial_institution: string
  }
}

/**
 * Processa o pagamento via Mercado Pago
 * Esta função deve ser chamada do backend (Supabase Edge Function)
 */
export const processPayment = async (paymentData: PaymentData): Promise<PaymentResponse> => {
  try {
    // Chamar Edge Function do Supabase que irá processar o pagamento
    const { data, error } = await supabase.functions.invoke('process-payment', {
      body: paymentData
    })

    if (error) {
      console.error('Erro ao processar pagamento:', error)
      throw new Error(error.message || 'Erro ao processar pagamento')
    }

    return data as PaymentResponse
  } catch (error) {
    console.error('Erro na requisição de pagamento:', error)
    throw error
  }
}

/**
 * Cria uma assinatura após pagamento aprovado
 */
export const createSubscription = async (
  userId: string,
  planId: string,
  paymentId: string,
  amount: number
) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        payment_id: paymentId,
        amount: amount,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return { data: null, error }
  }
}

/**
 * Verifica o status de um pagamento
 */
export const checkPaymentStatus = async (paymentId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('check-payment-status', {
      body: { paymentId }
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error)
    return { data: null, error }
  }
}
