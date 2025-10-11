import { useState } from 'react'
import { Bell, Check, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow, subHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  useNotificacoesRecentes, 
  useNotificacoesNaoLidas,
  useMarcarComoLida,
  useMarcarTodasComoLidas,
  useApagarNotificacao
} from '@/hooks/useNotificacoes'
import { type Notificacao } from '@/services/api/notificacoes'
import { cn } from '@/lib/utils'

interface NotificationButtonProps {
  onOpenCenter?: () => void
}

export function NotificationButton({ onOpenCenter }: NotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const { data: notificacoesRecentes = [], isLoading } = useNotificacoesRecentes()
  const { data: contadorNaoLidas = 0 } = useNotificacoesNaoLidas()
  const marcarComoLida = useMarcarComoLida()
  const marcarTodasComoLidas = useMarcarTodasComoLidas()
  const apagarNotificacao = useApagarNotificacao()

  const handleMarcarComoLida = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida.mutate(notificacao.id)
    }
  }

  const handleApagarNotificacao = (notificacaoId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    apagarNotificacao.mutate(notificacaoId)
  }

  const handleMarcarTodasComoLidas = () => {
    marcarTodasComoLidas.mutate()
  }

  const getPriorityColor = (prioridade: Notificacao['prioridade']) => {
    const colors = {
      'baixa': 'border-l-gray-400',
      'normal': 'border-l-blue-400',
      'alta': 'border-l-orange-400',
      'urgente': 'border-l-red-400'
    }
    return colors[prioridade] || colors.normal
  }

  const getCategoryIcon = (categoria: Notificacao['categoria']) => {
    const icons = {
      'agendamento': '📅',
      'proposta': '📄',
      'cliente': '👤',
      'sistema': '⚙️',
      'geral': '🔔'
    }
    return icons[categoria] || icons.geral
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {contadorNaoLidas > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {contadorNaoLidas > 99 ? '99+' : contadorNaoLidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notificações</h4>
          <div className="flex items-center gap-2">
            {contadorNaoLidas > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarcarTodasComoLidas}
                className="h-8 px-2"
              >
                <Check className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
            )}
            {onOpenCenter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenCenter()
                  setIsOpen(false)
                }}
                className="h-8 px-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : notificacoesRecentes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="space-y-1">
              {notificacoesRecentes.map((notificacao) => (
                <DropdownMenuItem
                  key={notificacao.id}
                  className={cn(
                    "flex flex-col items-start p-4 cursor-pointer border-l-4",
                    getPriorityColor(notificacao.prioridade),
                    !notificacao.lida && "bg-muted/50"
                  )}
                  onClick={() => handleMarcarComoLida(notificacao)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-lg">
                        {getCategoryIcon(notificacao.categoria)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-sm truncate">
                            {notificacao.titulo}
                          </h5>
                          {!notificacao.lida && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        {notificacao.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notificacao.descricao}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {notificacao.created_at ? formatDistanceToNow(subHours(new Date(notificacao.created_at), 3), {
                            addSuffix: true,
                            locale: ptBR
                          }) : 'Data desconhecida'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleApagarNotificacao(notificacao.id, e)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notificacoesRecentes.length > 0 && onOpenCenter && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={() => {
                  onOpenCenter()
                  setIsOpen(false)
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
