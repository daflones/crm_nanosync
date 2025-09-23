import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  MapPin, 
  Target, 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Building2,
  Calendar
} from 'lucide-react'
import { useVendedorPerformance } from '@/hooks/useVendedores'
import { useClientesByVendedor } from '@/hooks/useClientes'
import type { Vendedor } from '@/services/api/vendedores'

interface VendedorDetailedViewProps {
  vendedor: Vendedor
}

export function VendedorDetailedView({ vendedor }: VendedorDetailedViewProps) {
  const { data: performance, isLoading } = useVendedorPerformance(vendedor.id)
  const { data: clientes, isLoading: isLoadingClientes } = useClientesByVendedor(vendedor.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'inativo': return 'bg-red-100 text-red-800'
      case 'ferias': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getClienteStatusColor = (etapa: string) => {
    switch (etapa) {
      case 'novo': return 'bg-gray-100 text-gray-800'
      case 'contactado': return 'bg-blue-100 text-blue-800'
      case 'qualificado': return 'bg-indigo-100 text-indigo-800'
      case 'proposta': return 'bg-purple-100 text-purple-800'
      case 'negociacao': return 'bg-orange-100 text-orange-800'
      case 'fechado': return 'bg-green-100 text-green-800'
      case 'perdido': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getClienteStatusName = (etapa: string) => {
    switch (etapa) {
      case 'novo': return 'Novo'
      case 'contactado': return 'Contactado'
      case 'qualificado': return 'Qualificado'
      case 'proposta': return 'Proposta'
      case 'negociacao': return 'Negociação'
      case 'fechado': return 'Fechado'
      case 'perdido': return 'Perdido'
      default: return etapa
    }
  }

  const clienteStats = {
    total: clientes?.length || 0,
    novo: clientes?.filter(c => c.etapa_pipeline === 'novo').length || 0,
    contactado: clientes?.filter(c => c.etapa_pipeline === 'contactado').length || 0,
    qualificado: clientes?.filter(c => c.etapa_pipeline === 'qualificado').length || 0,
    proposta: clientes?.filter(c => c.etapa_pipeline === 'proposta').length || 0,
    negociacao: clientes?.filter(c => c.etapa_pipeline === 'negociacao').length || 0,
    fechado: clientes?.filter(c => c.etapa_pipeline === 'fechado').length || 0,
    perdido: clientes?.filter(c => c.etapa_pipeline === 'perdido').length || 0,
  }

  const progressPercentage = vendedor.meta_mensal && performance?.total_vendas 
    ? Math.min((performance.total_vendas / vendedor.meta_mensal) * 100, 100)
    : 0

  const remainingAmount = vendedor.meta_mensal && performance?.total_vendas
    ? Math.max(vendedor.meta_mensal - performance.total_vendas, 0)
    : vendedor.meta_mensal || 0

  return (
    <div className="space-y-6">
      {/* Header com informações básicas */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold">{vendedor.nome}</h3>
            <Badge className={getStatusColor(vendedor.status || 'inativo')}>
              {vendedor.status || 'inativo'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{vendedor.email}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Feitas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : performance?.total_propostas || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de propostas criadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Aprovadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : performance?.propostas_aprovadas || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Propostas aprovadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Atingida</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {isLoading ? '...' : (performance?.total_vendas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Vendas realizadas este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falta Atingir</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Restante para meta mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso da Meta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso da Meta Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Meta: R$ {(vendedor.meta_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Realizado: R$ {(performance?.total_vendas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span>Restante: R$ {remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Informações Pessoais e Profissionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">CPF:</span>
              <span className="text-sm">{vendedor.cpf || 'Não informado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Telefone:</span>
              <span className="text-sm">{vendedor.telefone || 'Não informado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">WhatsApp:</span>
              <span className="text-sm">{vendedor.whatsapp || 'Não informado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Data de Nascimento:</span>
              <span className="text-sm">
                {vendedor.data_nascimento 
                  ? new Date(vendedor.data_nascimento).toLocaleDateString('pt-BR')
                  : 'Não informado'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Informações Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Meta Mensal:</span>
              <span className="text-sm font-bold text-green-600">
                R$ {(vendedor.meta_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Comissão:</span>
              <span className="text-sm">{vendedor.comissao_percentual || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Salário Base:</span>
              <span className="text-sm">
                R$ {(vendedor.salario_base || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Data de Contratação:</span>
              <span className="text-sm">
                {vendedor.data_contratacao 
                  ? new Date(vendedor.data_contratacao).toLocaleDateString('pt-BR')
                  : 'Não informado'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endereço */}
      {(vendedor.endereco || vendedor.cidade || vendedor.estado) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {vendedor.endereco && (
                <div>
                  {vendedor.endereco}
                  {vendedor.numero && `, ${vendedor.numero}`}
                  {vendedor.complemento && ` - ${vendedor.complemento}`}
                </div>
              )}
              {vendedor.bairro && <div>{vendedor.bairro}</div>}
              <div>
                {vendedor.cidade && vendedor.estado 
                  ? `${vendedor.cidade} - ${vendedor.estado}`
                  : vendedor.cidade || vendedor.estado || ''
                }
                {vendedor.cep && ` - CEP: ${vendedor.cep}`}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {vendedor.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{vendedor.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Clientes Associados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Associados ({clienteStats.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estatísticas dos Clientes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{clienteStats.novo}</div>
              <div className="text-xs text-blue-600">Novos</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{clienteStats.contactado}</div>
              <div className="text-xs text-blue-600">Contactado</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{clienteStats.proposta}</div>
              <div className="text-xs text-orange-600">Proposta</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{clienteStats.fechado}</div>
              <div className="text-xs text-green-600">Fechados</div>
            </div>
          </div>

          {/* Lista de Clientes */}
          {isLoadingClientes ? (
            <div className="text-center py-4 text-muted-foreground">
              Carregando clientes...
            </div>
          ) : clientes && clientes.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {clientes.map((cliente) => (
                <div key={cliente.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{cliente.nome_contato}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {cliente.nome_empresa}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{cliente.email}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getClienteStatusColor(cliente.etapa_pipeline)}>
                      {getClienteStatusName(cliente.etapa_pipeline)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum cliente associado a este vendedor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
