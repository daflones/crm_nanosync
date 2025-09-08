import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function useAutoRefreshOnFocus() {
  const wasHiddenRef = useRef(false)
  const refreshUser = useAuthStore(state => state.refreshUser)

  useEffect(() => {
    console.log('useAutoRefreshOnFocus: Hook inicializado')
    
    // Função para atualizar dados do usuário quando voltar para a aba
    const refreshUserData = async () => {
      try {
        console.log('Refreshing user data after tab focus...')
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
        console.log('AutoRefresh desativado na página:', window.location.pathname)
        return
      }
      
      // Verificar se há modais abertos (elementos com data-state="open")
      const hasOpenModal = document.querySelector('[data-state="open"]') !== null
      
      if (hasOpenModal) {
        console.log('AutoRefresh desativado - modal aberto detectado')
        return
      }
      
      console.log('Visibility change detectado:', {
        hidden: document.hidden,
        wasHidden: wasHiddenRef.current
      })
      
      if (document.hidden) {
        // Aba foi minimizada ou trocada
        console.log('Aba foi escondida - marcando como hidden')
        wasHiddenRef.current = true
      } else if (wasHiddenRef.current) {
        // Usuário voltou para a aba após ter saído
        console.log('Usuário voltou para a aba - validando sessão')
        wasHiddenRef.current = false
        
        // Atualizar dados do usuário
        refreshUserData()
        
        console.log('Validação de sessão executada')
      } else {
        console.log('Aba ficou visível mas não estava hidden antes - sem ação')
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
