import { useState } from 'react'
import { 
  Phone, 
  DollarSign, 
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Eye,
  Bot
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
      className={`mb-1 cursor-move transition-all duration-200 hover:shadow-sm ${
        isDragging ? 'opacity-50 rotate-1' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="pb-0 px-1.5 pt-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h4 className="font-medium text-xs truncate">{cliente.nome_contato}</h4>
              {cliente.origem === 'IA' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold">
                  <Bot className="h-2.5 w-2.5" />
                  IA
                </span>
              )}
            </div>
            {cliente.nome_empresa && (
              <p className="text-xs text-gray-400 truncate">{cliente.nome_empresa}</p>
            )}
          </div>
          <QualificationIndicator cliente={cliente} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0.5 px-1.5 pb-1">
        <div className="space-y-0.5">
          {/* Value */}
          <div className="flex items-center gap-1 text-green-600">
            <DollarSign className="h-2 w-2" />
            <span className="text-xs font-medium">{formatCurrency(cliente.valor_estimado)}</span>
          </div>

          {/* WhatsApp - Only if exists */}
          {cliente.whatsapp && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Phone className="h-2 w-2 text-green-600" />
              <span className="truncate text-xs">{cliente.whatsapp}</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex justify-end gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-3 w-3 p-0"
              onClick={() => onView(cliente)}
            >
              <Eye className="h-1.5 w-1.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-3 w-3 p-0"
              onClick={() => onEdit(cliente)}
            >
              <Edit className="h-1.5 w-1.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-3 w-3 p-0 text-red-600 hover:text-red-700"
              onClick={() => onDelete(cliente)}
            >
              <Trash2 className="h-1.5 w-1.5" />
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
      className={`flex-shrink-0 ${stage.color} border-2 rounded-lg transition-all duration-200 ${
        isDragOver ? 'border-blue-400 bg-blue-50' : ''
      }`}
      style={{ minWidth: '150px', maxWidth: '160px', width: '160px' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-1.5">
        {/* Column Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Badge className={`${stage.badgeColor} text-white text-xs`}>
              {clientes.length}
            </Badge>
            <h3 className={`text-xs font-medium ${stage.textColor} truncate`}>{stage.name}</h3>
          </div>
          <div className="text-xs text-gray-600 truncate">
            {formatCurrency(totalValue)}
          </div>
        </div>

        {/* Cards Container */}
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
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
    <div className="w-full">
      <div 
        className="kanban-scroll-container overflow-x-auto overflow-y-hidden pb-4"
      >
        <div 
          className="flex gap-2 px-3"
          style={{ 
            width: `${pipelineStages.length * 150 + (pipelineStages.length + 1) * 12}px`,
            minWidth: 'max-content'
          }}
        >
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
    </div>
  )
}
