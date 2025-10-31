import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClienteAcoes } from '@/hooks/useClienteAcoes'
import { useVendedores } from '@/hooks/useVendedores'
import { useClientes } from '@/hooks/useClientes'
import { useSetoresAtivos } from '@/hooks/useSetores'
import { useProfile } from '@/hooks/useConfiguracoes'
import type { ClienteAcao, TipoAcao, StatusAcao } from '@/types/cliente-acao'

interface AcaoModalProps {
  clienteId: string
  acao?: ClienteAcao | null
  aberto: boolean
  onFechar: () => void
}

interface FormData {
  titulo: string
  descricao: string
  tipo: TipoAcao
  status: StatusAcao
  data_prevista: string
  responsavel_id: string
}

const TIPOS_ACAO: { value: TipoAcao; label: string }[] = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'fechamento', label: 'Fechamento' },
  { value: 'pos_venda', label: 'Pós-venda' },
  { value: 'outra', label: 'Outra' }
]

const STATUS_ACAO: { value: StatusAcao; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' }
]

export default function AcaoModal({ 
  clienteId, 
  acao, 
  aberto, 
  onFechar 
}: AcaoModalProps) {
  const { criar, atualizar, isCriando, isAtualizando } = useClienteAcoes(clienteId)
  const { data: vendedores = [] } = useVendedores()
  const { data: clientes = [] } = useClientes({ page: 1, limit: 1000 })
  const { data: setores = [] } = useSetoresAtivos()
  const { data: profile } = useProfile()
  
  // Buscar o cliente atual para pegar o vendedor associado
  const clienteAtual = clientes.find(c => c.id === clienteId)
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo: 'ligacao',
      status: 'pendente',
      data_prevista: new Date().toISOString().slice(0, 16),
      responsavel_id: clienteAtual?.vendedor_id || ''
    }
  })

  const tipoSelecionado = watch('tipo')
  const statusSelecionado = watch('status')
  const responsavelSelecionado = watch('responsavel_id')

  useEffect(() => {
    if (acao) {
      reset({
        titulo: acao.titulo,
        descricao: acao.descricao || '',
        tipo: acao.tipo,
        status: acao.status,
        data_prevista: acao.data_prevista.slice(0, 16),
        responsavel_id: acao.responsavel_id || clienteAtual?.vendedor_id || ''
      })
    } else {
      reset({
        titulo: '',
        descricao: '',
        tipo: 'ligacao',
        status: 'pendente',
        data_prevista: new Date().toISOString().slice(0, 16),
        responsavel_id: clienteAtual?.vendedor_id || ''
      })
    }
  }, [acao, reset, clienteAtual])

  const onSubmit = async (data: FormData) => {
    try {
      if (acao) {
        // Atualizar
        await atualizar({
          id: acao.id,
          data: {
            titulo: data.titulo,
            descricao: data.descricao || undefined,
            tipo: data.tipo,
            status: data.status,
            data_prevista: new Date(data.data_prevista).toISOString(),
            responsavel_id: data.responsavel_id || undefined
          }
        })
      } else {
        // Criar
        await criar({
          cliente_id: clienteId,
          titulo: data.titulo,
          descricao: data.descricao || undefined,
          tipo: data.tipo,
          status: data.status,
          data_prevista: new Date(data.data_prevista).toISOString(),
          responsavel_id: data.responsavel_id || undefined
        })
      }
      onFechar()
    } catch (error) {
      console.error('Erro ao salvar ação:', error)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {acao ? 'Editar Ação' : 'Nova Ação'}
          </DialogTitle>
          <DialogDescription>
            {acao 
              ? 'Atualize as informações da ação do cliente'
              : 'Adicione uma nova ação na linha do tempo do cliente'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Título */}
          <div>
            <Label htmlFor="titulo">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titulo"
              placeholder="Ex: Ligar para apresentar proposta"
              {...register('titulo', { 
                required: 'Título é obrigatório',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' }
              })}
            />
            {errors.titulo && (
              <p className="text-sm text-red-600 mt-1">{errors.titulo.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Detalhes adicionais sobre a ação..."
              rows={3}
              {...register('descricao')}
            />
          </div>

          {/* Tipo e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={tipoSelecionado} 
                onValueChange={(value) => setValue('tipo', value as TipoAcao)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ACAO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={statusSelecionado} 
                onValueChange={(value) => setValue('status', value as StatusAcao)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ACAO.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Prevista */}
          <div>
            <Label htmlFor="data_prevista">
              Data/Hora Prevista <span className="text-red-500">*</span>
            </Label>
            <Input
              id="data_prevista"
              type="datetime-local"
              {...register('data_prevista', { 
                required: 'Data prevista é obrigatória'
              })}
            />
            {errors.data_prevista && (
              <p className="text-sm text-red-600 mt-1">{errors.data_prevista.message}</p>
            )}
          </div>

          {/* Responsável */}
          <div>
            <Label htmlFor="responsavel_id">
              Responsável pela Ação
            </Label>
            <Select 
              value={responsavelSelecionado || 'none'} 
              onValueChange={(value) => setValue('responsavel_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum responsável</SelectItem>
                
                {/* Administrador */}
                {profile && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Administrador
                    </div>
                    <SelectItem value={profile.id}>
                      👨‍💼 {profile.nome || profile.email} (Administrador)
                    </SelectItem>
                  </>
                )}
                
                {/* Vendedores */}
                {vendedores.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-t mt-1 pt-2">
                      Vendedores
                    </div>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        👤 {vendedor.nome}
                        {clienteAtual?.vendedor_id === vendedor.id && ' (Vendedor do cliente)'}
                      </SelectItem>
                    ))}
                  </>
                )}
                
                {/* Setores */}
                {setores.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-t mt-1 pt-2">
                      Setores de Atendimento
                    </div>
                    {setores.map((setor) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        🏢 {setor.nome}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {clienteAtual?.vendedor_id 
                ? 'O vendedor do cliente é selecionado por padrão, mas você pode escolher outro vendedor, setor ou o administrador.'
                : 'Selecione quem será responsável por executar esta ação (vendedor, setor ou administrador).'
              }
            </p>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onFechar}
              disabled={isCriando || isAtualizando}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isCriando || isAtualizando}
            >
              {isCriando || isAtualizando ? 'Salvando...' : acao ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
