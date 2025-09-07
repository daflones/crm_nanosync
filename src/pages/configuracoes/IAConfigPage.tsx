import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bot, Check, Loader2, TestTube } from 'lucide-react'
import { useIAConfig, useUpdateIAConfig, useTestIAConfig } from '@/hooks/useIAConfig'
import type { IAConfig } from '@/services/api/ia-config'

export function IAConfigPage() {
  const { data: iaConfigData, isLoading } = useIAConfig()
  const updateIAConfig = useUpdateIAConfig()
  const testIAConfig = useTestIAConfig()

  const [iaConfig, setIaConfig] = useState<Partial<IAConfig>>({
    contexto_ia: '',
    tom_fala: 'profissional',
    regras_especificas: '',
    regras_adicionais: '',
    tamanho_textos: 'medio',
    usar_emojis: false,
    tempo_resposta_ms: 2000,
    mensagem_ausencia: '',
    horarios_funcionamento: {
      segunda: { ativo: true, inicio: '08:00', fim: '18:00' },
      terca: { ativo: true, inicio: '08:00', fim: '18:00' },
      quarta: { ativo: true, inicio: '08:00', fim: '18:00' },
      quinta: { ativo: true, inicio: '08:00', fim: '18:00' },
      sexta: { ativo: true, inicio: '08:00', fim: '18:00' },
      sabado: { ativo: false, inicio: '08:00', fim: '12:00' },
      domingo: { ativo: false, inicio: '08:00', fim: '12:00' }
    },
    detalhes_empresa: {
      sobre_empresa: '',
      diferenciais_competitivos: '',
      portfolio_produtos_servicos: '',
      principais_clientes: '',
      produtos_servicos_mais_vendidos: '',
      informacoes_ia_pode_fornecer: '',
      informacoes_ia_nao_pode_fornecer: '',
      operacional_comercial: '',
      argumentos_venda_por_perfil: '',
      objecoes_comuns_respostas: '',
      contatos: { telefone: '', email: '', whatsapp: '', endereco: '' },
      redes_sociais: { website: '', instagram: '', linkedin: '', facebook: '' }
    }
  })

  // Atualizar estado local quando os dados chegarem
  useEffect(() => {
    if (iaConfigData) {
      setIaConfig(iaConfigData)
    }
  }, [iaConfigData])

  const handleSaveConfig = () => {
    updateIAConfig.mutate(iaConfig)
  }

  const handleTestConfig = () => {
    testIAConfig.mutate(iaConfig)
  }

  const updateDetalhesEmpresa = (field: string, value: string) => {
    setIaConfig(prev => ({
      ...prev,
      detalhes_empresa: {
        sobre_empresa: prev.detalhes_empresa?.sobre_empresa || '',
        diferenciais_competitivos: prev.detalhes_empresa?.diferenciais_competitivos || '',
        portfolio_produtos_servicos: prev.detalhes_empresa?.portfolio_produtos_servicos || '',
        principais_clientes: prev.detalhes_empresa?.principais_clientes || '',
        produtos_servicos_mais_vendidos: prev.detalhes_empresa?.produtos_servicos_mais_vendidos || '',
        informacoes_ia_pode_fornecer: prev.detalhes_empresa?.informacoes_ia_pode_fornecer || '',
        informacoes_ia_nao_pode_fornecer: prev.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || '',
        operacional_comercial: prev.detalhes_empresa?.operacional_comercial || '',
        argumentos_venda_por_perfil: prev.detalhes_empresa?.argumentos_venda_por_perfil || '',
        objecoes_comuns_respostas: prev.detalhes_empresa?.objecoes_comuns_respostas || '',
        contatos: prev.detalhes_empresa?.contatos || { telefone: '', email: '', whatsapp: '', endereco: '' },
        redes_sociais: prev.detalhes_empresa?.redes_sociais || { website: '', instagram: '', linkedin: '', facebook: '' },
        [field]: value
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="w-full h-full space-y-8">
      {/* Header */}
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Bot className="w-8 h-8" />
          Configurações de IA
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure o comportamento e personalidade do assistente de IA da sua empresa.
        </p>
      </div>

      <div className="w-full space-y-6">
        {/* Contexto e Personalidade */}
        <Card>
          <CardHeader>
            <CardTitle>Contexto e Personalidade</CardTitle>
            <CardDescription>
              Defina como a IA deve se comportar e se comunicar com os clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Regras e Comportamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Regras e Comportamentos</CardTitle>
            <CardDescription>
              Estabeleça diretrizes específicas para o comportamento da IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Configurações de Texto */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Texto</CardTitle>
            <CardDescription>
              Personalize como a IA estrutura suas respostas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Horários de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle>Horários de Funcionamento</CardTitle>
            <CardDescription>
              Configure os horários em que a IA estará ativa para atendimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(iaConfig.horarios_funcionamento || {}).map(([dia, config]: [string, any]) => (
              <div key={dia} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-20">
                  <Label className="capitalize">{dia}</Label>
                </div>
                <Switch
                  checked={config?.ativo || false}
                  onCheckedChange={(checked) => {
                    const newHorarios = { ...iaConfig.horarios_funcionamento }
                    newHorarios[dia] = { ...config, ativo: checked }
                    setIaConfig({ ...iaConfig, horarios_funcionamento: newHorarios })
                  }}
                />
                {config?.ativo && (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={config?.inicio || '08:00'}
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
                        value={config?.fim || '18:00'}
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
                {!config?.ativo && (
                  <span className="text-sm text-gray-400">Inativo</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Configurações Avançadas */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Avançadas</CardTitle>
            <CardDescription>
              Ajustes técnicos para o comportamento da IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
            <CardDescription>
              Dados sobre a empresa que a IA pode usar nas conversas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="sobre-empresa">Sobre a empresa</Label>
              <Textarea
                id="sobre-empresa"
                placeholder="Descreva a empresa, sua história e propósito..."
                value={iaConfig.detalhes_empresa?.sobre_empresa || ''}
                onChange={(e) => updateDetalhesEmpresa('sobre_empresa', e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="diferenciais-competitivos">Diferenciais competitivos</Label>
              <Textarea
                id="diferenciais-competitivos"
                placeholder="Quais são os principais diferenciais da empresa no mercado?"
                value={iaConfig.detalhes_empresa?.diferenciais_competitivos || ''}
                onChange={(e) => updateDetalhesEmpresa('diferenciais_competitivos', e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="portfolio-produtos-servicos">Portfólio: Produtos e Serviços</Label>
              <Textarea
                id="portfolio-produtos-servicos"
                placeholder="Descreva todos os produtos e serviços oferecidos pela empresa..."
                value={iaConfig.detalhes_empresa?.portfolio_produtos_servicos || ''}
                onChange={(e) => updateDetalhesEmpresa('portfolio_produtos_servicos', e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="principais-clientes">Principais Clientes</Label>
              <Textarea
                id="principais-clientes"
                placeholder="Descreva os principais tipos de clientes ou segmentos que a empresa atende..."
                value={iaConfig.detalhes_empresa?.principais_clientes || ''}
                onChange={(e) => updateDetalhesEmpresa('principais_clientes', e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="produtos-servicos-mais-vendidos">Produtos ou Serviços mais vendidos</Label>
              <Textarea
                id="produtos-servicos-mais-vendidos"
                placeholder="Liste os produtos ou serviços que mais vendem e suas características..."
                value={iaConfig.detalhes_empresa?.produtos_servicos_mais_vendidos || ''}
                onChange={(e) => updateDetalhesEmpresa('produtos_servicos_mais_vendidos', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Diretrizes para IA */}
        <Card>
          <CardHeader>
            <CardTitle>Diretrizes para IA</CardTitle>
            <CardDescription>
              Defina o que a IA pode ou não pode fazer durante as conversas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="informacoes-ia-pode-fornecer">Informações que a IA pode fornecer</Label>
              <Textarea
                id="informacoes-ia-pode-fornecer"
                placeholder="Descreva quais informações a IA está autorizada a fornecer aos clientes..."
                value={iaConfig.detalhes_empresa?.informacoes_ia_pode_fornecer || ''}
                onChange={(e) => updateDetalhesEmpresa('informacoes_ia_pode_fornecer', e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="informacoes-ia-nao-pode-fornecer">Informações que a IA não pode fornecer</Label>
              <Textarea
                id="informacoes-ia-nao-pode-fornecer"
                placeholder="Descreva quais informações a IA NÃO deve fornecer ou temas que deve evitar..."
                value={iaConfig.detalhes_empresa?.informacoes_ia_nao_pode_fornecer || ''}
                onChange={(e) => updateDetalhesEmpresa('informacoes_ia_nao_pode_fornecer', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estratégias Comerciais */}
        <Card>
          <CardHeader>
            <CardTitle>Estratégias Comerciais</CardTitle>
            <CardDescription>
              Configure como a IA deve abordar vendas e objeções dos clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="argumentos-venda-por-perfil">Argumentos de venda por perfil</Label>
              <Textarea
                id="argumentos-venda-por-perfil"
                placeholder="Descreva os argumentos de venda específicos para diferentes perfis de clientes..."
                value={iaConfig.detalhes_empresa?.argumentos_venda_por_perfil || ''}
                onChange={(e) => updateDetalhesEmpresa('argumentos_venda_por_perfil', e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="objecoes-comuns-respostas">Objeções comuns e respostas</Label>
              <Textarea
                id="objecoes-comuns-respostas"
                placeholder="Liste as objeções mais comuns dos clientes e como a IA deve responder..."
                value={iaConfig.detalhes_empresa?.objecoes_comuns_respostas || ''}
                onChange={(e) => updateDetalhesEmpresa('objecoes_comuns_respostas', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Button 
            onClick={handleTestConfig}
            disabled={testIAConfig.isPending}
            variant="outline"
            className="flex-1"
          >
            {testIAConfig.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Testar Configurações
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleSaveConfig}
            disabled={updateIAConfig.isPending}
            className="flex-1"
          >
            {updateIAConfig.isPending ? (
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
        </div>
      </div>
    </div>
  )
}
