import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CardPaymentBrickProps {
  amount: number
  onSubmit: (formData: any, additionalData: any) => Promise<void>
  onReady?: () => void
  onError?: (error: any) => void
}

declare global {
  interface Window {
    MercadoPago: any
    cardPaymentBrickController: any
  }
}

export function CardPaymentBrick({ amount, onSubmit, onReady, onError }: CardPaymentBrickProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Prevenir inicialização dupla (React StrictMode)
    if (isInitialized) return

    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY

    if (!publicKey) {
      setSdkError('Chave pública do Mercado Pago não configurada')
      setIsLoading(false)
      return
    }

    // Verificar se já existe um brick montado
    if (window.cardPaymentBrickController) {
      try {
        window.cardPaymentBrickController.unmount()
      } catch (e) {
        // Brick unmount error
      }
    }

    // Verificar se o script já foi carregado
    const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]')
    
    const initializeBrick = async () => {
      try {
        setIsInitialized(true)
        
        // Inicializar Mercado Pago
        const mp = new window.MercadoPago(publicKey, {
          locale: 'pt-BR'
        })

        // Criar bricks builder
        const bricksBuilder = mp.bricks()

        // Configurar e renderizar Card Payment Brick
        const settings = {
          initialization: {
            amount: amount,
          },
          callbacks: {
            onReady: () => {
              setIsLoading(false)
              if (onReady) onReady()
            },
            onSubmit: async (formData: any, additionalData: any) => {
              try {
                await onSubmit(formData, additionalData)
              } catch (error) {
                console.error('Erro ao processar pagamento:', error)
                if (onError) onError(error)
              }
            },
            onError: (error: any) => {
              console.error('Erro no Card Payment Brick:', error)
              
              // Mensagens de erro mais amigáveis
              let errorMessage = 'Erro ao processar pagamento'
              
              if (error.cause === 'secure_fields_card_token_creation_failed') {
                errorMessage = 'Erro ao validar cartão. Verifique os dados e tente novamente.'
              } else if (error.message) {
                errorMessage = error.message
              }
              
              console.error('Detalhes do erro:', {
                cause: error.cause,
                message: error.message,
                type: error.type
              })
              
              if (onError) onError(error)
            },
          },
          customization: {
            visual: {
              style: {
                theme: 'default',
              },
            },
          },
        }

        // Criar o brick
        window.cardPaymentBrickController = await bricksBuilder.create(
          'cardPayment',
          'cardPaymentBrick_container',
          settings
        )
      } catch (error) {
        console.error('Erro ao inicializar Card Payment Brick:', error)
        setSdkError('Erro ao carregar formulário de pagamento')
        setIsLoading(false)
        if (onError) onError(error)
      }
    }

    if (existingScript && window.MercadoPago) {
      // Script já carregado, inicializar diretamente
      initializeBrick()
    } else {
      // Carregar SDK do Mercado Pago
      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.async = true
      
      script.onload = () => {
        initializeBrick()
      }

      script.onerror = () => {
        setSdkError('Erro ao carregar SDK do Mercado Pago')
        setIsLoading(false)
      }

      document.body.appendChild(script)
    }

    // Cleanup
    return () => {
      if (window.cardPaymentBrickController) {
        try {
          window.cardPaymentBrickController.unmount()
        } catch (e) {
          // Unmount error
        }
      }
    }
  }, [amount, onSubmit, onReady, onError, isInitialized])

  if (sdkError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{sdkError}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Carregando formulário de pagamento...</span>
        </div>
      )}
      <div id="cardPaymentBrick_container" className={isLoading ? 'hidden' : ''} style={{ overflow: 'hidden' }} />
      <style>{`
        #cardPaymentBrick_container > div:last-child {
          display: none !important;
        }
        #cardPaymentBrick_container .skeleton,
        #cardPaymentBrick_container [class*="skeleton"],
        #cardPaymentBrick_container [class*="loading"] {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
