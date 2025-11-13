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
import { useVendedores } from '@/hooks/useVendedores'
import type { IAConfig } from '@/services/api/ia-config'

// Ordem correta dos dias da semana
const diasDaSemanaOrdem = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

// Função para ordenar os dias da semana
const ordenarDiasDaSemana = (horarios: any) => {
  if (!horarios) return []
  
  return Object.entries(horarios).sort(([diaA], [diaB]) => {
    const indexA = diasDaSemanaOrdem.indexOf(diaA.toLowerCase())
    const indexB = diasDaSemanaOrdem.indexOf(diaB.toLowerCase())
    return indexA - indexB
  })
}

export function IAConfigPage() {
  const { data: iaConfigData, isLoading } = useIAConfig()
  const { data: vendedores = [] } = useVendedores()
  const updateIAConfig = useUpdateIAConfig()
  const testIAConfig = useTestIAConfig()

  const [iaConfig, setIaConfig] = useState<Partial<IAConfig>>({
    nome_agente: '',
    tom_fala: 'profissional',
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
    agendamento_ia: false,
    regras_qualificacao: {
      nome: true,
      telefone: true,
      produto_interesse: true,
      motivacao: true,
      expectativa: true,
      analise_cliente: true,
      cpf: false,
      cnpj: false,
      nome_empresa: false,
      email: false,
      segmento: false,
      volume_mensal: false,
      endereco: {
        ativo: false,
        rua: false,
        numero: false,
        cidade: false,
        cep: false
      }
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
      <div className="w-full flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bot className="w-8 h-8" />
            Configurações de IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure o comportamento e personalidade do assistente de IA da sua empresa.
          </p>
        </div>
        <Button 
          onClick={handleSaveConfig}
          disabled={updateIAConfig.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          {updateIAConfig.isPending ? (
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
      </div>

      <div className="w-full space-y-6">
        {/* Nome e Tom de Fala */}
        <Card>
          <CardHeader>
            <CardTitle>Nome e Tom de Fala</CardTitle>
            <CardDescription>
              Personalize o nome do assistente virtual e escolha o estilo de comunicação que melhor representa sua empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nome-agente">Nome do Agente de IA</Label>
              <Input
                id="nome-agente"
                placeholder="(nomeie seu agente)"
                value={iaConfig.nome_agente || ''}
                onChange={(e) => setIaConfig({...iaConfig, nome_agente: e.target.value})}
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
                </SelectContent>
              </Select>
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

        {/* Configurações de Agendamento e Envio de Materiais */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Agendamento e Envio de Materiais</CardTitle>
            <CardDescription>
              Configure como a IA deve se comportar com agendamentos, os horários disponíveis e o envio de documentos aos clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IA enviará documentos?</Label>
                <p className="text-sm text-gray-500">
                  Quando ativado, a área de Arquivos IA ficará visível e funcional.
                </p>
              </div>
              <Switch 
                checked={iaConfig.envia_documento || false}
                onCheckedChange={(checked) => setIaConfig({...iaConfig, envia_documento: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label>Agendamentos com IA?</Label>
                <p className="text-sm text-gray-500">
                  Permitir que a IA realize agendamentos automaticamente.
                </p>
              </div>
              <Switch 
                checked={iaConfig.agendamento_ia || false}
                onCheckedChange={(checked) => setIaConfig({...iaConfig, agendamento_ia: checked})}
              />
            </div>

            {iaConfig.agendamento_ia && (
              <>
                <div className="space-y-3">
                  <Label>Vendedores e Horários Disponíveis</Label>
                  <p className="text-sm text-gray-500">
                    Horários dos vendedores que a IA pode usar para agendamentos.
                  </p>
                  {vendedores.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>Nenhum vendedor cadastrado</p>
                    </div>
                  ) : (
                    vendedores.map((vendedor) => {
                      const horariosAtivos = vendedor.horarios_vendedor ? 
                        ordenarDiasDaSemana(vendedor.horarios_vendedor)
                          .filter(([_, config]: [string, any]) => config?.ativo === true)
                          .map(([dia, config]: [string, any]) => {
                            const diaFormatado = dia.charAt(0).toUpperCase() + dia.slice(1)
                            
                            // Suporte para nova estrutura de múltiplos períodos
                            if (config?.periodos && Array.isArray(config.periodos)) {
                              const periodosTexto = config.periodos
                                .map((periodo: any) => `${periodo.inicio}-${periodo.fim}`)
                                .join(', ')
                              return `${diaFormatado}: ${periodosTexto}`
                            }
                            // Compatibilidade com estrutura antiga
                            else if (config?.inicio && config?.fim) {
                              return `${diaFormatado}: ${config.inicio}-${config.fim}`
                            }
                            return null
                          })
                          .filter(Boolean)
                        : [];
                      
                      return (
                        <div key={vendedor.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {vendedor.nome || vendedor.full_name || 'Nome não informado'}
                              </h4>
                            </div>
                          </div>
                          
                          {horariosAtivos.length > 0 ? (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horários disponíveis:</p>
                              <div className="flex flex-wrap gap-2">
                                {horariosAtivos.map((horario, index) => (
                                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                                    {horario}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 mt-2">Nenhum horário disponível configurado</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Configurações de Qualificação */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Qualificação</CardTitle>
            <CardDescription>
              Configure quais informações a IA deve coletar para qualificar os leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campos Obrigatórios (Apenas Leitura) */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Campos Obrigatórios</Label>
              <p className="text-sm text-gray-500">
                Estes campos são sempre obrigatórios na qualificação de leads.
              </p>
              <div className="grid gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {[
                  { label: 'Nome', key: 'nome' },
                  { label: 'Telefone', key: 'telefone' },
                  { label: 'Produto de Interesse', key: 'produto_interesse' },
                  { label: 'Motivação', key: 'motivacao' },
                  { label: 'Expectativa', key: 'expectativa' },
                  { label: 'Análise do Cliente', key: 'analise_cliente' }
                ].map(({ label, key }) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border">
                    <Label className="text-sm">{label}</Label>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-gray-500">Obrigatório</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campos Opcionais Configuráveis */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-semibold">Campos Opcionais</Label>
              <p className="text-sm text-gray-500">
                Configure quais campos adicionais a IA deve coletar.
              </p>

              {/* Nome da Empresa */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Nome da Empresa</Label>
                  <p className="text-sm text-gray-500">
                    Solicitar nome da empresa do lead.
                  </p>
                </div>
                <Switch
                  checked={iaConfig.regras_qualificacao?.nome_empresa || false}
                  onCheckedChange={(checked) => setIaConfig({
                    ...iaConfig,
                    regras_qualificacao: {
                      ...iaConfig.regras_qualificacao!,
                      nome_empresa: checked
                    }
                  })}
                />
              </div>

              {/* CPF */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>CPF</Label>
                  <p className="text-sm text-gray-500">
                    Solicitar CPF do lead (pessoa física).
                  </p>
                </div>
                <Switch
                  checked={iaConfig.regras_qualificacao?.cpf || false}
                  onCheckedChange={(checked) => setIaConfig({
                    ...iaConfig,
                    regras_qualificacao: {
                      ...iaConfig.regras_qualificacao!,
                      cpf: checked
                    }
                  })}
                />
              </div>

              {/* CNPJ */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>CNPJ</Label>
                  <p className="text-sm text-gray-500">
                    Solicitar CNPJ do lead (pessoa jurídica).
                  </p>
                </div>
                <Switch
                  checked={iaConfig.regras_qualificacao?.cnpj || false}
                  onCheckedChange={(checked) => setIaConfig({
                    ...iaConfig,
                    regras_qualificacao: {
                      ...iaConfig.regras_qualificacao!,
                      cnpj: checked
                    }
                  })}
                />
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Email</Label>
                  <p className="text-sm text-gray-500">
                    Solicitar endereço de email do lead.
                  </p>
                </div>
                <Switch
                  checked={iaConfig.regras_qualificacao?.email || false}
                  onCheckedChange={(checked) => setIaConfig({
                    ...iaConfig,
                    regras_qualificacao: {
                      ...iaConfig.regras_qualificacao!,
                      email: checked
                    }
                  })}
                />
              </div>

              {/* Segmento */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Segmento</Label>
                  <p className="text-sm text-gray-500">
                    Solicitar segmento de atuação do lead.
                  </p>
                </div>
                <Switch
                  checked={iaConfig.regras_qualificacao?.segmento || false}
                  onCheckedChange={(checked) => setIaConfig({
                    ...iaConfig,
                    regras_qualificacao: {
                      ...iaConfig.regras_qualificacao!,
                      segmento: checked
                    }
                  })}
                />
              </div>

              {/* Volume Mensal */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Volume Mensal</Label>
                  <p className="text-sm text-gray-500">
                    Solicitar volume mensal estimado do lead.
                  </p>
                </div>
                <Switch
                  checked={iaConfig.regras_qualificacao?.volume_mensal || false}
                  onCheckedChange={(checked) => setIaConfig({
                    ...iaConfig,
                    regras_qualificacao: {
                      ...iaConfig.regras_qualificacao!,
                      volume_mensal: checked
                    }
                  })}
                />
              </div>

              {/* Endereço */}
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Endereço</Label>
                    <p className="text-sm text-gray-500">
                      Solicitar endereço completo do lead.
                    </p>
                  </div>
                  <Switch
                    checked={iaConfig.regras_qualificacao?.endereco?.ativo || false}
                    onCheckedChange={(checked) => setIaConfig({
                      ...iaConfig,
                      regras_qualificacao: {
                        ...iaConfig.regras_qualificacao!,
                        endereco: {
                          ...iaConfig.regras_qualificacao!.endereco,
                          ativo: checked
                        }
                      }
                    })}
                  />
                </div>

                {/* Sub-campos de Endereço */}
                {iaConfig.regras_qualificacao?.endereco?.ativo && (
                  <div className="ml-4 space-y-2 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Campos do endereço:</p>
                    
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <Label className="text-sm">Rua</Label>
                      <Switch
                        checked={iaConfig.regras_qualificacao?.endereco?.rua || false}
                        onCheckedChange={(checked) => setIaConfig({
                          ...iaConfig,
                          regras_qualificacao: {
                            ...iaConfig.regras_qualificacao!,
                            endereco: {
                              ...iaConfig.regras_qualificacao!.endereco,
                              rua: checked
                            }
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <Label className="text-sm">Número</Label>
                      <Switch
                        checked={iaConfig.regras_qualificacao?.endereco?.numero || false}
                        onCheckedChange={(checked) => setIaConfig({
                          ...iaConfig,
                          regras_qualificacao: {
                            ...iaConfig.regras_qualificacao!,
                            endereco: {
                              ...iaConfig.regras_qualificacao!.endereco,
                              numero: checked
                            }
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <Label className="text-sm">Cidade</Label>
                      <Switch
                        checked={iaConfig.regras_qualificacao?.endereco?.cidade || false}
                        onCheckedChange={(checked) => setIaConfig({
                          ...iaConfig,
                          regras_qualificacao: {
                            ...iaConfig.regras_qualificacao!,
                            endereco: {
                              ...iaConfig.regras_qualificacao!.endereco,
                              cidade: checked
                            }
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <Label className="text-sm">CEP</Label>
                      <Switch
                        checked={iaConfig.regras_qualificacao?.endereco?.cep || false}
                        onCheckedChange={(checked) => setIaConfig({
                          ...iaConfig,
                          regras_qualificacao: {
                            ...iaConfig.regras_qualificacao!,
                            endereco: {
                              ...iaConfig.regras_qualificacao!.endereco,
                              cep: checked
                            }
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
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

        {/* Tempo de Resposta e Mensagem de Ausência */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo de Resposta e Mensagem de Ausência</CardTitle>
            <CardDescription>
              Configure o tempo que a IA leva para responder e a mensagem exibida quando o atendimento estiver indisponível fora do horário de funcionamento.
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
