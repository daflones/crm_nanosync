import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useAutoRefreshOnFocus() {
  const queryClient = useQueryClient()
  const wasHiddenRef = useRef(false)

  useEffect(() => {
    console.log('useAutoRefreshOnFocus: Hook inicializado')
    
    const handleVisibilityChange = () => {
      // Desativar autorefresh na página de planos para evitar erros
      if (window.location.pathname.includes('/planos')) {
        console.log('AutoRefresh desativado na página Planos')
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
