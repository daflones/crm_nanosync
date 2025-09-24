import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Cliente } from '@/types/cliente'
import { Loader2 } from 'lucide-react'

const clienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipo: z.enum(['pessoa_fisica', 'pessoa_juridica']),
  documento: z.string().min(11, 'Documento inválido'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().optional(),
  empresa: z.string().optional(),
  cargo: z.string().optional(),
  endereco: z.object({
    cep: z.string().min(8, 'CEP inválido'),
    rua: z.string().min(3, 'Rua é obrigatória'),
    numero: z.string().min(1, 'Número é obrigatório'),
    bairro: z.string().min(3, 'Bairro é obrigatório'),
    cidade: z.string().min(3, 'Cidade é obrigatória'),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  }).optional(),
  etapa_pipeline: z.enum(['novo', 'contato', 'qualificacao', 'proposta', 'negociacao', 'fechado', 'perdido']),
  valor_potencial: z.number().min(0),
  probabilidade: z.number().min(0).max(100),
  observacoes: z.string().optional(),
  status: z.enum(['ativo', 'inativo', 'prospecto', 'suspenso']),
})

type ClienteFormData = z.infer<typeof clienteSchema>

interface ClienteFormProps {
  cliente?: Cliente
  onSubmit: (data: ClienteFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ClienteForm({ cliente, onSubmit, onCancel, isLoading }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: cliente || {
      tipo: 'pessoa_fisica',
      etapa_pipeline: 'novo',
      valor_potencial: 0,
      probabilidade: 50,
      status: 'ativo',
    }
  })

  const tipo = watch('tipo')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Nome completo"
            className={errors.nome ? 'border-red-500' : ''}
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select
            value={tipo}
            onValueChange={(value) => setValue('tipo', value as 'pessoa_fisica' | 'pessoa_juridica')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
              <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="documento">
            {tipo === 'pessoa_fisica' ? 'CPF' : 'CNPJ'} *
          </Label>
          <Input
            id="documento"
            {...register('documento')}
            placeholder={tipo === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
            className={errors.documento ? 'border-red-500' : ''}
          />
          {errors.documento && (
            <p className="text-sm text-red-500">{errors.documento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            {...register('whatsapp')}
            placeholder="(00) 00000-0000"
          />
        </div>

        {tipo === 'pessoa_fisica' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                {...register('empresa')}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                {...register('cargo')}
                placeholder="Cargo na empresa"
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="etapa_pipeline">Etapa *</Label>
            <Select
              value={watch('etapa_pipeline')}
              onValueChange={(value) => setValue('etapa_pipeline', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contato">Contato</SelectItem>
                <SelectItem value="qualificacao">Qualificação</SelectItem>
                <SelectItem value="proposta">Proposta</SelectItem>
                <SelectItem value="negociacao">Negociação</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_potencial">Valor Potencial</Label>
            <Input
              id="valor_potencial"
              type="number"
              {...register('valor_potencial', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="probabilidade">Probabilidade (%)</Label>
            <Input
              id="probabilidade"
              type="number"
              min="0"
              max="100"
              {...register('probabilidade', { valueAsNumber: true })}
              placeholder="50"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          placeholder="Observações sobre o cliente..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select
          value={watch('status')}
          onValueChange={(value) => setValue('status', value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="prospecto">Prospecto</SelectItem>
            <SelectItem value="suspenso">Suspenso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar'
          )}
        </Button>
      </div>
    </form>
  )
}
