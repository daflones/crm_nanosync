import { Phone, Trash2, TrendingUp, FileText, Target, Award, Mail, Calendar, DollarSign, User, MessageCircle } from 'lucide-react'
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
      className="relative cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white overflow-hidden min-h-[600px]"
      onClick={onView}
    >
      <CardHeader className="pb-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
              <span className="text-white font-bold text-2xl">
                {vendedor.nome?.charAt(0)?.toUpperCase() || 'V'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-xl mb-2 truncate">
                {vendedor.nome || `Vendedor #${vendedor.id?.slice(-4)}`}
              </h3>
              <div className="flex flex-col gap-2">
                <Badge className={`text-xs px-3 py-1 font-medium ${getStatusColor(vendedor.status || 'ativo')} border-0 w-fit`}>
                  {vendedor.status || 'ativo'}
                </Badge>
                {vendedor.email && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{vendedor.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 text-center border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <FileText className="h-7 w-7 mx-auto text-blue-600 mb-3" />
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {performance?.total_propostas || 0}
            </div>
            <div className="text-sm font-medium text-blue-700">Propostas</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 text-center border border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <Award className="h-7 w-7 mx-auto text-green-600 mb-3" />
            <div className="text-3xl font-bold text-green-900 mb-1">
              {performance?.propostas_aprovadas || 0}
            </div>
            <div className="text-sm font-medium text-green-700">Aprovadas</div>
          </div>
        </div>

        {/* Meta Progress */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 space-y-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl shadow-sm">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-gray-800 mb-1">Meta Mensal</h4>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-xl font-bold text-gray-900">
                  R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-300 rounded-full h-5 shadow-inner overflow-hidden">
            <div 
              className={`h-5 rounded-full transition-all duration-700 shadow-sm ${getPerformanceColor(percentualMeta)}`}
              style={{ width: `${Math.min(percentualMeta, 100)}%` }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200 shadow-sm">
              <div className="text-xl font-bold text-green-700 mb-1">
                R$ {realizadoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </div>
              <div className="text-sm font-medium text-green-600">Realizado</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center border border-red-200 shadow-sm">
              <div className="text-xl font-bold text-red-700 mb-1">
                R$ {faltaMeta.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </div>
              <div className="text-sm font-medium text-red-600">Restante</div>
            </div>
          </div>
          
          <div className="text-center bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className={`text-3xl font-bold mb-1 ${percentualMeta >= 100 ? 'text-green-600' : percentualMeta >= 75 ? 'text-blue-600' : percentualMeta >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {percentualMeta.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-gray-600">da meta atingida</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 space-y-4 shadow-sm">
          <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            Informações Adicionais
          </h4>
          
          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 gap-3">
            {vendedor.telefone && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <Phone className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-blue-600 mb-1">Telefone</div>
                    <div className="text-sm font-bold text-blue-800">{vendedor.telefone}</div>
                  </div>
                </div>
              </div>
            )}
            
            {vendedor.whatsapp && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-200 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-green-600 mb-1">WhatsApp</div>
                    <div className="text-sm font-bold text-green-800">{vendedor.whatsapp}</div>
                  </div>
                </div>
              </div>
            )}
            
            {vendedor.data_contratacao && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-700" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-purple-600 mb-1">Contratação</div>
                    <div className="text-sm font-bold text-purple-800">
                      {new Date(vendedor.data_contratacao).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {vendedor.salario_base && vendedor.salario_base > 0 && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-200 rounded-lg">
                    <DollarSign className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-emerald-600 mb-1">Salário Base</div>
                    <div className="text-sm font-bold text-emerald-800">
                      R$ {vendedor.salario_base.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Detalhes
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200"
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
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md transition-all duration-200"
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
