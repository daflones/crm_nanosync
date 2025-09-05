import { Phone, Trash2, TrendingUp, FileText, Target, Award } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVendedorPerformance } from '@/hooks/useVendedores'
import type { Vendedor } from '@/services/api/vendedores'

interface VendedorCardProps {
  vendedor: Vendedor
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function VendedorCard({ vendedor, onView, onEdit, onDelete }: VendedorCardProps) {
  const { data: performance } = useVendedorPerformance(vendedor.id)
  
  const realizadoAtual = performance?.total_vendas || 0
  const metaMensal = vendedor.meta_mensal || 0
  const percentualMeta = metaMensal > 0 ? (realizadoAtual / metaMensal) * 100 : 0
  const faltaMeta = Math.max(0, metaMensal - realizadoAtual)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'inativo': return 'bg-red-100 text-red-800'
      case 'ferias': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceColor = (percentual: number) => {
    if (percentual >= 100) return 'bg-green-500'
    if (percentual >= 75) return 'bg-blue-500'
    if (percentual >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card 
      className="relative cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
      onClick={onView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">
                {vendedor.nome?.charAt(0)?.toUpperCase() || 'V'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {vendedor.nome || `Vendedor #${vendedor.id?.slice(-4)}`}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs px-2 py-1 ${getStatusColor(vendedor.status || 'ativo')}`}>
                  {vendedor.status || 'ativo'}
                </Badge>
                {vendedor.email && (
                  <span className="text-xs text-gray-500">{vendedor.email}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <FileText className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <div className="text-lg font-bold text-gray-900">
              {performance?.total_propostas || 0}
            </div>
            <div className="text-xs text-gray-600">Propostas</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Award className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <div className="text-lg font-bold text-gray-900">
              {performance?.propostas_aprovadas || 0}
            </div>
            <div className="text-xs text-gray-600">Aprovadas</div>
          </div>
        </div>

        {/* Meta Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Meta Mensal</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              R$ {metaMensal.toLocaleString('pt-BR')}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getPerformanceColor(percentualMeta)}`}
              style={{ width: `${Math.min(percentualMeta, 100)}%` }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-green-600">R$ {realizadoAtual.toLocaleString('pt-BR')}</div>
              <div className="text-gray-500">Realizado</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600">R$ {faltaMeta.toLocaleString('pt-BR')}</div>
              <div className="text-gray-500">Restante</div>
            </div>
          </div>
          
          <div className="text-center">
            <span className={`text-lg font-bold ${percentualMeta >= 100 ? 'text-green-600' : percentualMeta >= 75 ? 'text-blue-600' : 'text-red-600'}`}>
              {percentualMeta.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">da meta</span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t pt-3">
          <div className="flex flex-col space-y-1 text-sm">
            {vendedor.telefone && (
              <span className="flex items-center text-gray-600">
                <Phone className="h-3 w-3 mr-2" />
                {vendedor.telefone}
              </span>
            )}
            {vendedor.whatsapp && (
              <span className="flex items-center text-gray-600">
                <Phone className="h-3 w-3 mr-2" />
                {vendedor.whatsapp} (WhatsApp)
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            Editar
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
