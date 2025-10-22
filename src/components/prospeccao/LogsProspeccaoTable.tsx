import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Filter,
  CheckCircle,
  MessageSquare,
  User,
  MapPin,
  Phone
} from 'lucide-react'
import { useLogsProspeccao } from '@/hooks/useLogsProspeccao'
import type { LogProspeccao } from '@/services/api/prospeccao-logs'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FiltrosState {
  tipo_estabelecimento: string
  cidade: string
  whatsapp_valido: string
  mensagem_enviada: string
  cliente_salvo: string
  data_inicio: string
  data_fim: string
  page: number
  limit: number
}

export default function LogsProspeccaoTable() {
  const [filtros, setFiltros] = useState<FiltrosState>({
    tipo_estabelecimento: '',
    cidade: '',
    whatsapp_valido: 'all',
    mensagem_enviada: 'all',
    cliente_salvo: 'all',
    data_inicio: '',
    data_fim: '',
    page: 1,
    limit: 50
  })

  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosState>(filtros)

  const { 
    logs, 
    totalLogs, 
    estatisticas, 
    isLoading,
    error 
  } = useLogsProspeccao({
    tipo_estabelecimento: filtrosAplicados.tipo_estabelecimento || undefined,
    cidade: filtrosAplicados.cidade || undefined,
    whatsapp_valido: filtrosAplicados.whatsapp_valido && filtrosAplicados.whatsapp_valido !== 'all' ? filtrosAplicados.whatsapp_valido === 'true' : undefined,
    mensagem_enviada: filtrosAplicados.mensagem_enviada && filtrosAplicados.mensagem_enviada !== 'all' ? filtrosAplicados.mensagem_enviada === 'true' : undefined,
    cliente_salvo: filtrosAplicados.cliente_salvo && filtrosAplicados.cliente_salvo !== 'all' ? filtrosAplicados.cliente_salvo === 'true' : undefined,
    data_inicio: filtrosAplicados.data_inicio || undefined,
    data_fim: filtrosAplicados.data_fim || undefined,
    page: filtrosAplicados.page,
    limit: filtrosAplicados.limit
  })

  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtros, page: 1 })
  }

  const limparFiltros = () => {
    const filtrosLimpos = {
      tipo_estabelecimento: '',
      cidade: '',
      whatsapp_valido: 'all',
      mensagem_enviada: 'all',
      cliente_salvo: 'all',
      data_inicio: '',
      data_fim: '',
      page: 1,
      limit: 50
    }
    setFiltros(filtrosLimpos)
    setFiltrosAplicados(filtrosLimpos)
  }

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return data
    }
  }

  const getStatusBadge = (log: LogProspeccao) => {
    if (log.cliente_salvo) {
      return <Badge className="bg-green-100 text-green-800">Cliente Salvo</Badge>
    }
    if (log.mensagem_enviada) {
      return <Badge className="bg-blue-100 text-blue-800">Mensagem Enviada</Badge>
    }
    if (log.whatsapp_valido) {
      return <Badge className="bg-yellow-100 text-yellow-800">WhatsApp Válido</Badge>
    }
    return <Badge variant="outline">Prospectado</Badge>
  }

  const totalPaginas = Math.ceil(totalLogs / filtrosAplicados.limit)

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Erro ao carregar logs: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Prospectados</p>
                <p className="text-2xl font-bold">{estatisticas.total_prospectados}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">WhatsApp Válidos</p>
                <p className="text-2xl font-bold">{estatisticas.whatsapp_validos}</p>
              </div>
              <Phone className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mensagens Enviadas</p>
                <p className="text-2xl font-bold">{estatisticas.mensagens_enviadas}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Salvos</p>
                <p className="text-2xl font-bold">{estatisticas.clientes_salvos}</p>
              </div>
              <User className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa Conversão</p>
                <p className="text-2xl font-bold">{estatisticas.taxa_conversao}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="tipo_estabelecimento">Tipo Estabelecimento</Label>
              <Input
                id="tipo_estabelecimento"
                placeholder="Ex: restaurante"
                value={filtros.tipo_estabelecimento}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo_estabelecimento: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                placeholder="Ex: São Paulo"
                value={filtros.cidade}
                onChange={(e) => setFiltros(prev => ({ ...prev, cidade: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="whatsapp_valido">WhatsApp Válido</Label>
              <Select value={filtros.whatsapp_valido} onValueChange={(value) => setFiltros(prev => ({ ...prev, whatsapp_valido: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mensagem_enviada">Mensagem Enviada</Label>
              <Select value={filtros.mensagem_enviada} onValueChange={(value) => setFiltros(prev => ({ ...prev, mensagem_enviada: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cliente_salvo">Cliente Salvo</Label>
              <Select value={filtros.cliente_salvo} onValueChange={(value) => setFiltros(prev => ({ ...prev, cliente_salvo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" onClick={limparFiltros}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Prospecção</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {logs.length} de {totalLogs} registros
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum log encontrado
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estabelecimento</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Prospecção</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.nome_estabelecimento}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.endereco}
                        </TableCell>
                        <TableCell>
                          {log.telefone || '-'}
                        </TableCell>
                        <TableCell>
                          {log.tipo_estabelecimento}
                        </TableCell>
                        <TableCell>
                          {log.cidade}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log)}
                        </TableCell>
                        <TableCell>
                          {formatarData(log.data_prospeccao)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.observacoes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Página {filtrosAplicados.page} de {totalPaginas}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filtrosAplicados.page <= 1}
                      onClick={() => setFiltrosAplicados(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filtrosAplicados.page >= totalPaginas}
                      onClick={() => setFiltrosAplicados(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
