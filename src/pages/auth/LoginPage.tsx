import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, Users, FileText, Calendar, Package } from 'lucide-react'
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
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 w-full h-full">
        <div className="absolute inset-0 opacity-20 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen w-full grid lg:grid-cols-2 items-center">
          
          {/* Left side - Branding with depth */}
          <div className="hidden lg:flex relative p-8 lg:p-16 xl:p-20 2xl:p-24 w-full h-full items-center">
            <div className="relative bg-white/20 backdrop-blur-xl rounded-3xl p-12 xl:p-16 2xl:p-20 border border-white/30 shadow-2xl w-full max-w-none">
              <div className="text-center lg:text-left space-y-6">
                <div>
                  <div className="flex flex-col items-center lg:items-start mb-4">
                    <img 
                      src="/Logo.ico" 
                      alt="Logo" 
                      className="w-24 h-24 mb-2 object-contain"
                    />
                    <h1 className="text-6xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
                      CRM
                    </h1>
                  </div>
                  <p className="text-2xl text-white/90 mb-4 font-light">
                    Sistema de Gestão de Relacionamento com Clientes
                  </p>
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-1 text-sm">Gestão de Clientes</h3>
                      <p className="text-white/80 text-xs leading-relaxed">Controle completo da base de clientes</p>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-1 text-sm">Propostas</h3>
                      <p className="text-white/80 text-xs leading-relaxed">Gerencie propostas e vendas</p>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-1 text-sm">Agendamentos</h3>
                      <p className="text-white/80 text-xs leading-relaxed">Organize sua agenda</p>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-1 text-sm">Produtos</h3>
                      <p className="text-white/80 text-xs leading-relaxed">Catálogo de produtos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form with depth */}
          <div className="flex justify-center items-center relative p-8 lg:p-16 xl:p-20 2xl:p-24 w-full h-full">
            <div className="relative w-full max-w-md xl:max-w-lg 2xl:max-w-xl">
              <div className="lg:hidden text-center mb-8">
                <div className="flex flex-col items-center mb-4">
                  <img 
                    src="/Logo.ico" 
                    alt="Logo" 
                    className="w-32 h-32 mb-2 object-contain"
                  />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    CRM
                  </h1>
                </div>
                <p className="text-white/80">
                  Sistema de Gestão de Relacionamento
                </p>
              </div>

              {/* Login form with enhanced depth */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-20"></div>
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
      </div>
    </div>
  )
}
