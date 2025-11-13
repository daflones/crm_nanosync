import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tag as TagIcon, Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { useAllTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags'
import { TagModal } from './TagModal'
import type { Tag } from '@/types/tag'
import { TAG_COLORS_WITH_HOVER } from '@/types/tag'

interface TagsManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TagsManager({ open, onOpenChange }: TagsManagerProps) {
  const { data: tags = [], isLoading } = useAllTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()

  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)

  // Função helper para obter classes completas da tag (cor + hover)
  const getTagClasses = (cor: string): string => {
    const hoverColor = TAG_COLORS_WITH_HOVER[cor] || 'hover:bg-gray-200 dark:hover:bg-gray-800'
    return `${cor} ${hoverColor} transition-colors duration-200 cursor-default`
  }

  const handleCreateTag = (data: { nome: string; cor: string }) => {
    createTag.mutate(data, {
      onSuccess: (response) => {
        if (!response.error) {
          setIsTagModalOpen(false)
        }
      },
    })
  }

  const handleUpdateTag = (data: { nome: string; cor: string }) => {
    if (!selectedTag) return
    updateTag.mutate(
      { id: selectedTag.id, data },
      {
        onSuccess: (response) => {
          if (!response.error) {
            setIsTagModalOpen(false)
            setSelectedTag(null)
          }
        },
      }
    )
  }

  const handleDeleteTag = () => {
    if (!tagToDelete) return
    deleteTag.mutate(tagToDelete.id, {
      onSuccess: () => {
        setTagToDelete(null)
      },
    })
  }

  const handleEditClick = (tag: Tag) => {
    setSelectedTag(tag)
    setIsTagModalOpen(true)
  }

  const handleNewClick = () => {
    setSelectedTag(null)
    setIsTagModalOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Gerenciar Tags/Marcadores
            </DialogTitle>
            <DialogDescription>
              Crie e gerencie as tags que podem ser usadas para organizar seus clientes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Botão Nova Tag */}
            <Button onClick={handleNewClick} className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Tag
            </Button>

            {/* Lista de Tags */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TagIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhuma tag cadastrada</p>
                <p className="text-xs mt-1">Clique em "Nova Tag" para criar sua primeira tag</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-2">
                  {tags.length} {tags.length === 1 ? 'tag cadastrada' : 'tags cadastradas'}
                </p>
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getTagClasses(tag.cor)}>
                        {tag.nome}
                      </Badge>
                      {!tag.ativo && (
                        <span className="text-xs text-gray-500">(Inativa)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTagToDelete(tag)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criar/Editar Tag */}
      <TagModal
        open={isTagModalOpen}
        onOpenChange={setIsTagModalOpen}
        tag={selectedTag}
        onSubmit={selectedTag ? handleUpdateTag : handleCreateTag}
        isLoading={createTag.isPending || updateTag.isPending}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!tagToDelete} onOpenChange={() => setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a tag "{tagToDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTag.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
