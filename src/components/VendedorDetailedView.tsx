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
  DollarSign
} from 'lucide-react'
import { useVendedorPerformance } from '@/hooks/useVendedores'
import type { Vendedor } from '@/services/api/vendedores'

interface VendedorDetailedViewProps {
  vendedor: Vendedor
}

export function VendedorDetailedView({ vendedor }: VendedorDetailedViewProps) {
  const { data: performance, isLoading } = useVendedorPerformance(vendedor.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'inativo': return 'bg-red-100 text-red-800'
      case 'ferias': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
    </div>
  )
}
