import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, loading } = useAuthStore()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Nome completo é obrigatório')
      return false
    }
    if (!formData.email) {
      toast.error('E-mail é obrigatório')
      return false
    }
    if (formData.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Senhas não coincidem')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await signUp(formData.email, formData.password, formData.fullName)
      toast.success('Conta criada com sucesso! Verifique seu e-mail para confirmar sua conta antes de fazer login.')
      navigate('/login')
    } catch (error: any) {
      console.error('Erro no handleSubmit:', error)
      toast.error(error.message || 'Erro ao criar conta')
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

      <div className="relative z-10 min-h-screen w-full grid lg:grid-cols-2 items-center">
          
          {/* Left side - Branding with depth */}
          <div className="hidden lg:flex relative p-8 lg:p-16 xl:p-20 2xl:p-24 w-full h-full items-center">
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-12 xl:p-16 2xl:p-20 border border-white/20 shadow-2xl w-full max-w-none">
            <div className="text-center space-y-2">
              <div>
                <div className="flex flex-col items-center -mt-24">
                  <img 
                    src="/LogoNanoSyncBranca.png" 
                    alt="Logo" 
                    className="w-96 h-96 object-contain -mb-24"
                  />
                  <h1 className="text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight mb-2">
                    Bem-vindo ao NanoSync
                  </h1>
                </div>
                <p className="text-lg text-white/90 mb-2 font-light leading-relaxed">
                  O CRM inteligente que conecta leads, agenda e WhatsApp para automatizar todo o seu fluxo de vendas — da captura ao fechamento.
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-12">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-2">Gestão Inteligente</h3>
                  <p className="text-white/80 text-sm">Organize, acompanhe e qualifique seus leads com automação integrada ao WhatsApp e agendamentos automáticos.</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-2">Análises Avançadas</h3>
                  <p className="text-white/80 text-sm">Acompanhe métricas, conversões e performance em tempo real com dashboards claros e relatórios inteligentes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Right side - Register Form with depth */}
          <div className="flex justify-center items-center relative p-8 lg:p-16 xl:p-20 2xl:p-24 w-full h-full">
            <div className="relative w-full max-w-md xl:max-w-lg 2xl:max-w-xl">
            <div className="lg:hidden text-center mb-8">
              <img 
                src="/LogoNanoSyncBranca.png" 
                alt="Logo" 
                className="w-56 h-56 mx-auto -mb-16 object-contain"
              />
              <p className="text-white/80">
                CRM Inteligente
              </p>
            </div>

              {/* Register form with enhanced depth */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-purple-700 rounded-3xl blur opacity-20"></div>
                <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden w-full">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Link 
                  to="/login"
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-500" />
                </Link>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <UserPlus className="h-6 w-6 text-primary-600" />
                    Criar Conta
                  </CardTitle>
                  <CardDescription>
                    Cadastre-se para acessar o sistema
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
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
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
                <p className="text-xs text-gray-500">Mínimo de 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
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
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Conta
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Já tem uma conta?{' '}
                </span>
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Faça login
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
