import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Play, 
  Pause, 
  Square, 
  MapPin, 
  Phone, 
  MessageSquare,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import { useProspeccao } from '../../hooks/useProspeccao'
import { useWhatsAppInstance } from '../../hooks/useWhatsApp'
import LogsProspeccaoTable from '../../components/prospeccao/LogsProspeccaoTable'

interface ProspeccaoConfig {
  tipo_estabelecimento: string
  cidade: string
  mensagem: string
  tempo_entre_disparos: number // em segundos
  limite_disparos_dia: number
}

interface EstabelecimentoProspectado {
  id: string
  nome: string
  telefone: string
  endereco: string
  place_id: string
  status: 'pendente' | 'validando' | 'whatsapp_valido' | 'whatsapp_invalido' | 'mensagem_enviada' | 'erro'
  jid?: string
  erro?: string
  data_processamento?: Date
}

interface ProspeccaoStatus {
  ativa: boolean
  pausada: boolean
  total_encontrados: number
  total_processados: number
  total_whatsapp_validos: number
  total_mensagens_enviadas: number
  disparos_hoje: number
  progresso: number
}

export default function ProspeccaoPage() {
  const [config, setConfig] = useState<ProspeccaoConfig>({
    tipo_estabelecimento: '',
    cidade: '',
    mensagem: 'Olá, tudo bem?',
    tempo_entre_disparos: 600, // 10 minutos fixo
    limite_disparos_dia: 100 // 100 disparos fixo
  })

  const [status, setStatus] = useState<ProspeccaoStatus>({
    ativa: false,
    pausada: false,
    total_encontrados: 0,
    total_processados: 0,
    total_whatsapp_validos: 0,
    total_mensagens_enviadas: 0,
    disparos_hoje: 0,
    progresso: 0
  })

  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoProspectado[]>([])
  const [logs, setLogs] = useState<string[]>([])
  
  // Controle de pausa/parada em tempo real
  const prospeccaoControlRef = useRef({
    ativa: false,
    pausada: false
  })

  const {
    buscarEstabelecimentos,
    validarWhatsApp,
    enviarMensagem,
    salvarComoCliente,
    salvarLogProspeccao,
    obterDisparosHoje,
    isLoading
  } = useProspeccao()

  const { data: whatsappInstance } = useWhatsAppInstance()

  // Carregar disparos do dia atual
  useEffect(() => {
    const carregarDisparosHoje = async () => {
      try {
        const disparos = await obterDisparosHoje()
        setStatus(prev => ({ ...prev, disparos_hoje: disparos }))
      } catch (error) {
        console.error('Erro ao carregar disparos:', error)
      }
    }
    carregarDisparosHoje()
  }, [])

  const adicionarLog = (mensagem: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${mensagem}`, ...prev.slice(0, 99)]) // Manter apenas 100 logs
  }

  const iniciarProspeccao = async () => {
    if (!config.tipo_estabelecimento || !config.cidade) {
      toast.error('Preencha o tipo de estabelecimento e cidade')
      return
    }

    if (!whatsappInstance?.instanceName) {
      toast.error('Nenhuma instância WhatsApp configurada. Configure na aba WhatsApp primeiro.')
      return
    }

    if (whatsappInstance.status !== 'open') {
      toast.error('Instância WhatsApp não está conectada. Verifique a conexão na aba WhatsApp.')
      return
    }

    if (status.disparos_hoje >= config.limite_disparos_dia) {
      toast.error('Limite diário de disparos atingido')
      return
    }

    try {
      // Atualizar controle em tempo real
      prospeccaoControlRef.current = { ativa: true, pausada: false }
      setStatus(prev => ({ ...prev, ativa: true, pausada: false }))
      adicionarLog('Iniciando prospecção...')

      // Buscar estabelecimentos no Google Maps
      adicionarLog(`Buscando estabelecimentos: ${config.tipo_estabelecimento} em ${config.cidade}`)
      console.log('🔍 Iniciando busca de estabelecimentos...')
      
      const resultados = await buscarEstabelecimentos(config.tipo_estabelecimento, config.cidade)
      console.log('✅ Estabelecimentos encontrados:', resultados.length)
      
      const estabelecimentosEncontrados: EstabelecimentoProspectado[] = resultados.map(est => ({
        id: est.place_id,
        nome: est.nome,
        telefone: est.telefone || '',
        endereco: est.endereco,
        place_id: est.place_id,
        status: 'pendente'
      }))

      console.log('📋 Estabelecimentos mapeados:', estabelecimentosEncontrados.length)

      setEstabelecimentos(estabelecimentosEncontrados)
      setStatus(prev => ({ 
        ...prev, 
        total_encontrados: estabelecimentosEncontrados.length 
      }))

      adicionarLog(`${estabelecimentosEncontrados.length} estabelecimentos encontrados`)
      console.log('🚀 Iniciando processamento da fila...')

      // Processar estabelecimentos em fila
      await processarFilaEstabelecimentos(estabelecimentosEncontrados)
      
      console.log('✅ Processamento da fila finalizado!')

    } catch (error) {
      console.error('Erro na prospecção:', error)
      toast.error('Erro ao iniciar prospecção')
      adicionarLog(`Erro: ${error}`)
      setStatus(prev => ({ ...prev, ativa: false }))
    }
  }

  const processarFilaEstabelecimentos = async (estabelecimentosList: EstabelecimentoProspectado[]) => {
    console.log('🚀 Iniciando processamento da fila:', estabelecimentosList.length, 'estabelecimentos')
    adicionarLog(`Iniciando processamento de ${estabelecimentosList.length} estabelecimentos`)
    
    let processados = 0
    let whatsappValidos = 0
    let mensagensEnviadas = 0
    let disparosHoje = status.disparos_hoje

    console.log('📊 Status inicial:', { processados, whatsappValidos, mensagensEnviadas, disparosHoje })

    for (const estabelecimento of estabelecimentosList) {
      console.log(`🔄 Processando estabelecimento ${processados + 1}/${estabelecimentosList.length}:`, estabelecimento.nome)
      
      // Verificar se a prospecção foi pausada ou parada
      if (!prospeccaoControlRef.current.ativa) {
        adicionarLog('Prospecção interrompida pelo usuário')
        break
      }

      // Aguardar enquanto pausada
      if (prospeccaoControlRef.current.pausada && prospeccaoControlRef.current.ativa) {
        adicionarLog('Prospecção pausada - aguardando retomada...')
        
        while (prospeccaoControlRef.current.pausada && prospeccaoControlRef.current.ativa) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Aguardar 1 segundo
        }
        
        if (prospeccaoControlRef.current.ativa) {
          adicionarLog('Prospecção retomada - continuando processamento...')
        }
      }

      // Verificar novamente se foi parada durante a pausa
      if (!prospeccaoControlRef.current.ativa) {
        adicionarLog('Prospecção interrompida pelo usuário')
        break
      }

      // Verificar limite diário
      if (disparosHoje >= config.limite_disparos_dia) {
        adicionarLog('Limite diário de disparos atingido')
        break
      }

      console.log(`📞 Telefone do estabelecimento ${estabelecimento.nome}:`, estabelecimento.telefone)
      
      if (!estabelecimento.telefone) {
        console.log(`❌ Estabelecimento sem telefone: ${estabelecimento.nome}`)
        processados++
        setEstabelecimentos(prev => 
          prev.map((est: EstabelecimentoProspectado) => 
            est.id === estabelecimento.id 
              ? { ...est, status: 'erro', erro: 'Telefone não encontrado' }
              : est
          )
        )
        continue
      }

      try {
        // Atualizar status para validando
        setEstabelecimentos(prev => 
          prev.map((est: EstabelecimentoProspectado) => 
            est.id === estabelecimento.id 
              ? { ...est, status: 'validando' }
              : est
          )
        )

        adicionarLog(`Validando WhatsApp: ${estabelecimento.nome} - ${estabelecimento.telefone}`)
        console.log(`🔍 Iniciando validação WhatsApp para: ${estabelecimento.nome}`)

        // Validar WhatsApp
        const validacao = await validarWhatsApp(estabelecimento.telefone)
        console.log(`📋 Resultado validação:`, validacao)
        
        let clienteId: string | null = null
        let mensagemEnviada = false

        if (validacao.isWhatsApp && validacao.jid) {
          whatsappValidos++
          
          // Atualizar status para WhatsApp válido
          setEstabelecimentos(prev => 
            prev.map((est: EstabelecimentoProspectado) => 
              est.id === estabelecimento.id 
                ? { ...est, status: 'whatsapp_valido', jid: validacao.jid }
                : est
            )
          )

          adicionarLog(`WhatsApp válido encontrado: ${estabelecimento.nome}`)

          // Salvar como cliente no banco de dados
          try {
            clienteId = await salvarComoCliente({
              place_id: estabelecimento.place_id,
              nome: estabelecimento.nome,
              endereco: estabelecimento.endereco,
              telefone: estabelecimento.telefone
            }, estabelecimento.telefone, validacao.jid)
            
            adicionarLog(`Cliente ${estabelecimento.nome} salvo no banco de dados`)
            toast.success(`Cliente ${estabelecimento.nome} salvo com sucesso!`)
          } catch (error) {
            console.error('Erro ao salvar cliente:', error)
            adicionarLog(`Erro ao salvar cliente ${estabelecimento.nome}: ${error}`)
          }

          // Enviar mensagem
          try {
            await enviarMensagem(validacao.jid, config.mensagem)
            mensagensEnviadas++
            disparosHoje++
            mensagemEnviada = true

            setEstabelecimentos(prev => 
              prev.map((est: EstabelecimentoProspectado) => 
                est.id === estabelecimento.id 
                  ? { ...est, status: 'mensagem_enviada', data_processamento: new Date() }
                  : est
              )
            )

            adicionarLog(`Mensagem enviada para: ${estabelecimento.nome}`)

          } catch (error) {
            setEstabelecimentos(prev => 
              prev.map((est: EstabelecimentoProspectado) => 
                est.id === estabelecimento.id 
                  ? { ...est, status: 'erro', erro: 'Erro ao enviar mensagem' }
                  : est
              )
            )
            adicionarLog(`Erro ao enviar mensagem para ${estabelecimento.nome}: ${error}`)
          }

        } else {
          setEstabelecimentos(prev => 
            prev.map((est: EstabelecimentoProspectado) => 
              est.id === estabelecimento.id 
                ? { ...est, status: 'whatsapp_invalido' }
                : est
            )
          )
          adicionarLog(`WhatsApp inválido: ${estabelecimento.nome}`)
        }

        // Determinar status baseado no resultado
        let statusProspeccao = 'Falha'
        if (mensagemEnviada) {
          statusProspeccao = 'Prospectado'
        } else if (validacao.isWhatsApp) {
          statusProspeccao = 'WhatsApp Válido'
        } else if (!estabelecimento.telefone) {
          statusProspeccao = 'Falha'
        } else {
          statusProspeccao = 'Falha'
        }

        // Salvar log de prospecção no banco de dados
        await salvarLogProspeccao(
          {
            place_id: estabelecimento.place_id,
            nome: estabelecimento.nome,
            endereco: estabelecimento.endereco,
            telefone: estabelecimento.telefone
          },
          config.tipo_estabelecimento,
          config.cidade,
          validacao.isWhatsApp,
          validacao.jid,
          mensagemEnviada,
          !!clienteId,
          clienteId || undefined,
          statusProspeccao
        )

      } catch (error) {
        setEstabelecimentos(prev => 
          prev.map((est: EstabelecimentoProspectado) => 
            est.id === estabelecimento.id 
              ? { ...est, status: 'erro', erro: `Erro na validação: ${error}` }
              : est
          )
        )
        adicionarLog(`Erro ao processar ${estabelecimento.nome}: ${error}`)
      }

      processados++
      console.log(`✅ Estabelecimento ${processados}/${estabelecimentosList.length} processado: ${estabelecimento.nome}`)
      
      // Determinar se houve sucesso (mensagem enviada) ou erro
      const estabelecimentoAtual = estabelecimentos.find(est => est.id === estabelecimento.id)
      const houveSucesso = estabelecimentoAtual?.status === 'mensagem_enviada' || mensagemEnviada
      const houveErro = estabelecimentoAtual?.status === 'erro' || 
                       estabelecimentoAtual?.status === 'whatsapp_invalido' || 
                       !estabelecimento.telefone
      
      console.log(`📊 Status do processamento:`, {
        estabelecimento: estabelecimento.nome,
        status: estabelecimentoAtual?.status,
        houveSucesso,
        houveErro,
        mensagemEnviada
      })
      
      // Atualizar status geral
      setStatus(prev => ({
        ...prev,
        total_processados: processados,
        total_whatsapp_validos: whatsappValidos,
        total_mensagens_enviadas: mensagensEnviadas,
        disparos_hoje: disparosHoje,
        progresso: (processados / estabelecimentosList.length) * 100
      }))

      // Aguardar tempo configurado apenas se houve sucesso (mensagem enviada)
      // Em caso de erro, pular para o próximo imediatamente
      if (processados < estabelecimentosList.length) {
        if (houveSucesso) {
          adicionarLog(`✅ Mensagem enviada com sucesso! Aguardando ${config.tempo_entre_disparos} segundos...`)
          await new Promise(resolve => setTimeout(resolve, config.tempo_entre_disparos * 1000))
        } else if (houveErro) {
          adicionarLog(`❌ Erro ou WhatsApp inválido - pulando para o próximo estabelecimento`)
          // Aguardar apenas 1 segundo para não sobrecarregar o sistema
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          // Caso padrão - aguardar tempo normal
          adicionarLog(`Aguardando ${config.tempo_entre_disparos} segundos...`)
          await new Promise(resolve => setTimeout(resolve, config.tempo_entre_disparos * 1000))
        }
      }
    }

    console.log('📊 Estatísticas finais:', { processados, whatsappValidos, mensagensEnviadas })
    
    // Limpar controle em tempo real
    prospeccaoControlRef.current = { ativa: false, pausada: false }
    
    setStatus(prev => ({ 
      ...prev, 
      ativa: false, 
      pausada: false,
      processados,
      whatsapp_validos: whatsappValidos,
      mensagens_enviadas: mensagensEnviadas
    }))
    adicionarLog(`Prospecção finalizada - Processados: ${processados}, WhatsApp válidos: ${whatsappValidos}, Mensagens enviadas: ${mensagensEnviadas}`)
    toast.success('Prospecção finalizada!')
  }

  const pausarProspeccao = () => {
    const novoPausado = !status.pausada
    
    // Atualizar controle em tempo real
    prospeccaoControlRef.current.pausada = novoPausado
    
    setStatus(prev => ({ ...prev, pausada: novoPausado }))
    adicionarLog(novoPausado ? 'Prospecção pausada' : 'Prospecção retomada')
  }

  const pararProspeccao = () => {
    // Atualizar controle em tempo real
    prospeccaoControlRef.current.ativa = false
    prospeccaoControlRef.current.pausada = false
    
    setStatus(prev => ({ 
      ...prev, 
      ativa: false, 
      pausada: false 
    }))
    adicionarLog('Prospecção interrompida pelo usuário')
  }

  const getStatusIcon = (statusItem: string) => {
    switch (statusItem) {
      case 'pendente': return <Clock className="h-4 w-4 text-gray-500" />
      case 'validando': return <Search className="h-4 w-4 text-blue-500 animate-spin" />
      case 'whatsapp_valido': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'whatsapp_invalido': return <XCircle className="h-4 w-4 text-red-500" />
      case 'mensagem_enviada': return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'erro': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (statusItem: string) => {
    switch (statusItem) {
      case 'pendente': return 'bg-gray-100 text-gray-800'
      case 'validando': return 'bg-blue-100 text-blue-800'
      case 'whatsapp_valido': return 'bg-green-100 text-green-800'
      case 'whatsapp_invalido': return 'bg-red-100 text-red-800'
      case 'mensagem_enviada': return 'bg-green-100 text-green-800'
      case 'erro': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prospecção</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema automatizado de prospecção via WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {status.disparos_hoje}/{config.limite_disparos_dia} disparos hoje
          </Badge>
          {whatsappInstance ? (
            <Badge 
              variant={whatsappInstance.status === 'open' ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-3 w-3" />
              WhatsApp: {whatsappInstance.status === 'open' ? 'Conectado' : 'Desconectado'}
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              WhatsApp: Não configurado
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="prospeccao" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prospeccao" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Prospecção Ativa
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prospeccao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuração */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Configuração
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                <Label htmlFor="tipo_estabelecimento">Tipo de Estabelecimento</Label>
                <Input
                  id="tipo_estabelecimento"
                  placeholder="Ex: restaurante, farmácia, loja de roupas"
                  value={config.tipo_estabelecimento}
                  onChange={(e) => setConfig(prev => ({ ...prev, tipo_estabelecimento: e.target.value }))}
                  disabled={status.ativa}
                />
              </div>

              <div>
                <Label htmlFor="cidade">Cidade/Estado/País</Label>
                <Input
                  id="cidade"
                  placeholder="Ex: São Paulo, SP, Brasil"
                  value={config.cidade}
                  onChange={(e) => setConfig(prev => ({ ...prev, cidade: e.target.value }))}
                  disabled={status.ativa}
                />
              </div>

              <div>
                <Label htmlFor="mensagem">Mensagem a Enviar</Label>
                <Textarea
                  id="mensagem"
                  placeholder="Mensagem fixa do sistema"
                  rows={2}
                  value={config.mensagem}
                  readOnly
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Esta mensagem é enviada para atrair resposta do Lead e evitar mensagens de saudação automática.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tempo_disparos">Tempo entre Disparos</Label>
                  <Input
                    id="tempo_disparos"
                    type="text"
                    value="10 minutos"
                    readOnly
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Tempo fixo para evitar bloqueios
                  </p>
                </div>

                <div>
                  <Label htmlFor="limite_disparos">Limite Diário</Label>
                  <Input
                    id="limite_disparos"
                    type="text"
                    value="100 disparos"
                    readOnly
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Limite fixo por dia
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {!status.ativa ? (
                  <Button 
                    onClick={iniciarProspeccao} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Prospecção
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={pausarProspeccao}
                      variant="outline"
                      className="flex-1"
                    >
                      {status.pausada ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Retomar
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={pararProspeccao}
                      variant="destructive"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Parar
                    </Button>
                  </>
                )}
              </div>
                </CardContent>
              </Card>
            </div>

            {/* Status e Progresso */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cards de Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Encontrados</p>
                        <p className="text-2xl font-bold">{status.total_encontrados}</p>
                      </div>
                      <MapPin className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Processados</p>
                        <p className="text-2xl font-bold">{status.total_processados}</p>
                      </div>
                      <Search className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">WhatsApp Válidos</p>
                        <p className="text-2xl font-bold">{status.total_whatsapp_validos}</p>
                      </div>
                      <Phone className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Mensagens Enviadas</p>
                        <p className="text-2xl font-bold">{status.total_mensagens_enviadas}</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Barra de Progresso */}
              {status.ativa && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progresso da Prospecção</span>
                        <span className="text-sm text-gray-600">{Math.round(status.progresso)}%</span>
                      </div>
                      <Progress value={status.progresso} className="h-2" />
                      {status.pausada && (
                        <p className="text-sm text-orange-600 flex items-center gap-1">
                          <Pause className="h-3 w-3" />
                          Prospecção pausada
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de Estabelecimentos */}
              {estabelecimentos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Estabelecimentos Encontrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {estabelecimentos.map((estabelecimento) => (
                        <div 
                          key={estabelecimento.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(estabelecimento.status)}
                              <h4 className="font-medium">{estabelecimento.nome}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{estabelecimento.endereco}</p>
                            {estabelecimento.telefone && (
                              <p className="text-sm text-gray-600">{estabelecimento.telefone}</p>
                            )}
                            {estabelecimento.erro && (
                              <p className="text-sm text-red-600">{estabelecimento.erro}</p>
                            )}
                          </div>
                          <Badge className={getStatusColor(estabelecimento.status)}>
                            {estabelecimento.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>Logs da Prospecção</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                    {logs.length === 0 ? (
                      <p className="text-gray-500">Nenhum log ainda...</p>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="text-gray-700 dark:text-gray-300">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <LogsProspeccaoTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
