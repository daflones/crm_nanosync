import { useState } from 'react'
import { 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Simple Badge component inline since we don't have class-variance-authority
const Badge = ({ children, className, variant = 'default', ...props }: {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline'
  [key: string]: any
}) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
  const variantClasses = variant === 'outline' 
    ? "border border-gray-200 text-gray-700" 
    : "bg-gray-900 text-white"
  
  return (
    <div className={`${baseClasses} ${variantClasses} ${className || ''}`} {...props}>
      {children}
    </div>
  )
}

interface Cliente {
  id: string
  nome_contato: string
  nome_empresa?: string
  email?: string
  telefone?: string
  whatsapp?: string
  documento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  segmento_cliente?: string
  etapa_pipeline: string
  valor_estimado: number
  probabilidade: number
  classificacao: string
  origem: string
  observacoes?: string
  vendedor_id?: string
  created_at?: string
  updated_at?: string
}

interface KanbanBoardProps {
  clientes: Cliente[]
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
  onView: (cliente: Cliente) => void
  onUpdateStage: (clienteId: string, newStage: string) => void
}

const pipelineStages = [
  { 
    id: 'novo', 
    name: 'Novo Lead', 
    color: 'bg-gray-100 border-gray-300',
    textColor: 'text-gray-700',
    badgeColor: 'bg-gray-500'
  },
  { 
    id: 'contactado', 
    name: 'Contactado', 
    color: 'bg-blue-50 border-blue-300',
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-500'
  },
  { 
    id: 'qualificado', 
    name: 'Qualificado', 
    color: 'bg-indigo-50 border-indigo-300',
    textColor: 'text-indigo-700',
    badgeColor: 'bg-indigo-500'
  },
  { 
    id: 'proposta', 
    name: 'Proposta', 
    color: 'bg-purple-50 border-purple-300',
    textColor: 'text-purple-700',
    badgeColor: 'bg-purple-500'
  },
  { 
    id: 'negociacao', 
    name: 'Negociação', 
    color: 'bg-orange-50 border-orange-300',
    textColor: 'text-orange-700',
    badgeColor: 'bg-orange-500'
  },
  { 
    id: 'fechado', 
    name: 'Fechado', 
    color: 'bg-green-50 border-green-300',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-500'
  },
  { 
    id: 'perdido', 
    name: 'Perdido', 
    color: 'bg-red-50 border-red-300',
    textColor: 'text-red-700',
    badgeColor: 'bg-red-500'
  }
]

const classificacaoColors = {
  'quente': 'bg-red-100 text-red-800 border-red-200',
  'morno': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'frio': 'bg-blue-100 text-blue-800 border-blue-200',
}

const origemLabels = {
  'manual': 'Manual',
  'whatsapp': 'WhatsApp',
  'site': 'Site',
  'indicacao': 'Indicação',
  'feira': 'Feira',
  'cold_call': 'Cold Call',
  'email': 'Email',
  'redes_sociais': 'Redes Sociais',
}

// Lead qualification validation - 8 required fields aligned with database
const getQualificationScore = (cliente: Cliente): { score: number; total: number; missingFields: string[] } => {
  const requiredFields = [
    { key: 'nome_contato', label: 'Nome do Contato' },
    { key: 'email', label: 'Email' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'nome_empresa', label: 'Nome da Empresa' },
    { key: 'segmento_cliente', label: 'Segmento' },
    { key: 'endereco', label: 'Endereço' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'valor_estimado', label: 'Valor Estimado' },
  ]

  const missingFields: string[] = []
  let score = 0

  requiredFields.forEach(field => {
    const value = cliente[field.key as keyof Cliente]
    if (value && value !== '' && value !== 0) {
      score++
    } else {
      missingFields.push(field.label)
    }
  })

  return { score, total: requiredFields.length, missingFields }
}

