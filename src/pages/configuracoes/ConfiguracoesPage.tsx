import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Settings, User, Bell, Palette, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { 
  useConfiguracoes, 
  useProfile, 
  useUpdateProfile, 
  useToggleConfig
} from '@/hooks/useConfiguracoes'

// Função para formatar telefone
const formatPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return value
}

interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  cargo?: string
  role: 'admin' | 'vendedor'
  status: 'ativo' | 'inativo'
  admin_profile_id?: string
  created_at: string
  updated_at: string
}

export function ConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState('perfil')
  const { user } = useAuthStore()
  
  // Usar hooks para dados e ações
  const { data: configuracoes, isLoading: loadingConfiguracoes } = useConfiguracoes()
  const { data: profileData, isLoading: loadingProfile } = useProfile()
  const updateProfile = useUpdateProfile()
  const toggleConfig = useToggleConfig()
  
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    email: '',
    phone: '',
    cargo: ''
  })
  

  const loading = loadingConfiguracoes || loadingProfile
  
  // Atualizar estado local quando os dados chegarem
  useEffect(() => {
    if (profileData) {
      setProfile({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        phone: profileData.telefone || '',
        cargo: profileData.cargo || ''
      })
    }
  }, [profileData])


  const handleSaveProfile = () => {
    if (!user?.id) return
    updateProfile.mutate(profile)
  }

  const handleToggleConfig = (key: string, value: boolean) => {
    toggleConfig.mutate({ key, value })
  }

  return (
    <div className="w-full h-full space-y-8">
      {/* Header */}
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie as configurações do sistema e preferências pessoais.
        </p>
      </div>

      <div className="w-full grid gap-8 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {/* Left sidebar - Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant={activeSection === 'perfil' ? 'default' : 'ghost'} 
                className={cn(
                  "w-full justify-start",
                  activeSection === 'perfil' && "bg-primary text-white"
                )}
                onClick={() => setActiveSection('perfil')}
              >
                <User className="w-4 h-4 mr-2" />
                Perfil
              </Button>
              <Button 
                variant={activeSection === 'notificacoes' ? 'default' : 'ghost'} 
                className={cn(
                  "w-full justify-start",
                  activeSection === 'notificacoes' && "bg-primary text-white"
                )}
                onClick={() => setActiveSection('notificacoes')}
              >
                <Bell className="w-4 h-4 mr-2" />
                Notificações
              </Button>
              <Button 
                variant={activeSection === 'aparencia' ? 'default' : 'ghost'} 
                className={cn(
                  "w-full justify-start",
                  activeSection === 'aparencia' && "bg-primary text-white"
                )}
                onClick={() => setActiveSection('aparencia')}
              >
                <Palette className="w-4 h-4 mr-2" />
                Aparência
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right content - Settings panels */}
        <div className="lg:col-span-2 xl:col-span-3 2xl:col-span-4 space-y-6">
          
          {/* Profile Settings */}
          {activeSection === 'perfil' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Perfil
                </CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais e dados do perfil.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nome da Empresa *</Label>
                        <Input 
                          id="name" 
                          placeholder="Nome da sua empresa"
                          value={profile.full_name}
                          onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="seu@email.com"
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input 
                          id="phone" 
                          placeholder="(11) 99999-9999"
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: formatPhone(e.target.value)})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">Cargo</Label>
                        <Input 
                          id="role" 
                          placeholder="Seu cargo na empresa"
                          value={profile.cargo}
                          onChange={(e) => setProfile({...profile, cargo: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleSaveProfile}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeSection === 'notificacoes' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure suas preferências de notificação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-gray-500">
                        Receba notificações importantes por email.
                      </p>
                    </div>
                    <Switch 
                      checked={configuracoes.notificacoes_email}
                      onCheckedChange={(checked) => handleToggleConfig('notificacoes_email', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Novos Clientes</Label>
                      <p className="text-sm text-gray-500">
                        Seja notificado quando novos clientes forem cadastrados.
                      </p>
                    </div>
                    <Switch 
                      checked={configuracoes.notificacoes_novos_clientes}
                      onCheckedChange={(checked) => handleToggleConfig('notificacoes_novos_clientes', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Propostas Vencendo</Label>
                      <p className="text-sm text-gray-500">
                        Receba alertas sobre propostas próximas do vencimento.
                      </p>
                    </div>
                    <Switch 
                      checked={configuracoes.notificacoes_propostas_vencendo}
                      onCheckedChange={(checked) => handleToggleConfig('notificacoes_propostas_vencendo', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Agendamentos</Label>
                      <p className="text-sm text-gray-500">
                        Notificações sobre agendamentos e compromissos.
                      </p>
                    </div>
                    <Switch 
                      checked={configuracoes.notificacoes_agendamentos}
                      onCheckedChange={(checked) => handleToggleConfig('notificacoes_agendamentos', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Appearance Settings */}
          {activeSection === 'aparencia' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Aparência
                </CardTitle>
                <CardDescription>
                  Personalize a aparência do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Tema Escuro</Label>
                      <p className="text-sm text-gray-500">
                        Ative o tema escuro para reduzir o cansaço visual.
                      </p>
                    </div>
                    <Switch 
                      checked={configuracoes.tema === 'dark'}
                      onCheckedChange={(checked) => handleToggleConfig('tema' as any, checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
