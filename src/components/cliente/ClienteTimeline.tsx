import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  UserCheck,
  Users,
  CheckCircle2,
  HeadphonesIcon,
  Plus,
  GripVertical,
  Check,
  Clock,
  Trash2,
  Edit
} from 'lucide-react'
import { useClienteAcoes } from '@/hooks/useClienteAcoes'
import { useVendedores } from '@/hooks/useVendedores'
import { useSetoresAtivos } from '@/hooks/useSetores'
import { useProfile } from '@/hooks/useConfiguracoes'
import type { ClienteAcao, TipoAcao, StatusAcao } from '@/types/cliente-acao'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClienteTimelineProps {
  clienteId: string
  onNovaAcao: () => void
  onEditarAcao: (acao: ClienteAcao) => void
}

const ICONES_TIPO: Record<TipoAcao, React.ReactNode> = {
  ligacao: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  reuniao: <Calendar className="h-4 w-4" />,
  proposta: <FileText className="h-4 w-4" />,
  follow_up: <UserCheck className="h-4 w-4" />,
  negociacao: <Users className="h-4 w-4" />,
  fechamento: <CheckCircle2 className="h-4 w-4" />,
  pos_venda: <HeadphonesIcon className="h-4 w-4" />,
  outra: <FileText className="h-4 w-4" />
}

const CORES_STATUS: Record<StatusAcao, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  concluida: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  cancelada: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
}

const LABELS_STATUS: Record<StatusAcao, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
}

const LABELS_TIPO: Record<TipoAcao, string> = {
  ligacao: 'Ligação',
  email: 'E-mail',
  reuniao: 'Reunião',
  proposta: 'Proposta',
  follow_up: 'Follow-up',
  negociacao: 'Negociação',
  fechamento: 'Fechamento',
  pos_venda: 'Pós-venda',
  outra: 'Outra'
}

export default function ClienteTimeline({ 
  clienteId, 
  onNovaAcao,
  onEditarAcao 
}: ClienteTimelineProps) {
  const { acoes, isLoading, reordenar, marcarConcluida, deletar } = useClienteAcoes(clienteId)
  const { data: vendedores = [] } = useVendedores()
  const { data: setores = [] } = useSetoresAtivos()
  const { data: profile } = useProfile()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const getNomeResponsavel = (responsavelId?: string) => {
    if (!responsavelId) return null
    
    // Verificar se é o administrador
    if (profile && responsavelId === profile.id) {
      return `${profile.nome || profile.email} (Admin)`
    }
    
    // Verificar se é um vendedor
    const vendedor = vendedores.find(v => v.id === responsavelId)
    if (vendedor) {
      return vendedor.nome
    }
    
    // Verificar se é um setor
    const setor = setores.find(s => s.id === responsavelId)
    if (setor) {
      return `${setor.nome} (Setor)`
    }
    
    return 'Responsável não encontrado'
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(id)
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverId(null)

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const draggedIndex = acoes.findIndex(a => a.id === draggedId)
    const targetIndex = acoes.findIndex(a => a.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null)
      return
    }

    // Criar nova ordem
    const novaOrdem = [...acoes]
    const [draggedItem] = novaOrdem.splice(draggedIndex, 1)
    novaOrdem.splice(targetIndex, 0, draggedItem)

    // Atualizar ordens
    const updates = novaOrdem.map((acao, index) => ({
      id: acao.id,
      ordem: index
    }))

    await reordenar(updates)
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleMarcarConcluida = async (id: string) => {
    await marcarConcluida(id)
  }

  const handleDeletar = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta ação?')) {
      await deletar(id)
    }
  }


  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Linha do Tempo de Ações
          </CardTitle>
          <Button onClick={onNovaAcao} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Ação
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {acoes.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Nenhuma ação cadastrada
            </p>
            <Button onClick={onNovaAcao} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Ação
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 dark:from-blue-800 dark:via-blue-700 dark:to-blue-800" />

            <div className="space-y-8">
              {acoes.map((acao) => (
                <div
                  key={acao.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, acao.id)}
                  onDragOver={(e) => handleDragOver(e, acao.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, acao.id)}
                  onDragEnd={handleDragEnd}
                  className={`
                    group relative flex items-start gap-6 transition-all cursor-move
                    ${draggedId === acao.id ? 'opacity-50 scale-95' : ''}
                    ${dragOverId === acao.id ? 'scale-105' : ''}
                  `}
                >
                  {/* Bolinha e Data na linha vertical */}
                  <div className="relative flex flex-col items-center min-w-[80px]">
                    {/* Bolinha (dot) */}
                    <div className={`
                      relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white dark:border-gray-900 shadow-lg transition-all
                      ${acao.status === 'concluida' 
                        ? 'bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30' 
                        : acao.status === 'em_andamento'
                        ? 'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30 animate-pulse'
                        : acao.status === 'cancelada'
                        ? 'bg-gray-400 ring-4 ring-gray-100 dark:ring-gray-900/30'
                        : 'bg-yellow-500 ring-4 ring-yellow-100 dark:ring-yellow-900/30'
                      }
                    `}>
                      <div className="text-white">
                        {ICONES_TIPO[acao.tipo]}
                      </div>
                    </div>
                    
                    {/* Data abaixo da bolinha - MAIS VISÍVEL */}
                    <div className="mt-2 text-center">
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {format(new Date(acao.data_prevista), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {format(new Date(acao.data_prevista), 'HH:mm', { locale: ptBR })}
                      </div>
                    </div>

                    {/* Handle de arrastar (aparece ao hover) */}
                    <div className="mt-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Card de conteúdo */}
                  <div className={`
                    flex-1 rounded-lg border p-4 transition-all
                    ${dragOverId === acao.id ? 'border-blue-500 border-2 shadow-lg' : 'border-gray-200 dark:border-gray-700'}
                    ${acao.status === 'concluida' ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-white dark:bg-gray-800'}
                    hover:shadow-md
                  `}>
                    {/* Cabeçalho */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {acao.titulo}
                          </h4>
                          <Badge className={CORES_STATUS[acao.status]}>
                            {LABELS_STATUS[acao.status]}
                          </Badge>
                        </div>
                        {acao.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {acao.descricao}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        {ICONES_TIPO[acao.tipo]}
                        <span className="font-medium">{LABELS_TIPO[acao.tipo]}</span>
                      </span>
                      {getNomeResponsavel(acao.responsavel_id) && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <UserCheck className="h-3 w-3" />
                          {getNomeResponsavel(acao.responsavel_id)}
                        </span>
                      )}
                      {acao.data_conclusao && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Check className="h-3 w-3" />
                          Concluída {format(new Date(acao.data_conclusao), 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      {acao.status !== 'concluida' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarcarConcluida(acao.id)}
                          className="flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Concluir
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditarAcao(acao)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletar(acao.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3 w-3" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
