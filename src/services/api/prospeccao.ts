import { supabase } from '@/lib/supabase'

export interface EstabelecimentoGoogleMaps {
  place_id: string
  nome: string
  endereco: string
  telefone?: string
}

class ProspeccaoService {
  // Buscar estabelecimentos usando Supabase Edge Function como proxy
  async buscarEstabelecimentos(
    tipoEstabelecimento: string, 
    cidade: string
  ): Promise<EstabelecimentoGoogleMaps[]> {
    try {
      console.log('Iniciando busca de estabelecimentos:', { tipoEstabelecimento, cidade })
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      console.log('API Key disponível:', !!apiKey)
      
      // Usar Supabase Edge Function como proxy para evitar CORS
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          action: 'search',
          query: `${tipoEstabelecimento} ${cidade}`,
          key: apiKey
        }
      })

      console.log('Resposta do Supabase Functions:', { data, error })

      if (error) {
        console.error('Erro do Supabase Functions:', error)
        throw new Error(`Erro no proxy: ${error.message}`)
      }

      if (!data || !data.results) {
        throw new Error('Resposta inválida da API')
      }

      const estabelecimentos: EstabelecimentoGoogleMaps[] = []

      // Processar até 20 estabelecimentos
      for (const place of data.results.slice(0, 20)) {
        try {
          // Buscar detalhes do estabelecimento
          const detalhes = await this.buscarDetalhesEstabelecimento(place.place_id)
          
          estabelecimentos.push({
            place_id: place.place_id,
            nome: place.name,
            endereco: place.formatted_address,
            telefone: detalhes.telefone
          })
        } catch (error) {
          console.error(`Erro ao buscar detalhes do estabelecimento ${place.name}:`, error)
          // Adicionar mesmo sem telefone
          estabelecimentos.push({
            place_id: place.place_id,
            nome: place.name,
            endereco: place.formatted_address
          })
        }
      }

      return estabelecimentos

    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error)
      throw error
    }
  }

  // Buscar detalhes específicos de um estabelecimento
  async buscarDetalhesEstabelecimento(placeId: string): Promise<{ telefone?: string }> {
    try {
      // Usar Supabase Edge Function como proxy
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          action: 'details',
          place_id: placeId,
          fields: 'name,formatted_phone_number',
          key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        }
      })

      if (error) {
        throw new Error(`Erro no proxy: ${error.message}`)
      }

      return {
        telefone: data?.result?.formatted_phone_number
      }

    } catch (error) {
      console.error('Erro ao buscar detalhes do estabelecimento:', error)
      return {}
    }
  }
}

export const prospeccaoService = new ProspeccaoService()
