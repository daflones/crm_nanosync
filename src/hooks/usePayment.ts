import { useState } from 'react'
import { processPayment, createSubscription, type PaymentData } from '@/services/api/mercadopago'
import { toast } from 'sonner'

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const processCardPayment = async (
    formData: any,
    additionalData: any,
    userId: string,
    planId: string,
    planName: string
  ) => {
    setIsProcessing(true)
    setError(null)

    try {
      const paymentData: PaymentData = {
        transaction_amount: Number(formData.transaction_amount),
        token: formData.token,
        description: `Assinatura ${planName}`,
        installments: Number(formData.installments),
        payment_method_id: formData.payment_method_id,
        payer: {
          email: formData.payer.email,
          identification: formData.payer.identification
        },
        external_reference: userId,
        plan_id: planId,
        plan_name: planName
      }

      // Processar pagamento
      const result = await processPayment(paymentData)
      setPaymentResult(result)

      // Verificar status (Payments API retorna direto o payment)
      if (result.status === 'approved') {
        // Criar assinatura
        const subscriptionResult = await createSubscription(
          userId,
          planId,
          String(result.id),
          Number(result.transaction_amount)
        )
        
        // Adicionar data de expiração ao resultado
        const resultWithExpiration = {
          ...result,
          subscription_expiration: subscriptionResult.data?.expiration_date
        }
        
        toast.success('Pagamento aprovado! Sua assinatura foi ativada.')
        return { success: true, result: resultWithExpiration }
      } else if (result.status === 'pending' || result.status === 'in_process') {
        toast.info('Pagamento em processamento. Aguarde a confirmação.')
        return { success: false, result, pending: true }
      } else {
        const errorMsg = result.status_detail || 'Pagamento recusado'
        toast.error(errorMsg)
        setError(errorMsg)
        return { success: false, result, error: errorMsg }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao processar pagamento'
      setError(errorMsg)
      toast.error(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsProcessing(false)
    }
  }

  const resetPayment = () => {
    setPaymentResult(null)
    setError(null)
    setIsProcessing(false)
  }

  return {
    processCardPayment,
    isProcessing,
    paymentResult,
    error,
    resetPayment
  }
}
