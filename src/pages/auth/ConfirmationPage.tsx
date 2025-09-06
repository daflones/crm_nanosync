import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type ConfirmationStatus = 'loading' | 'success' | 'error' | 'expired'

export function ConfirmationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<ConfirmationStatus>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || !type) {
          setStatus('error')
          setMessage('Link inválido ou parâmetros ausentes.')
          return
        }

        if (type === 'signup') {
          // Confirmação de cadastro
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) {
            if (error.message.includes('expired')) {
              setStatus('expired')
              setMessage('O link de confirmação expirou. Solicite um novo link.')
            } else {
              setStatus('error')
              setMessage('Erro ao confirmar conta: ' + error.message)
            }
          } else {
            setStatus('success')
            setMessage('Conta confirmada com sucesso! Seu perfil foi criado automaticamente. Você já pode fazer login.')
            
            // Aguardar um pouco para garantir que o trigger criou o perfil
            setTimeout(() => {
              navigate('/login')
            }, 2000)
          }
        } else if (type === 'recovery') {
          // Recuperação de senha - redirecionar para página de reset
          navigate(`/reset-password?token=${token}`)
          return
        } else {
          setStatus('error')
          setMessage('Tipo de confirmação não reconhecido.')
        }
      } catch (error) {
        console.error('Erro na confirmação:', error)
        setStatus('error')
        setMessage('Ocorreu um erro inesperado. Tente novamente.')
      }
    }

    handleConfirmation()
  }, [searchParams, navigate])

  const handleGoToLogin = () => {
    navigate('/login')
  }

  const handleResendConfirmation = async () => {
    // Implementar reenvio de confirmação se necessário
    setMessage('Para reenviar a confirmação, faça login novamente.')
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Confirmando sua conta...
            </h2>
            <p className="text-gray-600">
              Aguarde enquanto processamos sua confirmação.
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Conta Confirmada! 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <Button 
              onClick={handleGoToLogin}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
            >
              Fazer Login
            </Button>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <div className="flex flex-col items-center mb-4">
              <img 
                src="/Logo.ico" 
                alt="Logo" 
                className="w-20 h-20 mb-2 object-contain"
              />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                CRM
              </h1>
            </div>
            <p className="text-white/80 mb-8">
              Sistema de Gestão de Relacionamento
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleResendConfirmation}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 w-full"
              >
                Reenviar Confirmação
              </Button>
              <Button 
                variant="outline"
                onClick={handleGoToLogin}
                className="w-full"
              >
                Voltar ao Login
              </Button>
            </div>
          </div>
        )

      case 'error':
      default:
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Erro na Confirmação
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <Button 
              variant="outline"
              onClick={handleGoToLogin}
              className="px-8 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">InovaPet CRM</h1>
          <p className="text-gray-600">Sistema de Gestão Veterinária</p>
        </div>

        {/* Confirmation Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Confirmação de Conta</CardTitle>
            <CardDescription>
              Processando sua solicitação
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {renderContent()}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Precisa de ajuda?</p>
          <a 
            href="mailto:suporte@inovapet.com" 
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Entre em contato conosco
          </a>
        </div>
      </div>
    </div>
  )
}
