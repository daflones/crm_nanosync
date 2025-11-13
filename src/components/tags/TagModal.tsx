import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tag as TagIcon, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CORES_DISPONIVEIS } from '@/types/tag'
import type { Tag } from '@/types/tag'

interface TagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag?: Tag | null
  onSubmit: (data: { nome: string; cor: string }) => void
  isLoading?: boolean
}

export function TagModal({ open, onOpenChange, tag, onSubmit, isLoading }: TagModalProps) {
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(CORES_DISPONIVEIS[0].valor)

  useEffect(() => {
    if (tag) {
      setNome(tag.nome)
      setCor(tag.cor)
    } else {
      setNome('')
      setCor(CORES_DISPONIVEIS[0].valor)
    }
  }, [tag, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    onSubmit({ nome: nome.trim(), cor })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            {tag ? 'Editar Tag' : 'Nova Tag'}
          </DialogTitle>
          <DialogDescription>
            {tag ? 'Edite os detalhes da tag/marcador.' : 'Crie uma nova tag/marcador para organizar seus clientes.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da Tag */}
          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome da Tag <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: VIP, Atacado, Varejo, etc."
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500">
              Máximo 50 caracteres
            </p>
          </div>

          {/* Cor da Tag */}
          <div className="space-y-2">
            <Label>Cor da Tag</Label>
            <Select value={cor} onValueChange={setCor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CORES_DISPONIVEIS.map((corOption) => (
                  <SelectItem key={corOption.valor} value={corOption.valor}>
                    <div className="flex items-center gap-2">
                      <Badge className={corOption.valor}>
                        {corOption.nome}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <Badge className={cor}>
                {nome || 'Nome da Tag'}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!nome.trim() || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tag ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
