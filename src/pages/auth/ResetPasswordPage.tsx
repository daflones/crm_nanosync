import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError('Erro ao redefinir senha: ' + error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
        
        <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <img 
                src="/LogoNanoSyncBranca.png" 
                alt="Logo" 
                className="w-32 h-32 mx-auto mb-4 object-contain"
              />
              <p className="text-xl text-white/90 font-light">
                Sistema Inteligente de Relacionamento com Clientes
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-purple-700 rounded-3xl blur opacity-20"></div>
              <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Senha Redefinida! 🎉
                </h2>
                <p className="text-gray-600 mb-6">
                  Sua senha foi alterada com sucesso. Você será redirecionado para o login em alguns segundos.
                </p>
                <Button 
                  onClick={() => navigate('/login')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
                >
                  Fazer Login Agora
                </Button>
              </div>
            </CardContent>
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
      
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/LogoNanoSyncBranca.png" 
              alt="Logo" 
              className="w-32 h-32 mx-auto mb-4 object-contain"
            />
            <p className="text-xl text-white/90 font-light">
              Sistema Inteligente de Relacionamento com Clientes
            </p>
          </div>

          {/* Reset Password Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-purple-700 rounded-3xl blur opacity-20"></div>
            <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">Requisitos da senha:</p>
                <ul className="space-y-1">
                  <li className={password.length >= 6 ? 'text-green-600' : ''}>
                    • Mínimo de 6 caracteres
                  </li>
                  <li className={password === confirmPassword && password ? 'text-green-600' : ''}>
                    • Senhas devem coincidir
                  </li>
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center mt-6 text-sm text-white/60">
            <p>Lembrou da sua senha?</p>
            <button 
              onClick={() => navigate('/login')}
              className="text-white/80 hover:text-white font-medium"
            >
              Voltar ao Login
            </button>
          </div>
          
          <p className="text-center mt-6 text-sm text-white/60">
            © 2024 NanoSync. Todos os direitos reservados.
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
