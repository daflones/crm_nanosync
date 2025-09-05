import { useVendedores } from '@/hooks/useVendedores'
import { useIsAdmin, useCurrentVendedorId } from '@/hooks/useAuth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface VendedorSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  required?: boolean
  disabled?: boolean
}

export function VendedorSelector({ 
  value, 
  onValueChange, 
  required = false, 
  disabled = false 
}: VendedorSelectorProps) {
  const { data: vendedores = [] } = useVendedores()
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()

  // If user is not admin and has a vendedor_id, auto-select and disable
  const shouldAutoSelect = !isAdmin && !!currentVendedorId
  const effectiveValue = shouldAutoSelect ? currentVendedorId : value
  const effectiveDisabled = disabled || shouldAutoSelect

  return (
    <div>
      <Label htmlFor="vendedor_id">
        Vendedor Responsável {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={effectiveValue || ''}
        onValueChange={onValueChange}
        disabled={effectiveDisabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione um vendedor" />
        </SelectTrigger>
        <SelectContent>
          {vendedores.map((vendedor) => (
            <SelectItem key={vendedor.id} value={vendedor.id}>
              {vendedor.nome || vendedor.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {shouldAutoSelect && (
        <p className="text-sm text-muted-foreground mt-1">
          Como vendedor, você só pode criar clientes para si mesmo.
        </p>
      )}
    </div>
  )
}
