import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    try {
      await signIn(email, password)
      toast.success('Login realizado com sucesso!')
      navigate('/app/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
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

      <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center p-8">
        {/* Logo and Title */}
        <div className="text-center mb-4">
          <div className="flex flex-col items-center">
            <img 
              src="/LogoNanoSyncBranca.png" 
              alt="Logo" 
              className="w-80 h-80 -mb-24 object-contain mb-01"
            />
            <p className="text-xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
              Sistema Inteligente de Relacionamento com Clientes — da captura ao fechamento, IA que trabalha por você.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-purple-700 rounded-3xl blur opacity-20"></div>
          <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>
                Faça login para acessar o sistema
              </CardDescription>
            </CardHeader>
            
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

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
                
                <div className="text-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Não tem uma conta?{' '}
                  </span>
                  <Link
                    to="/register"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                  >
                    Cadastre-se
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          <p className="text-center mt-6 text-sm text-white/60">
            © 2024 NanoSync. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
