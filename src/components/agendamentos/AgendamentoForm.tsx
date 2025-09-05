import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, X, Users, Calendar, MapPin } from 'lucide-react'
import type { Agendamento, AgendamentoCreateData } from '@/services/api/agendamentos'
import type { Cliente } from '@/services/api/clientes'
import type { Vendedor } from '@/services/api/vendedores'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface AgendamentoFormProps {
  agendamento?: Agendamento
  clientes: Cliente[]
  vendedores: Vendedor[]
  onSubmit: (data: AgendamentoCreateData) => void
  onCancel: () => void
}

const defaultFormData: AgendamentoCreateData = {
  cliente_id: '',
  vendedor_id: '',
  titulo: '',
  descricao: '',
  objetivo: '',
  data_inicio: '',
  data_fim: '',
  duracao_minutos: 60,
  tipo: 'primeira_reuniao',
  categoria: 'comercial',
  prioridade: 'media',
  modalidade: 'presencial',
  endereco_reuniao: '',
  link_online: '',
  plataforma: '',
  senha_reuniao: '',
  id_sala_online: '',
  participantes: [],
  participantes_externos: [],
  agenda: '',
  materiais_necessarios: [],
  documentos_anexos: [],
  produtos_apresentar: [],
  servicos_apresentar: [],
  status: 'agendado',
  user_id: ''
}

// Função para converter ISO string para formato datetime-local
const formatDateTimeForInput = (isoString: string): string => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Função para converter datetime-local para ISO string
const formatInputToDateTime = (inputValue: string): string => {
  if (!inputValue) return ''
  return new Date(inputValue).toISOString()
}

