import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Settings, User, Check, Loader2, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { 
  useConfiguracoes, 
  useProfile, 
  useUpdateProfile,
  useUpdateDetalhesEmpresa
} from '@/hooks/useConfiguracoes'
import { useIAConfig } from '@/hooks/useIAConfig'

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
  const { isLoading: loadingConfiguracoes } = useConfiguracoes()
  const { data: profileData, isLoading: loadingProfile } = useProfile()
  const { data: iaConfigData } = useIAConfig()
  const updateProfile = useUpdateProfile()
  const updateDetalhesEmpresaMutation = useUpdateDetalhesEmpresa()
  
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    email: '',
    phone: '',
    cargo: ''
  })
  
  const [detalhesEmpresa, setDetalhesEmpresa] = useState({
    contatos: {
      telefone: '',
      email: '',
      whatsapp: '',
      endereco: ''
    },
    redes_sociais: {
      website: '',
      facebook: '',
      linkedin: '',
      instagram: ''
    }
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
      
      // Atualizar telefone em detalhes da empresa se existir no perfil
      if (profileData.telefone) {
        setDetalhesEmpresa(prev => ({
          ...prev,
          contatos: {
            ...prev.contatos,
            telefone: profileData.telefone
          }
        }))
      }
    }
  }, [profileData])

  // Carregar detalhes da empresa salvos no ia_config
  useEffect(() => {
    if (iaConfigData?.detalhes_empresa) {
      setDetalhesEmpresa({
        contatos: {
          telefone: iaConfigData.detalhes_empresa.contatos?.telefone || '',
          email: iaConfigData.detalhes_empresa.contatos?.email || '',
          whatsapp: iaConfigData.detalhes_empresa.contatos?.whatsapp || '',
          endereco: iaConfigData.detalhes_empresa.contatos?.endereco || ''
        },
        redes_sociais: {
          website: iaConfigData.detalhes_empresa.redes_sociais?.website || '',
          facebook: iaConfigData.detalhes_empresa.redes_sociais?.facebook || '',
          linkedin: iaConfigData.detalhes_empresa.redes_sociais?.linkedin || '',
          instagram: iaConfigData.detalhes_empresa.redes_sociais?.instagram || ''
        }
      })
    }
  }, [iaConfigData])


  const handleSaveProfile = () => {
    if (!user?.id) return
    updateProfile.mutate(profile)
  }

  const handleSaveDetalhesEmpresa = () => {
    // Adicionar o email do perfil aos detalhes da empresa
    const detalhesComEmail = {
      ...detalhesEmpresa,
      contatos: {
        ...detalhesEmpresa.contatos,
        email: profile.email || profileData?.email || ''
      }
    }
    updateDetalhesEmpresaMutation.mutate(detalhesComEmail)
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
                variant={activeSection === 'empresa' ? 'default' : 'ghost'} 
                className={cn(
                  "w-full justify-start",
                  activeSection === 'empresa' && "bg-primary text-white"
                )}
                onClick={() => setActiveSection('empresa')}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Detalhes da Empresa
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
                          value={profileData?.role === 'admin' ? 'Administrador' : 'Vendedor'}
                          disabled
                          className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
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

          {/* Company Details Settings */}
          {activeSection === 'empresa' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Detalhes da Empresa
                </CardTitle>
                <CardDescription>
                  Configure as informações da sua empresa para uso na IA.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Contatos</h4>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="empresa_telefone">Telefone</Label>
                        <Input 
                          id="empresa_telefone" 
                          placeholder="(11) 99999-9999"
                          value={detalhesEmpresa.contatos.telefone}
                          onChange={(e) => setDetalhesEmpresa({
                            ...detalhesEmpresa,
                            contatos: { ...detalhesEmpresa.contatos, telefone: formatPhone(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="empresa_whatsapp">WhatsApp</Label>
                        <Input 
                          id="empresa_whatsapp" 
                          placeholder="(11) 99999-9999"
                          value={detalhesEmpresa.contatos.whatsapp}
                          onChange={(e) => setDetalhesEmpresa({
                            ...detalhesEmpresa,
                            contatos: { ...detalhesEmpresa.contatos, whatsapp: formatPhone(e.target.value) }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Endereço</h4>
                    <div className="grid gap-2">
                      <Label htmlFor="empresa_endereco">Endereço Completo</Label>
                      <Input 
                        id="empresa_endereco" 
                        placeholder="Rua, número, bairro, cidade - UF"
                        value={detalhesEmpresa.contatos.endereco}
                        onChange={(e) => setDetalhesEmpresa({
                          ...detalhesEmpresa,
                          contatos: { ...detalhesEmpresa.contatos, endereco: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Redes Sociais</h4>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="empresa_website">Website</Label>
                        <Input 
                          id="empresa_website" 
                          placeholder="https://www.suaempresa.com"
                          value={detalhesEmpresa.redes_sociais.website}
                          onChange={(e) => setDetalhesEmpresa({
                            ...detalhesEmpresa,
                            redes_sociais: { ...detalhesEmpresa.redes_sociais, website: e.target.value }
                          })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="empresa_facebook">Facebook</Label>
                        <Input 
                          id="empresa_facebook" 
                          placeholder="https://facebook.com/suaempresa"
                          value={detalhesEmpresa.redes_sociais.facebook}
                          onChange={(e) => setDetalhesEmpresa({
                            ...detalhesEmpresa,
                            redes_sociais: { ...detalhesEmpresa.redes_sociais, facebook: e.target.value }
                          })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="empresa_linkedin">LinkedIn</Label>
                        <Input 
                          id="empresa_linkedin" 
                          placeholder="https://linkedin.com/company/suaempresa"
                          value={detalhesEmpresa.redes_sociais.linkedin}
                          onChange={(e) => setDetalhesEmpresa({
                            ...detalhesEmpresa,
                            redes_sociais: { ...detalhesEmpresa.redes_sociais, linkedin: e.target.value }
                          })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="empresa_instagram">Instagram</Label>
                        <Input 
                          id="empresa_instagram" 
                          placeholder="https://instagram.com/suaempresa"
                          value={detalhesEmpresa.redes_sociais.instagram}
                          onChange={(e) => setDetalhesEmpresa({
                            ...detalhesEmpresa,
                            redes_sociais: { ...detalhesEmpresa.redes_sociais, instagram: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleSaveDetalhesEmpresa}
                  disabled={updateDetalhesEmpresaMutation.isPending}
                >
                  {updateDetalhesEmpresaMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Salvar Detalhes da Empresa
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
