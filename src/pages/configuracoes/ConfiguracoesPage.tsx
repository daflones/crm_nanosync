import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useNotifications } from '@/contexts/NotificationContext'
import { cn } from '@/lib/utils'
import { 
  Settings, 
  User, 
  Bell, 
  Palette, 
  Bot,
  Loader2,
  Check
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  getConfiguracoes,
  upsertConfiguracoes,
  updateProfile,
  getProfile,
} from '@/services/api/configuracoes'
import {
  getIAConfig,
  upsertIAConfig,
  testIAConfig,
  type IAConfig
} from '@/services/api/ia-config'
import type { Configuracoes } from '@/services/api/configuracoes'

type Section = 'perfil' | 'notificacoes' | 'aparencia' | 'ia'

export function ConfiguracoesPage() {
  const { user } = useAuthStore()
  
  // Estado para navegação
  const [activeSection, setActiveSection] = useState<Section>('perfil')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const { createDatabaseNotification } = useNotifications()
  
  // Estado do perfil
  const [profile, setProfile] = useState({
    full_name: '',
    email: user?.email || '',
    phone: '',
    cargo: ''
  })
  
  // Estado das configurações
  const [configuracoes, setConfiguracoes] = useState<Partial<Configuracoes>>({
    notificacoes_email: true,
    notificacoes_novos_clientes: true,
    notificacoes_propostas_vencendo: true,
    notificacoes_agendamentos: true,
    tema: 'light',
    idioma: 'pt-BR'
  })

  // Estado das configurações IA
  const [iaConfig, setIaConfig] = useState<Partial<IAConfig>>({
    contexto_ia: 'Você é um assistente inteligente especializado em vendas e atendimento ao cliente para a empresa. Seja sempre prestativo, profissional e focado em ajudar o cliente.',
    tom_fala: 'profissional',
    regras_especificas: 'Sempre confirme informações importantes antes de prosseguir. Seja claro e objetivo nas respostas.',
    regras_adicionais: '',
    tamanho_textos: 'medio',
    usar_emojis: true,
    tempo_resposta_ms: 2000,
    mensagem_ausencia: 'No momento estou fora do horário de atendimento. Deixe sua mensagem que retornarei assim que possível.',
    horarios_funcionamento: {
      segunda: { inicio: '08:00', fim: '18:00', ativo: true },
      terca: { inicio: '08:00', fim: '18:00', ativo: true },
      quarta: { inicio: '08:00', fim: '18:00', ativo: true },
      quinta: { inicio: '08:00', fim: '18:00', ativo: true },
      sexta: { inicio: '08:00', fim: '18:00', ativo: true },
      sabado: { inicio: '08:00', fim: '12:00', ativo: false },
      domingo: { inicio: '08:00', fim: '12:00', ativo: false }
    },
    detalhes_empresa: {
      sobre_empresa: '',
      missao: '',
      visao: '',
      valores: '',
      produtos_servicos: [],
      diferenciais_competitivos: [],
      publico_alvo: '',
      segmento_mercado: '',
      anos_mercado: null,
      numero_funcionarios: null,
      certificacoes: [],
      premios_reconhecimentos: [],
      politicas_empresa: {
        politica_vendas: '',
        politica_devolucao: '',
        politica_garantia: '',
        politica_privacidade: '',
        termos_uso: ''
      },
      processos_internos: {
        processo_vendas: '',
        processo_atendimento: '',
        processo_pos_venda: '',
        tempo_entrega: '',
        formas_pagamento: []
      },
      contatos: {
        telefone: '',
        email: '',
        whatsapp: '',
        endereco: ''
      },
      redes_sociais: {
        website: '',
        instagram: '',
        linkedin: '',
        facebook: ''
      }
    }
  })
  
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    loadData()
  }, [user])
  
  const loadData = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      // Carregar configurações
      const { data: configData } = await getConfiguracoes(user.id)
      if (configData) {
        setConfiguracoes(configData)
        
        // Aplicar tema se existir
        if (configData.tema) {
          document.documentElement.classList.toggle('dark', configData.tema === 'dark')
        }
      }
      
      // Carregar perfil
      const { data: profileData } = await getProfile(user.id)
      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
          cargo: profileData.cargo || ''
        })
      }

      // Carregar configurações IA
      const { data: iaConfigData } = await getIAConfig(user.id)
      if (iaConfigData) {
        setIaConfig(iaConfigData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }
  
  // Salvar perfil
  const handleSaveProfile = async () => {
    if (!user?.id) return
    
    // Validações
    if (!profile.full_name || !profile.email) {
      toast.error('Nome e e-mail são obrigatórios')
      return
    }
    
    // Validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(profile.email)) {
      toast.error('E-mail inválido')
      return
    }
    
    // Validar telefone se preenchido
    if (profile.phone) {
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/
      if (!phoneRegex.test(profile.phone)) {
        toast.error('Telefone deve estar no formato (11) 99999-9999')
        return
      }
    }
    
    setSaving(true)
    try {
      const { error } = await updateProfile(user.id, profile)
      if (error) throw error
      
      toast.success('Perfil atualizado com sucesso!')
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'sistema',
        categoria: 'sistema',
        titulo: 'Perfil Atualizado',
        descricao: 'Perfil do usuário foi atualizado com sucesso',
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }
  
  // Salvar configuração individual
  const handleToggleConfig = async (key: keyof Configuracoes, value: boolean) => {
    if (!user?.id) return
    
    const updatedConfig = { ...configuracoes, [key]: value }
    setConfiguracoes(updatedConfig)
    
    // Aplicar tema imediatamente se for alteração de tema
    if (key === 'tema') {
      const newTheme = value ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      updatedConfig.tema = newTheme
    }
    
    try {
      const { error } = await upsertConfiguracoes(user.id, updatedConfig)
      if (error) throw error
      
      toast.success('Configuração salva')
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'sistema',
        categoria: 'sistema',
        titulo: 'Configuração Alterada',
        descricao: `Configuração "${key}" foi alterada`,
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast.error('Erro ao salvar configuração')
      // Reverter em caso de erro
      setConfiguracoes(configuracoes)
      if (key === 'tema') {
        document.documentElement.classList.toggle('dark', configuracoes.tema === 'dark')
      }
    }
  }
  
  
  // Salvar configurações IA
  const handleSaveIAConfig = async () => {
    if (!user?.id) return
    
    setSaving(true)
    try {
      const { error } = await upsertIAConfig(user.id, iaConfig)
      if (error) throw error
      
      toast.success('Configurações IA salvas com sucesso!')
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'sistema',
        categoria: 'sistema',
        titulo: 'Configurações IA Atualizadas',
        descricao: 'Configurações de IA foram atualizadas com sucesso',
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro ao salvar configurações IA:', error)
      toast.error('Erro ao salvar configurações IA')
    } finally {
      setSaving(false)
    }
  }

  // Testar configurações IA
  const handleTestIA = async () => {
    setSaving(true)
    try {
      const result = await testIAConfig(iaConfig) as { success: boolean; message: string }
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error('Erro ao testar configurações IA')
      }
    } catch (error) {
      console.error('Erro ao testar IA:', error)
      toast.error('Erro ao testar configurações IA')
    } finally {
      setSaving(false)
    }
  }
  
  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
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
              <Button 
                variant={activeSection === 'ia' ? 'default' : 'ghost'} 
                className={cn(
                  "w-full justify-start",
                  activeSection === 'ia' && "bg-primary text-white"
                )}
                onClick={() => setActiveSection('ia')}
              >
                <Bot className="w-4 h-4 mr-2" />
                Configurações IA
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
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input 
                          id="name" 
                          placeholder="Seu nome completo"
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
                      disabled={saving}
                    >
                      {saving ? (
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

          {/* IA Settings */}
          {activeSection === 'ia' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Configurações IA
                </CardTitle>
                <CardDescription>
                  Configure o comportamento e personalidade do assistente de IA.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Contexto e Personalidade */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Contexto e Personalidade</h4>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="contexto-ia">Contexto da IA</Label>
                          <Textarea
                            id="contexto-ia"
                            placeholder="Descreva o contexto e papel da IA..."
                            value={iaConfig.contexto_ia || ''}
                            onChange={(e) => setIaConfig({...iaConfig, contexto_ia: e.target.value})}
                            rows={3}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="tom-fala">Tom de Fala</Label>
                          <Select 
                            value={iaConfig.tom_fala || 'profissional'} 
                            onValueChange={(value) => setIaConfig({...iaConfig, tom_fala: value as any})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tom de fala" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="profissional">Profissional</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="amigavel">Amigável</SelectItem>
                              <SelectItem value="tecnico">Técnico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Regras e Comportamentos */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Regras e Comportamentos</h4>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="regras-especificas">Regras Específicas</Label>
                          <Textarea
                            id="regras-especificas"
                            placeholder="Defina regras específicas para a IA seguir..."
                            value={iaConfig.regras_especificas || ''}
                            onChange={(e) => setIaConfig({...iaConfig, regras_especificas: e.target.value})}
                            rows={2}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="regras-adicionais">Regras Adicionais (Opcional)</Label>
                          <Textarea
                            id="regras-adicionais"
                            placeholder="Regras adicionais ou instruções especiais..."
                            value={iaConfig.regras_adicionais || ''}
                            onChange={(e) => setIaConfig({...iaConfig, regras_adicionais: e.target.value})}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Configurações de Texto */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Configurações de Texto</h4>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="tamanho-textos">Tamanho dos Textos</Label>
                          <Select 
                            value={iaConfig.tamanho_textos || 'medio'} 
                            onValueChange={(value) => setIaConfig({...iaConfig, tamanho_textos: value as any})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tamanho" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="curto">Curto</SelectItem>
                              <SelectItem value="medio">Médio</SelectItem>
                              <SelectItem value="longo">Longo</SelectItem>
                              <SelectItem value="detalhado">Detalhado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Usar Emojis</Label>
                            <p className="text-sm text-gray-500">
                              Permitir que a IA use emojis nas respostas.
                            </p>
                          </div>
                          <Switch 
                            checked={iaConfig.usar_emojis || false}
                            onCheckedChange={(checked) => setIaConfig({...iaConfig, usar_emojis: checked})}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Horários de Funcionamento */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Horários de Funcionamento</h4>
                      <div className="grid gap-4">
                        {Object.entries(iaConfig.horarios_funcionamento || {}).map(([dia, config]) => (
                          <div key={dia} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="w-20">
                              <Label className="capitalize">{dia}</Label>
                            </div>
                            <Switch
                              checked={config.ativo}
                              onCheckedChange={(checked) => {
                                const newHorarios = { ...iaConfig.horarios_funcionamento }
                                newHorarios[dia] = { ...config, ativo: checked }
                                setIaConfig({ ...iaConfig, horarios_funcionamento: newHorarios })
                              }}
                            />
                            {config.ativo && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    value={config.inicio}
                                    onChange={(e) => {
                                      const newHorarios = { ...iaConfig.horarios_funcionamento }
                                      newHorarios[dia] = { ...config, inicio: e.target.value }
                                      setIaConfig({ ...iaConfig, horarios_funcionamento: newHorarios })
                                    }}
                                    className="w-24"
                                  />
                                  <span className="text-sm text-gray-500">às</span>
                                  <Input
                                    type="time"
                                    value={config.fim}
                                    onChange={(e) => {
                                      const newHorarios = { ...iaConfig.horarios_funcionamento }
                                      newHorarios[dia] = { ...config, fim: e.target.value }
                                      setIaConfig({ ...iaConfig, horarios_funcionamento: newHorarios })
                                    }}
                                    className="w-24"
                                  />
                                </div>
                              </>
                            )}
                            {!config.ativo && (
                              <span className="text-sm text-gray-400">Inativo</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Configurações Avançadas */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Configurações Avançadas</h4>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="tempo-resposta">Tempo de Resposta (segundos)</Label>
                          <Input
                            id="tempo-resposta"
                            type="number"
                            min="1"
                            max="30"
                            value={Math.round((iaConfig.tempo_resposta_ms || 2000) / 1000)}
                            onChange={(e) => setIaConfig({...iaConfig, tempo_resposta_ms: (parseInt(e.target.value) || 2) * 1000})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="mensagem-ausencia">Mensagem de Ausência</Label>
                          <Textarea
                            id="mensagem-ausencia"
                            placeholder="Mensagem exibida fora do horário de atendimento..."
                            value={iaConfig.mensagem_ausencia || ''}
                            onChange={(e) => setIaConfig({...iaConfig, mensagem_ausencia: e.target.value})}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Detalhes da Empresa */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Detalhes da Empresa</h4>
                      <div className="grid gap-4">
                        {/* Informações da Empresa */}
                        <div className="space-y-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Informações da Empresa</h5>
                          <div className="grid gap-2">
                            <Label htmlFor="sobre-empresa">Sobre a empresa</Label>
                            <Textarea
                              id="sobre-empresa"
                              placeholder="Descreva a empresa, sua história e propósito..."
                              value={iaConfig.detalhes_empresa?.sobre_empresa || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: e.target.value,
                                  diferenciais_competitivos: iaConfig.detalhes_empresa?.diferenciais_competitivos || '',
                                  portfolio_produtos_servicos: iaConfig.detalhes_empresa?.portfolio_produtos_servicos || '',
                                  principais_clientes: iaConfig.detalhes_empresa?.principais_clientes || '',
                                  produtos_servicos_mais_vendidos: iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
                                  informacoes_ia_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
                                  informacoes_ia_nao_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
                                  operacional_comercial: iaConfig.detalhes_empresa?.operacional_comercial || '',
                                  argumentos_venda_por_perfil: iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || '',
                                  objecoes_comuns_respostas: iaConfig.detalhes_empresa?.objecoes_comuns_respostas || '',
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={3}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="diferenciais-competitivos">Diferenciais competitivos</Label>
                            <Textarea
                              id="diferenciais-competitivos"
                              placeholder="Quais são os principais diferenciais da empresa no mercado?"
                              value={iaConfig.detalhes_empresa?.diferenciais_competitivos || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: iaConfig.detalhes_empresa?.sobre_empresa || '',
                                  diferenciais_competitivos: e.target.value,
                                  portfolio_produtos_servicos: iaConfig.detalhes_empresa?.portfolio_produtos_servicos || '',
                                  principais_clientes: iaConfig.detalhes_empresa?.principais_clientes || '',
                                  produtos_servicos_mais_vendidos: iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
                                  informacoes_ia_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
                                  informacoes_ia_nao_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
                                  operacional_comercial: iaConfig.detalhes_empresa?.operacional_comercial || '',
                                  argumentos_venda_por_perfil: iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || '',
                                  objecoes_comuns_respostas: iaConfig.detalhes_empresa?.objecoes_comuns_respostas || '',
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={3}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="portfolio-produtos-servicos">Portfólio: Produtos e Serviços</Label>
                            <Textarea
                              id="portfolio-produtos-servicos"
                              placeholder="Descreva todos os produtos e serviços oferecidos pela empresa..."
                              value={iaConfig.detalhes_empresa?.portfolio_produtos_servicos || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: iaConfig.detalhes_empresa?.sobre_empresa || '',
                                  diferenciais_competitivos: iaConfig.detalhes_empresa?.diferenciais_competitivos || '',
                                  portfolio_produtos_servicos: e.target.value,
                                  principais_clientes: iaConfig.detalhes_empresa?.principais_clientes || '',
                                  produtos_servicos_mais_vendidos: iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
                                  informacoes_ia_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
                                  informacoes_ia_nao_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
                                  operacional_comercial: iaConfig.detalhes_empresa?.operacional_comercial || '',
                                  argumentos_venda_por_perfil: iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || '',
                                  objecoes_comuns_respostas: iaConfig.detalhes_empresa?.objecoes_comuns_respostas || '',
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={4}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="principais-clientes">Principais Clientes</Label>
                            <Textarea
                              id="principais-clientes"
                              placeholder="Descreva o perfil dos principais clientes e casos de sucesso..."
                              value={iaConfig.detalhes_empresa?.principais_clientes || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: iaConfig.detalhes_empresa?.sobre_empresa || '',
                                  diferenciais_competitivos: iaConfig.detalhes_empresa?.diferenciais_competitivos || '',
                                  portfolio_produtos_servicos: iaConfig.detalhes_empresa?.portfolio_produtos_servicos || '',
                                  principais_clientes: e.target.value,
                                  produtos_servicos_mais_vendidos: iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
                                  informacoes_ia_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
                                  informacoes_ia_nao_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
                                  operacional_comercial: iaConfig.detalhes_empresa?.operacional_comercial || '',
                                  argumentos_venda_por_perfil: iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || '',
                                  objecoes_comuns_respostas: iaConfig.detalhes_empresa?.objecoes_comuns_respostas || '',
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={3}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="produtos-servicos-mais-vendidos">Produtos ou Serviços mais vendidos</Label>
                            <Textarea
                              id="produtos-servicos-mais-vendidos"
                              placeholder="Quais são os produtos/serviços com maior volume de vendas?"
                              value={iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: iaConfig.detalhes_empresa?.sobre_empresa || '',
                                  diferenciais_competitivos: iaConfig.detalhes_empresa?.diferenciais_competitivos || '',
                                  portfolio_produtos_servicos: iaConfig.detalhes_empresa?.portfolio_produtos_servicos || '',
                                  principais_clientes: iaConfig.detalhes_empresa?.principais_clientes || '',
                                  produtos_servicos_mais_vendidos: e.target.value,
                                  informacoes_ia_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
                                  informacoes_ia_nao_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
                                  operacional_comercial: iaConfig.detalhes_empresa?.operacional_comercial || '',
                                  argumentos_venda_por_perfil: iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || '',
                                  objecoes_comuns_respostas: iaConfig.detalhes_empresa?.objecoes_comuns_respostas || '',
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={3}
                            />
                          </div>
                        </div>

                        {/* Diretrizes para IA */}
                        <div className="space-y-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Diretrizes para IA</h5>
                          <div className="grid gap-2">
                            <Label htmlFor="informacoes-ia-pode-fornecer">Informações que a IA pode fornecer</Label>
                            <Textarea
                              id="informacoes-ia-pode-fornecer"
                              placeholder="Descreva quais informações a IA está autorizada a fornecer aos clientes..."
                              value={iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: iaConfig.detalhes_empresa?.sobre_empresa || '',
                                  diferenciais_competitivos: iaConfig.detalhes_empresa?.diferenciais_competitivos || '',
                                  portfolio_produtos_servicos: iaConfig.detalhes_empresa?.portfolio_produtos_servicos || '',
                                  principais_clientes: iaConfig.detalhes_empresa?.principais_clientes || '',
                                  produtos_servicos_mais_vendidos: iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
                                  informacoes_ia_pode_fornecer: e.target.value,
                                  informacoes_ia_nao_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
                                  operacional_comercial: iaConfig.detalhes_empresa?.operacional_comercial || '',
                                  argumentos_venda_por_perfil: iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || '',
                                  objecoes_comuns_respostas: iaConfig.detalhes_empresa?.objecoes_comuns_respostas || '',
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={4}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="informacoes-ia-nao-pode-fornecer">Informações que a IA não pode fornecer</Label>
                            <Textarea
                              id="informacoes-ia-nao-pode-fornecer"
                              placeholder="Descreva quais informações a IA NÃO deve fornecer ou temas que deve evitar..."
                              value={iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: iaConfig.detalhes_empresa?.sobre_empresa || '',
                                  diferenciais_competitivos: iaConfig.detalhes_empresa?.diferenciais_competitivos || '',
                                  portfolio_produtos_servicos: iaConfig.detalhes_empresa?.portfolio_produtos_servicos || '',
                                  principais_clientes: iaConfig.detalhes_empresa?.principais_clientes || '',
                                  produtos_servicos_mais_vendidos: iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
                                  informacoes_ia_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
                                  informacoes_ia_nao_pode_fornecer: e.target.value,
                                  operacional_comercial: iaConfig.detalhes_empresa?.operacional_comercial || '',
                                  argumentos_venda_por_perfil: iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || '',
                                  objecoes_comuns_respostas: iaConfig.detalhes_empresa?.objecoes_comuns_respostas || '',
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={4}
                            />
                          </div>
                        </div>

                        {/* Estratégias Comerciais */}
                        <div className="space-y-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Estratégias Comerciais</h5>
                          <div className="grid gap-2">
                            <Label htmlFor="operacional-comercial">Operacional e Comercial</Label>
                            <Textarea
                              id="operacional-comercial"
                              placeholder="Descreva os processos operacionais e comerciais da empresa..."
                              value={iaConfig.detalhes_empresa?.operacional_comercial || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: iaConfig.detalhes_empresa?.sobre_empresa || '',
                                  diferenciais_competitivos: iaConfig.detalhes_empresa?.diferenciais_competitivos || '',
                                  portfolio_produtos_servicos: iaConfig.detalhes_empresa?.portfolio_produtos_servicos || '',
                                  principais_clientes: iaConfig.detalhes_empresa?.principais_clientes || '',
                                  produtos_servicos_mais_vendidos: iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
                                  informacoes_ia_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
                                  informacoes_ia_nao_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
                                  operacional_comercial: e.target.value,
                                  argumentos_venda_por_perfil: iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || '',
                                  objecoes_comuns_respostas: iaConfig.detalhes_empresa?.objecoes_comuns_respostas || '',
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={4}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="argumentos-venda-por-perfil">Argumentos de venda por perfil</Label>
                            <Textarea
                              id="argumentos-venda-por-perfil"
                              placeholder="Descreva os argumentos de venda específicos para diferentes perfis de clientes..."
                              value={iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: iaConfig.detalhes_empresa?.sobre_empresa || '',
                                  diferenciais_competitivos: iaConfig.detalhes_empresa?.diferenciais_competitivos || '',
                                  portfolio_produtos_servicos: iaConfig.detalhes_empresa?.portfolio_produtos_servicos || '',
                                  principais_clientes: iaConfig.detalhes_empresa?.principais_clientes || '',
                                  produtos_servicos_mais_vendidos: iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
                                  informacoes_ia_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
                                  informacoes_ia_nao_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
                                  operacional_comercial: iaConfig.detalhes_empresa?.operacional_comercial || '',
                                  argumentos_venda_por_perfil: e.target.value,
                                  objecoes_comuns_respostas: iaConfig.detalhes_empresa?.objecoes_comuns_respostas || '',
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={4}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="objecoes-comuns-respostas">Objeções comuns e respostas</Label>
                            <Textarea
                              id="objecoes-comuns-respostas"
                              placeholder="Liste as objeções mais comuns dos clientes e como a IA deve responder..."
                              value={iaConfig.detalhes_empresa?.objecoes_comuns_respostas || ''}
                              onChange={(e) => setIaConfig({
                                ...iaConfig, 
                                detalhes_empresa: {
                                  sobre_empresa: iaConfig.detalhes_empresa?.sobre_empresa || '',
                                  diferenciais_competitivos: iaConfig.detalhes_empresa?.diferenciais_competitivos || '',
                                  portfolio_produtos_servicos: iaConfig.detalhes_empresa?.portfolio_produtos_servicos || '',
                                  principais_clientes: iaConfig.detalhes_empresa?.principais_clientes || '',
                                  produtos_servicos_mais_vendidos: iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
                                  informacoes_ia_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
                                  informacoes_ia_nao_pode_fornecer: iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
                                  operacional_comercial: iaConfig.detalhes_empresa?.operacional_comercial || '',
                                  argumentos_venda_por_perfil: iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || '',
                                  objecoes_comuns_respostas: e.target.value,
                                  contatos: iaConfig.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
                                  redes_sociais: iaConfig.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' }
                                }
                              })}
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Botões de Ação */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleSaveIAConfig}
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Salvar Configurações
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleTestIA}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testando...
                          </>
                        ) : (
                          <>
                            <Bot className="w-4 h-4 mr-2" />
                            Testar IA
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