export function AgendamentoForm({ agendamento, clientes, vendedores, onSubmit, onCancel }: AgendamentoFormProps) {
  const { data: currentUser } = useCurrentUser()
  const [formData, setFormData] = useState<AgendamentoCreateData>(defaultFormData)
  const [newParticipanteExterno, setNewParticipanteExterno] = useState('')
  const [newParticipanteInterno, setNewParticipanteInterno] = useState({ nome: '', email: '', funcao: '' })
  const [newMaterial, setNewMaterial] = useState('')
  const [newDocumento, setNewDocumento] = useState('')
  const [newProduto, setNewProduto] = useState('')
  const [newServico, setNewServico] = useState('')

  // Filter vendedores based on user role
  const filteredVendedores = useMemo(() => {
    if (!currentUser) return []
    
    // Admin can see all vendedores
    if (currentUser.role === 'admin') {
      return vendedores
    }
    
    // Vendedor can only see themselves
    if (currentUser.role === 'vendedor' && currentUser.vendedor_id) {
      return vendedores.filter(vendedor => vendedor.id === currentUser.vendedor_id)
    }
    
    return []
  }, [vendedores, currentUser])

  // Filter clientes based on user role and selected vendedor
  const filteredClientes = useMemo(() => {
    if (!currentUser) return []
    
    // Admin can see all clientes
    if (currentUser.role === 'admin') {
      return clientes
    }
    
    // Vendedor can only see their own clientes
    if (currentUser.role === 'vendedor' && currentUser.vendedor_id) {
      return clientes.filter(cliente => cliente.vendedor_id === currentUser.vendedor_id)
    }
    
    return []
  }, [clientes, currentUser])

  // Carregar dados do agendamento para edição
  useEffect(() => {
    if (agendamento) {
      setFormData({
        cliente_id: agendamento.cliente_id || '',
        vendedor_id: agendamento.vendedor_id || '',
        titulo: agendamento.titulo || '',
        descricao: agendamento.descricao || '',
        objetivo: agendamento.objetivo || '',
        data_inicio: agendamento.data_inicio || '',
        data_fim: agendamento.data_fim || '',
        duracao_minutos: agendamento.duracao_minutos || 60,
        tipo: agendamento.tipo || 'primeira_reuniao',
        categoria: agendamento.categoria || 'comercial',
        prioridade: agendamento.prioridade || 'media',
        modalidade: agendamento.modalidade || 'presencial',
        endereco_reuniao: agendamento.endereco_reuniao || '',
        link_online: agendamento.link_online || '',
        plataforma: agendamento.plataforma || '',
        senha_reuniao: agendamento.senha_reuniao || '',
        id_sala_online: agendamento.id_sala_online || '',
        participantes: Array.isArray(agendamento.participantes) ? agendamento.participantes : [],
        participantes_externos: Array.isArray(agendamento.participantes_externos) ? agendamento.participantes_externos : [],
        agenda: agendamento.agenda || '',
        materiais_necessarios: Array.isArray(agendamento.materiais_necessarios) ? agendamento.materiais_necessarios : [],
        documentos_anexos: Array.isArray(agendamento.documentos_anexos) ? agendamento.documentos_anexos : [],
        produtos_apresentar: Array.isArray(agendamento.produtos_apresentar) ? agendamento.produtos_apresentar : [],
        servicos_apresentar: Array.isArray(agendamento.servicos_apresentar) ? agendamento.servicos_apresentar : [],
        status: agendamento.status || 'agendado',
        user_id: agendamento.user_id || ''
      })
    }
  }, [agendamento])

  const updateField = (field: keyof AgendamentoCreateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addToArray = (field: keyof AgendamentoCreateData, value: string) => {
    if (!value.trim()) return
    
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }))
  }

  const removeFromArray = (field: keyof AgendamentoCreateData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== FORM SUBMIT DEBUG ===')
    console.log('Form data:', formData)
    console.log('cliente_id:', formData.cliente_id)
    console.log('vendedor_id:', formData.vendedor_id)
    console.log('titulo:', formData.titulo)
    console.log('data_inicio:', formData.data_inicio)
    console.log('data_fim:', formData.data_fim)
    
    // Validações básicas
    if (!formData.cliente_id || !formData.vendedor_id || !formData.titulo || !formData.data_inicio || !formData.data_fim) {
      console.log('Validation failed - missing required fields')
      alert('Preencha todos os campos obrigatórios')
      return
    }

    // Validar se data_fim é posterior a data_inicio
    if (new Date(formData.data_fim) <= new Date(formData.data_inicio)) {
      console.log('Validation failed - end date before start date')
      alert('A data/hora de fim deve ser posterior à data/hora de início')
      return
    }

    // Clean form data before submitting - remove any undefined/null values and ensure proper types
    const cleanFormData = {
      cliente_id: formData.cliente_id || '',
      vendedor_id: formData.vendedor_id || '',
      titulo: formData.titulo || '',
      descricao: formData.descricao || '',
      objetivo: formData.objetivo || '',
      data_inicio: formData.data_inicio || '',
      data_fim: formData.data_fim || '',
      duracao_minutos: Number(formData.duracao_minutos) || 60,
      tipo: formData.tipo || 'primeira_reuniao',
      categoria: formData.categoria || 'comercial',
      prioridade: formData.prioridade || 'media',
      modalidade: formData.modalidade || 'presencial',
      endereco_reuniao: formData.endereco_reuniao || '',
      link_online: formData.link_online || '',
      plataforma: formData.plataforma || '',
      senha_reuniao: formData.senha_reuniao || '',
      id_sala_online: formData.id_sala_online || '',
      participantes: Array.isArray(formData.participantes) ? formData.participantes : [],
      participantes_externos: Array.isArray(formData.participantes_externos) ? formData.participantes_externos : [],
      agenda: formData.agenda || '',
      materiais_necessarios: Array.isArray(formData.materiais_necessarios) ? formData.materiais_necessarios : [],
      documentos_anexos: Array.isArray(formData.documentos_anexos) ? formData.documentos_anexos : [],
      produtos_apresentar: Array.isArray(formData.produtos_apresentar) ? formData.produtos_apresentar : [],
      servicos_apresentar: Array.isArray(formData.servicos_apresentar) ? formData.servicos_apresentar : [],
      status: formData.status || 'agendado',
      user_id: formData.user_id || ''
    }

    console.log('Calling onSubmit with cleaned data:', cleanFormData)
    try {
      onSubmit(cleanFormData)
      console.log('onSubmit called successfully')
    } catch (error) {
      console.error('Error calling onSubmit:', error)
    }
  }

  // Calcular duração automaticamente quando as datas mudarem
  useEffect(() => {
    if (formData.data_inicio && formData.data_fim) {
      const inicio = new Date(formData.data_inicio)
      const fim = new Date(formData.data_fim)
      
      const diffMs = fim.getTime() - inicio.getTime()
      const diffMinutes = Math.round(diffMs / (1000 * 60))
      
      if (diffMinutes > 0) {
        updateField('duracao_minutos', diffMinutes)
      }
    }
  }, [formData.data_inicio, formData.data_fim])

  // Funções para participantes internos
  const addParticipanteInterno = () => {
    if (newParticipanteInterno.nome.trim()) {
      const participantesAtuais = formData.participantes || []
      updateField('participantes', [...participantesAtuais, { ...newParticipanteInterno }])
      setNewParticipanteInterno({ nome: '', email: '', funcao: '' })
    }
  }

  const removeParticipanteInterno = (index: number) => {
    const participantesAtuais = formData.participantes || []
    const novosParticipantes = participantesAtuais.filter((_, i) => i !== index)
    updateField('participantes', novosParticipantes)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basicas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basicas">Básicas</TabsTrigger>
          <TabsTrigger value="local">Local</TabsTrigger>
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="recursos">Recursos</TabsTrigger>
        </TabsList>

        <TabsContent value="basicas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Select value={formData.cliente_id || ''} onValueChange={(value) => updateField('cliente_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome_contato} {cliente.nome_empresa && `- ${cliente.nome_empresa}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendedor_id">Vendedor *</Label>
                  <Select value={formData.vendedor_id || ''} onValueChange={(value) => updateField('vendedor_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVendedores.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          {vendedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => updateField('titulo', e.target.value)}
                  placeholder="Ex: Reunião de apresentação de produtos"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo || 'primeira_reuniao'} onValueChange={(value) => updateField('tipo', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primeira_reuniao">Primeira Reunião</SelectItem>
                      <SelectItem value="apresentacao">Apresentação</SelectItem>
                      <SelectItem value="proposta">Proposta</SelectItem>
                      <SelectItem value="negociacao">Negociação</SelectItem>
                      <SelectItem value="fechamento">Fechamento</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="tecnica">Técnica</SelectItem>
                      <SelectItem value="treinamento">Treinamento</SelectItem>
                      <SelectItem value="suporte">Suporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={formData.categoria || 'comercial'} onValueChange={(value) => updateField('categoria', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="tecnica">Técnica</SelectItem>
                      <SelectItem value="suporte">Suporte</SelectItem>
                      <SelectItem value="treinamento">Treinamento</SelectItem>
                      <SelectItem value="administrativa">Administrativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Input
                    id="prioridade"
                    value={formData.prioridade || ''}
                    onChange={(e) => updateField('prioridade', e.target.value)}
                    placeholder="Ex: alta, 1, urgente, 5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status || 'agendado'} onValueChange={(value) => updateField('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="realizado">Realizado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="reagendado">Reagendado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => updateField('descricao', e.target.value)}
                  placeholder="Descreva o agendamento..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objetivo">Objetivo</Label>
                <Textarea
                  id="objetivo"
                  value={formData.objetivo}
                  onChange={(e) => updateField('objetivo', e.target.value)}
                  placeholder="Qual o objetivo desta reunião?"
                  rows={2}
                />
              </div>

              {/* Data e Hora - Movido para Básicas */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Data e Hora</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data/Hora Início *</Label>
                    <Input
                      id="data_inicio"
                      type="datetime-local"
                      value={formatDateTimeForInput(formData.data_inicio)}
                      onChange={(e) => updateField('data_inicio', formatInputToDateTime(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data/Hora Fim</Label>
                    <Input
                      id="data_fim"
                      type="datetime-local"
                      value={formatDateTimeForInput(formData.data_fim)}
                      onChange={(e) => updateField('data_fim', formatInputToDateTime(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duracao_minutos">Duração (min)</Label>
                    <Input
                      id="duracao_minutos"
                      type="number"
                      value={formData.duracao_minutos || ''}
                      onChange={(e) => updateField('duracao_minutos', parseInt(e.target.value) || 0)}
                      min="1"
                      placeholder="Calculado automaticamente"
                      className="bg-gray-50"
                    />
                    {formData.data_inicio && formData.data_fim && (
                      <p className="text-sm text-muted-foreground">
                        ✓ Duração: {formData.duracao_minutos} minutos
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Modalidade e Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modalidade">Modalidade</Label>
                <Select value={formData.modalidade || 'presencial'} onValueChange={(value) => updateField('modalidade', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hibrida">Híbrida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.modalidade === 'presencial' || formData.modalidade === 'hibrida') && (
                <div className="space-y-2">
                  <Label htmlFor="endereco_reuniao">Endereço da Reunião</Label>
                  <Input
                    id="endereco_reuniao"
                    value={formData.endereco_reuniao}
                    onChange={(e) => updateField('endereco_reuniao', e.target.value)}
                    placeholder="Endereço completo do local da reunião"
                  />
                </div>
              )}

              {(formData.modalidade === 'online' || formData.modalidade === 'hibrida') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="link_online">Link da Reunião Online</Label>
                    <Input
                      id="link_online"
                      value={formData.link_online}
                      onChange={(e) => updateField('link_online', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plataforma">Plataforma</Label>
                    <Select value={formData.plataforma} onValueChange={(value) => updateField('plataforma', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                        <SelectItem value="meet">Google Meet</SelectItem>
                        <SelectItem value="webex">Cisco Webex</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha_reuniao">Senha da Reunião</Label>
                    <Input
                      id="senha_reuniao"
                      value={formData.senha_reuniao}
                      onChange={(e) => updateField('senha_reuniao', e.target.value)}
                      placeholder="Senha de acesso (se necessário)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id_sala_online">ID da Sala</Label>
                    <Input
                      id="id_sala_online"
                      value={formData.id_sala_online}
                      onChange={(e) => updateField('id_sala_online', e.target.value)}
                      placeholder="ID da sala online"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conteudo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes Externos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newParticipanteExterno}
                  onChange={(e) => setNewParticipanteExterno(e.target.value)}
                  placeholder="Nome do participante externo"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newParticipanteExterno.trim()) {
                        addToArray('participantes_externos', newParticipanteExterno)
                        setNewParticipanteExterno('')
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newParticipanteExterno.trim()) {
                      addToArray('participantes_externos', newParticipanteExterno)
                      setNewParticipanteExterno('')
                    }
                  }}
                  disabled={!newParticipanteExterno.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.participantes_externos?.map((participante, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-2 px-3 py-1">
                    <span>{participante}</span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors"
                      onClick={() => removeFromArray('participantes_externos', index)}
                    />
                  </Badge>
                ))}
              </div>
              
              {(!formData.participantes_externos || formData.participantes_externos.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum participante externo adicionado</p>
                  <p className="text-xs">Digite um nome acima e clique em + para adicionar</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="agenda">Agenda da Reunião</Label>
                <Textarea
                  id="agenda"
                  value={formData.agenda}
                  onChange={(e) => updateField('agenda', e.target.value)}
                  placeholder="Descreva a agenda da reunião...&#10;Ex:&#10;1. Apresentação da empresa&#10;2. Demonstração do produto&#10;3. Discussão de necessidades&#10;4. Próximos passos"
                  rows={6}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Participantes Internos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes Internos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={newParticipanteInterno.nome}
                  onChange={(e) => setNewParticipanteInterno(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome completo"
                />
                <Input
                  value={newParticipanteInterno.email}
                  onChange={(e) => setNewParticipanteInterno(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                  type="email"
                />
                <div className="flex gap-2">
                  <Input
                    value={newParticipanteInterno.funcao}
                    onChange={(e) => setNewParticipanteInterno(prev => ({ ...prev, funcao: e.target.value }))}
                    placeholder="Função/Cargo"
                  />
                  <Button
                    type="button"
                    onClick={addParticipanteInterno}
                    disabled={!newParticipanteInterno.nome.trim()}
                    size="sm"
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                {formData.participantes?.map((participante, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{participante.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {participante.email} {participante.funcao && `• ${participante.funcao}`}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipanteInterno(index)}
                      className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {(!formData.participantes || formData.participantes.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum participante interno adicionado</p>
                  <p className="text-xs">Preencha os campos acima e clique em + para adicionar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recursos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materiais e Recursos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* Materiais Necessários */}
          <div className="space-y-4">
            <Label>Materiais Necessários</Label>
            <div className="flex gap-2">
              <Input
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="Ex: Projetor, notebook, amostras..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('materiais_necessarios', newMaterial)
                    setNewMaterial('')
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addToArray('materiais_necessarios', newMaterial)
                  setNewMaterial('')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.materiais_necessarios?.map((material, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {material}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeFromArray('materiais_necessarios', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Documentos Anexos */}
          <div className="space-y-4">
            <Label>Documentos Anexos</Label>
            <div className="flex gap-2">
              <Input
                value={newDocumento}
                onChange={(e) => setNewDocumento(e.target.value)}
                placeholder="Ex: Proposta comercial, catálogo..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('documentos_anexos', newDocumento)
                    setNewDocumento('')
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addToArray('documentos_anexos', newDocumento)
                  setNewDocumento('')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.documentos_anexos?.map((documento, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {documento}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeFromArray('documentos_anexos', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos e Serviços a Apresentar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* Produtos */}
          <div className="space-y-4">
            <Label>Produtos a Apresentar</Label>
            <div className="flex gap-2">
              <Input
                value={newProduto}
                onChange={(e) => setNewProduto(e.target.value)}
                placeholder="Nome do produto..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('produtos_apresentar', newProduto)
                    setNewProduto('')
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addToArray('produtos_apresentar', newProduto)
                  setNewProduto('')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.produtos_apresentar?.map((produto, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {produto}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeFromArray('produtos_apresentar', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Serviços */}
          <div className="space-y-4">
            <Label>Serviços a Apresentar</Label>
            <div className="flex gap-2">
              <Input
                value={newServico}
                onChange={(e) => setNewServico(e.target.value)}
                placeholder="Nome do serviço..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('servicos_apresentar', newServico)
                    setNewServico('')
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addToArray('servicos_apresentar', newServico)
                  setNewServico('')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.servicos_apresentar?.map((servico, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {servico}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeFromArray('servicos_apresentar', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
            </CardContent>
          </Card>

          {/* Resultados e Follow-up */}
          <Card>
            <CardHeader>
              <CardTitle>Resultados e Follow-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resultado">Resultado da Reunião</Label>
                <Textarea
                  id="resultado"
                  value={formData.resultado}
                  onChange={(e) => updateField('resultado', e.target.value)}
                  placeholder="Descreva o resultado da reunião..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ata_reuniao">Ata da Reunião</Label>
                <Textarea
                  id="ata_reuniao"
                  value={formData.ata_reuniao}
                  onChange={(e) => updateField('ata_reuniao', e.target.value)}
                  placeholder="Ata detalhada da reunião..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proximos_passos">Próximos Passos</Label>
                <Textarea
                  id="proximos_passos"
                  value={formData.proximos_passos}
                  onChange={(e) => updateField('proximos_passos', e.target.value)}
                  placeholder="Defina os próximos passos..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_proximo_contato">Data Próximo Contato</Label>
                  <Input
                    id="data_proximo_contato"
                    type="datetime-local"
                    value={formData.data_proximo_contato}
                    onChange={(e) => updateField('data_proximo_contato', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_discutido">Valor Discutido (R$)</Label>
                  <Input
                    id="valor_discutido"
                    type="number"
                    step="0.01"
                    value={formData.valor_discutido}
                    onChange={(e) => updateField('valor_discutido', parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interesse_demonstrado">Interesse (1-10)</Label>
                  <Input
                    id="interesse_demonstrado"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.interesse_demonstrado}
                    onChange={(e) => updateField('interesse_demonstrado', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Reagendamento */}
              {formData.status === 'reagendado' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Informações de Reagendamento</h4>
                  <div className="space-y-2">
                    <Label htmlFor="motivo_reagendamento">Motivo do Reagendamento</Label>
                    <Textarea
                      id="motivo_reagendamento"
                      value={formData.motivo_reagendamento}
                      onChange={(e) => updateField('motivo_reagendamento', e.target.value)}
                      placeholder="Explique o motivo do reagendamento..."
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* Confirmações e Lembretes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lembrete_enviado"
                      checked={formData.lembrete_enviado}
                      onChange={(e) => updateField('lembrete_enviado', e.target.checked)}
                    />
                    <Label htmlFor="lembrete_enviado">Lembrete Enviado</Label>
                  </div>
                  {formData.lembrete_enviado && (
                    <Input
                      type="datetime-local"
                      value={formData.lembrete_enviado_em}
                      onChange={(e) => updateField('lembrete_enviado_em', e.target.value)}
                      placeholder="Data/hora do envio"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="confirmacao_cliente"
                      checked={formData.confirmacao_cliente}
                      onChange={(e) => updateField('confirmacao_cliente', e.target.checked)}
                    />
                    <Label htmlFor="confirmacao_cliente">Cliente Confirmou</Label>
                  </div>
                  {formData.confirmacao_cliente && (
                    <Input
                      type="datetime-local"
                      value={formData.confirmacao_em}
                      onChange={(e) => updateField('confirmacao_em', e.target.value)}
                      placeholder="Data/hora da confirmação"
                    />
                  )}
                </div>
              </div>

              {/* IDs de Integração */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="google_event_id">Google Event ID</Label>
                  <Input
                    id="google_event_id"
                    value={formData.google_event_id}
                    onChange={(e) => updateField('google_event_id', e.target.value)}
                    placeholder="ID do evento no Google Calendar"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outlook_event_id">Outlook Event ID</Label>
                  <Input
                    id="outlook_event_id"
                    value={formData.outlook_event_id}
                    onChange={(e) => updateField('outlook_event_id', e.target.value)}
                    placeholder="ID do evento no Outlook"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {agendamento ? 'Atualizar' : 'Criar'} Agendamento
        </Button>
      </div>
    </form>
  )
}
