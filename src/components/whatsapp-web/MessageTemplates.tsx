import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Send,
  FileText,
  Users,
  Star,
  Clock
} from 'lucide-react'
import type { WhatsAppContact } from '@/hooks/useWhatsAppWeb'
import { toast } from 'sonner'

interface MessageTemplate {
  id: string
  name: string
  content: string
  category: 'saudacao' | 'despedida' | 'promocao' | 'suporte' | 'agendamento' | 'personalizado'
  variables: string[]
  createdAt: Date
  usageCount: number
}

interface MessageTemplatesProps {
  onSendMessage: (to: string, message: string) => void
  contacts: WhatsAppContact[]
}

export function MessageTemplates({ onSendMessage, contacts }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: '1',
      name: 'Saudação Inicial',
      content: 'Olá {nome}! 👋\n\nObrigado por entrar em contato conosco. Como posso ajudá-lo hoje?',
      category: 'saudacao',
      variables: ['nome'],
      createdAt: new Date(),
      usageCount: 15
    },
    {
      id: '2',
      name: 'Agendamento de Reunião',
      content: 'Olá {nome}!\n\nGostaria de agendar uma reunião para discutirmos sobre {assunto}.\n\nTeria disponibilidade na {data} às {horario}?\n\nAguardo seu retorno!',
      category: 'agendamento',
      variables: ['nome', 'assunto', 'data', 'horario'],
      createdAt: new Date(),
      usageCount: 8
    },
    {
      id: '3',
      name: 'Promoção Especial',
      content: '🎉 OFERTA ESPECIAL para você, {nome}!\n\n{descricao_promocao}\n\nVálida até {data_limite}.\n\nNão perca essa oportunidade!',
      category: 'promocao',
      variables: ['nome', 'descricao_promocao', 'data_limite'],
      createdAt: new Date(),
      usageCount: 23
    }
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [templateVariables, setTemplateVariables] = useState<{ [key: string]: string }>({})
  
  // Estados para criar/editar template
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'personalizado' as MessageTemplate['category']
  })

  const categoryLabels = {
    saudacao: 'Saudação',
    despedida: 'Despedida',
    promocao: 'Promoção',
    suporte: 'Suporte',
    agendamento: 'Agendamento',
    personalizado: 'Personalizado'
  }

  const categoryColors = {
    saudacao: 'bg-green-100 text-green-800',
    despedida: 'bg-blue-100 text-blue-800',
    promocao: 'bg-yellow-100 text-yellow-800',
    suporte: 'bg-purple-100 text-purple-800',
    agendamento: 'bg-orange-100 text-orange-800',
    personalizado: 'bg-gray-100 text-gray-800'
  }

  // Extrair variáveis do conteúdo do template
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g)
    return matches ? matches.map(match => match.slice(1, -1)) : []
  }

  // Processar template com variáveis
  const processTemplate = (content: string, variables: { [key: string]: string }): string => {
    let processed = content
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    })
    return processed
  }

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('Nome e conteúdo são obrigatórios')
      return
    }

    const variables = extractVariables(newTemplate.content)
    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name.trim(),
      content: newTemplate.content.trim(),
      category: newTemplate.category,
      variables,
      createdAt: new Date(),
      usageCount: 0
    }

    setTemplates(prev => [...prev, template])
    setNewTemplate({ name: '', content: '', category: 'personalizado' })
    setIsCreateDialogOpen(false)
    toast.success('Template criado com sucesso!')
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
    toast.success('Template removido com sucesso!')
  }

  const handleSendTemplate = () => {
    if (!selectedTemplate || !selectedContact) {
      toast.error('Selecione um template e um contato')
      return
    }

    // Verificar se todas as variáveis foram preenchidas
    const missingVariables = selectedTemplate.variables.filter(
      variable => !templateVariables[variable]?.trim()
    )

    if (missingVariables.length > 0) {
      toast.error(`Preencha as variáveis: ${missingVariables.join(', ')}`)
      return
    }

    const processedMessage = processTemplate(selectedTemplate.content, templateVariables)
    onSendMessage(selectedContact, processedMessage)

    // Incrementar contador de uso
    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplate.id 
        ? { ...t, usageCount: t.usageCount + 1 }
        : t
    ))

    // Limpar estado
    setSelectedTemplate(null)
    setSelectedContact('')
    setTemplateVariables({})
    setIsSendDialogOpen(false)
    
    toast.success('Mensagem enviada com sucesso!')
  }

  const openSendDialog = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setTemplateVariables({})
    setIsSendDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates de Mensagem ({templates.length})
            </span>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Nome do Template</Label>
                      <Input
                        id="template-name"
                        placeholder="Ex: Saudação Inicial"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-category">Categoria</Label>
                      <Select 
                        value={newTemplate.category} 
                        onValueChange={(value: MessageTemplate['category']) => 
                          setNewTemplate(prev => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="template-content">Conteúdo</Label>
                    <Textarea
                      id="template-content"
                      placeholder="Digite o conteúdo do template. Use {variavel} para criar variáveis."
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {`{nome}`}, {`{data}`}, {`{horario}`} etc. para criar variáveis que serão preenchidas ao enviar.
                    </p>
                  </div>

                  {newTemplate.content && (
                    <div>
                      <Label>Variáveis Detectadas:</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {extractVariables(newTemplate.content).map(variable => (
                          <Badge key={variable} variant="outline">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false)
                        setNewTemplate({ name: '', content: '', category: 'personalizado' })
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateTemplate}>
                      Criar Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Lista de Templates */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge className={categoryColors[template.category]}>
                      {categoryLabels[template.category]}
                    </Badge>
                    {template.usageCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        {template.usageCount} usos
                      </Badge>
                    )}
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg mb-3">
                    <p className="text-sm whitespace-pre-wrap">{template.content}</p>
                  </div>

                  {template.variables.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">Variáveis:</span>
                      {template.variables.map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.createdAt.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSendDialog(template)}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Usar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie templates para agilizar o envio de mensagens frequentes
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para enviar template */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Enviar Template: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Seleção de contato */}
              <div>
                <Label>Destinatário</Label>
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.filter(c => !c.isGroup && !c.isBlocked).map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name || contact.pushname} - {contact.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Variáveis do template */}
              {selectedTemplate.variables.length > 0 && (
                <div className="space-y-3">
                  <Label>Preencher Variáveis</Label>
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable}>
                      <Label htmlFor={`var-${variable}`} className="text-sm">
                        {variable}
                      </Label>
                      <Input
                        id={`var-${variable}`}
                        placeholder={`Digite o valor para {${variable}}`}
                        value={templateVariables[variable] || ''}
                        onChange={(e) => setTemplateVariables(prev => ({
                          ...prev,
                          [variable]: e.target.value
                        }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Preview da mensagem */}
              <div>
                <Label>Preview da Mensagem</Label>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {processTemplate(selectedTemplate.content, templateVariables)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSendDialogOpen(false)
                    setSelectedTemplate(null)
                    setSelectedContact('')
                    setTemplateVariables({})
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendTemplate}
                  disabled={!selectedContact || selectedTemplate.variables.some(v => !templateVariables[v]?.trim())}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
