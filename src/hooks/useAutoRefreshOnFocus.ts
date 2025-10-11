import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function useAutoRefreshOnFocus() {
  const wasHiddenRef = useRef(false)
  const refreshUser = useAuthStore(state => state.refreshUser)

  useEffect(() => {
    // Função para atualizar dados do usuário quando voltar para a aba
    const refreshUserData = async () => {
      try {
        await refreshUser()
      } catch (error) {
        console.error('Erro ao atualizar dados do usuário:', error)
      }
    }
    
    const handleVisibilityChange = () => {
      // Páginas onde o autorefresh deve ser desativado
      const disableRefreshPaths = [
        '/planos',
        '/app/configuracoes-ia',
        '/app/whatsapp'
      ]
      
      // Verificar se está em alguma página que deve desabilitar o refresh
      const shouldDisableRefresh = disableRefreshPaths.some(path => 
        window.location.pathname.includes(path)
      )
      
      if (shouldDisableRefresh) {
        return
      }
      
      // Verificar se há modais abertos (elementos com data-state="open")
      const hasOpenModal = document.querySelector('[data-state="open"]') !== null
      
      if (hasOpenModal) {
        return
      }
      
      if (document.hidden) {
        // Aba foi minimizada ou trocada
        wasHiddenRef.current = true
      } else if (wasHiddenRef.current) {
        // Usuário voltou para a aba após ter saído
        wasHiddenRef.current = false
        
        // Atualizar dados do usuário
        refreshUserData()
      }
    }

    // Adicionar listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange, true)
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange, true)
    }
  }, [refreshUser])

  return {
    isVisible: !document.hidden,
    wasHidden: wasHiddenRef.current
  }
}
