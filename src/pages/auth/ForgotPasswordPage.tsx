import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

export function ForgotPasswordPage() {
  const { resetPassword, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Por favor, informe seu e-mail')
      return
    }

    try {
      await resetPassword(email)
      setEmailSent(true)
      toast.success('E-mail de recuperação enviado!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar e-mail de recuperação')
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated Background - Using CRM gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 w-full h-full">
        <div className="absolute inset-0 opacity-20 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 min-h-screen w-full grid lg:grid-cols-2 items-center p-8 lg:p-12 xl:p-16 2xl:p-20">
        <div className="hidden lg:flex relative w-full h-full items-center justify-center">
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-12 xl:p-16 2xl:p-20 border border-white/20 shadow-2xl w-full max-w-none">
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-6xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6 leading-tight">
                  Recupere sua Conta
                </h1>
                <p className="text-xl text-white/90 mb-8 font-light">
                  Não se preocupe, vamos ajudá-lo a recuperar o acesso à sua conta
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-3 text-lg">Segurança Garantida</h3>
                <p className="text-white/80 text-sm leading-relaxed">Seus dados estão protegidos. O link de recuperação será enviado apenas para o e-mail cadastrado em sua conta.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-md xl:max-w-lg 2xl:max-w-xl">
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-2">
                NanoSync (CRM)
              </h1>
              <p className="text-white/80">
                Sistema de Gestão de Relacionamento
              </p>
            </div>

          <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
            <CardDescription>
              {emailSent 
                ? 'Verifique seu e-mail para redefinir sua senha'
                : 'Informe seu e-mail para receber o link de recuperação'
              }
            </CardDescription>
          </CardHeader>
          
          {!emailSent ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Link de Recuperação
                    </>
                  )}
                </Button>

                <Link
                  to="/login"
                  className="w-full"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Button>
                </Link>
              </CardFooter>
            </form>
          ) : (
            <CardContent>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Um e-mail foi enviado para <strong>{email}</strong> com instruções para redefinir sua senha.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          )}
        </Card>

            <p className="text-center mt-6 text-sm text-white/60">
              © 2024 NanoSync. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