const QualificationIndicator = ({ cliente }: { cliente: Cliente }) => {
  const { score, total } = getQualificationScore(cliente)
  const percentage = (score / total) * 100
  
  const getIndicatorColor = () => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getIndicatorIcon = () => {
    if (percentage >= 100) return <CheckCircle2 className="h-4 w-4" />
    if (percentage >= 75) return <Clock className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${getIndicatorColor()}`}>
      {getIndicatorIcon()}
      <span>{score}/{total}</span>
    </div>
  )
}

const ClientCard = ({ cliente, onEdit, onDelete, onView }: {
  cliente: Cliente
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
  onView: (cliente: Cliente) => void
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', cliente.id)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <Card 
      className={`mb-3 cursor-move transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="pb-1 px-3 pt-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-xs truncate">{cliente.nome_contato}</h4>
            {cliente.nome_empresa && (
              <p className="text-xs text-gray-500 truncate">{cliente.nome_empresa}</p>
            )}
          </div>
          <QualificationIndicator cliente={cliente} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-3 pb-2">
        <div className="space-y-1">
          {/* Contact Info */}
          <div className="flex flex-col gap-0.5">
            {cliente.email && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Mail className="h-2.5 w-2.5" />
                <span className="truncate text-xs">{cliente.email}</span>
              </div>
            )}
            {cliente.telefone && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Phone className="h-2.5 w-2.5" />
                <span className="text-xs">{cliente.telefone}</span>
              </div>
            )}
            {(cliente.cidade || cliente.estado) && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="h-2.5 w-2.5" />
                <span className="truncate text-xs">
                  {[cliente.cidade, cliente.estado].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Value and Probability */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-green-600">
              <DollarSign className="h-2.5 w-2.5" />
              <span className="text-xs font-medium">{formatCurrency(cliente.valor_estimado)}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUp className="h-2.5 w-2.5" />
              <span className="text-xs">{cliente.probabilidade}%</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-0.5">
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1 py-0 h-4 ${classificacaoColors[cliente.classificacao as keyof typeof classificacaoColors]}`}
            >
              {cliente.classificacao}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              {origemLabels[cliente.origem as keyof typeof origemLabels]}
            </Badge>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-end gap-0.5 pt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={() => onView(cliente)}
            >
              <Eye className="h-2.5 w-2.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={() => onEdit(cliente)}
            >
              <Edit className="h-2.5 w-2.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
              onClick={() => onDelete(cliente)}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const KanbanColumn = ({ 
  stage, 
  clientes, 
  onEditCliente, 
  onDeleteCliente, 
  onViewCliente, 
  onUpdateStage 
}: {
  stage: typeof pipelineStages[0]
  clientes: Cliente[]
  onEditCliente: (cliente: Cliente) => void
  onDeleteCliente: (cliente: Cliente) => void
  onViewCliente: (cliente: Cliente) => void
  onUpdateStage: (clienteId: string, newStage: string) => void
}) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const clienteId = e.dataTransfer.getData('text/plain')
    onUpdateStage(clienteId, stage.id)
  }

  const totalValue = clientes.reduce((sum, cliente) => sum + cliente.valor_estimado, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div 
      className={`flex-shrink-0 w-52 ${stage.color} border-2 rounded-lg transition-all duration-200 ${
        isDragOver ? 'border-blue-400 bg-blue-50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-3">
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge className={`${stage.badgeColor} text-white`}>
              {clientes.length}
            </Badge>
            <h3 className={`text-xs font-medium ${stage.textColor}`}>{stage.name}</h3>
          </div>
          <div className="text-xs text-gray-600">
            {formatCurrency(totalValue)}
          </div>
        </div>

        {/* Cards Container */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {clientes.map((cliente) => (
            <ClientCard
              key={cliente.id}
              cliente={cliente}
              onEdit={onEditCliente}
              onDelete={onDeleteCliente}
              onView={onViewCliente}
            />
          ))}
          {clientes.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum cliente nesta etapa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function KanbanBoard({ 
  clientes, 
  onEdit, 
  onDelete, 
  onView, 
  onUpdateStage 
}: KanbanBoardProps) {
  const getClientesByStage = (stageId: string) => {
    return clientes.filter(cliente => cliente.etapa_pipeline === stageId)
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="flex gap-2 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            clientes={getClientesByStage(stage.id)}
            onEditCliente={onEdit}
            onDeleteCliente={onDelete}
            onViewCliente={onView}
            onUpdateStage={onUpdateStage}
          />
        ))}
      </div>
    </div>
  )
}
