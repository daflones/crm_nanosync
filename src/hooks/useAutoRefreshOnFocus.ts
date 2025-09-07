import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useAutoRefreshOnFocus() {
  const queryClient = useQueryClient()
  const wasHiddenRef = useRef(false)

  useEffect(() => {
    console.log('useAutoRefreshOnFocus: Hook inicializado')
    
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
        console.log('Usuário voltou para a aba - iniciando refresh')
        wasHiddenRef.current = false
        
        // Fazer refresh imediato e forçar reload da página
        console.log('Forçando reload completo da página...')
        window.location.reload()
        
        console.log('Reload da página executado')
      } else {
        console.log('Aba ficou visível mas não estava hidden antes - sem ação')
      }
    }

    // Adicionar listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queryClient])

  return {
    isVisible: !document.hidden,
    wasHidden: wasHiddenRef.current
  }
}
