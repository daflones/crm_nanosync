export interface EstabelecimentoGoogleMaps {
  place_id: string
  nome: string
  endereco: string
  telefone?: string
}

type LogCallback = (message: string) => void

class ProspeccaoService {
  private logCallback?: LogCallback

  // Definir callback para logs
  setLogCallback(callback: LogCallback) {
    this.logCallback = callback
  }

  private log(message: string) {
    console.log(message)
    if (this.logCallback) {
      this.logCallback(message)
    }
  }

  // Buscar estabelecimentos usando proxy CORS com paginação
  async buscarEstabelecimentos(
    tipoEstabelecimento: string, 
    cidade: string,
    pageToken?: string
  ): Promise<{ estabelecimentos: EstabelecimentoGoogleMaps[], nextPageToken?: string }> {
    try {
      this.log(`🔍 Buscando ${tipoEstabelecimento} em ${cidade}...`)
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        throw new Error('Google Maps API Key não configurada')
      }

      const query = `${tipoEstabelecimento} ${cidade}`
      
      // Usar proxy CORS público para contornar limitações
      const proxyUrl = 'https://api.allorigins.win/raw?url='
      let googleMapsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
      
      // Adicionar pagetoken se fornecido
      if (pageToken) {
        googleMapsUrl += `&pagetoken=${pageToken}`
        this.log('📄 Buscando próxima página de resultados...')
      }
      
      const finalUrl = proxyUrl + encodeURIComponent(googleMapsUrl)

      const response = await fetch(finalUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Maps API Error: ${data.status} - ${data.error_message || 'Erro desconhecido'}`)
      }

      if (!data.results || data.results.length === 0) {
        this.log('❌ Nenhum estabelecimento encontrado nesta região')
        return { estabelecimentos: [], nextPageToken: data.next_page_token }
      }

      this.log(`📍 ${data.results.length} estabelecimentos encontrados, processando...`)

      const estabelecimentos: EstabelecimentoGoogleMaps[] = []

      // Processar até 20 estabelecimentos
      for (let i = 0; i < Math.min(data.results.length, 20); i++) {
        const place = data.results[i]
        
        try {
          let telefone: string | undefined
          
          // Verificar se já tem telefone na resposta inicial
          if (place.formatted_phone_number) {
            telefone = place.formatted_phone_number
          } else {
            // Só buscar detalhes se não tiver telefone
            this.log(`📞 Buscando telefone de ${place.name}...`)
            
            // Delay entre requisições para evitar rate limiting
            if (i > 0) {
              await this.delay(1500) // 1.5 segundos entre requisições
            }
            
            const detalhes = await this.buscarDetalhesEstabelecimento(place.place_id)
            telefone = detalhes.telefone
          }
          
          estabelecimentos.push({
            place_id: place.place_id,
            nome: place.name,
            endereco: place.formatted_address,
            telefone: telefone
          })
          
        } catch (error) {
          console.error(`Erro ao processar estabelecimento ${place.name}:`, error)
          // Adicionar mesmo sem telefone
          estabelecimentos.push({
            place_id: place.place_id,
            nome: place.name,
            endereco: place.formatted_address,
            telefone: place.formatted_phone_number // Usar o que vier da busca inicial
          })
        }
      }

      this.log(`✅ ${estabelecimentos.length} estabelecimentos processados com sucesso`)
      return { 
        estabelecimentos, 
        nextPageToken: data.next_page_token 
      }

    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error)
      throw error
    }
  }

  // Função para delay entre requisições
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Buscar detalhes específicos de um estabelecimento com retry e rate limiting
  async buscarDetalhesEstabelecimento(placeId: string): Promise<{ telefone?: string }> {
    const maxRetries = 3
    const baseDelay = 1000 // 1 segundo
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        
        if (!apiKey) {
          return {}
        }

        // Delay progressivo entre tentativas
        if (attempt > 1) {
          const delayTime = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
          this.log(`🔄 Tentativa ${attempt} de buscar telefone (aguardando ${Math.round(delayTime/1000)}s)...`)
          await this.delay(delayTime)
        }

        // Tentar diferentes proxies CORS
        const proxies = [
          'https://api.allorigins.win/raw?url=',
          'https://cors-anywhere.herokuapp.com/',
          'https://api.codetabs.com/v1/proxy?quest='
        ]
        
        const proxyUrl = proxies[(attempt - 1) % proxies.length]
        const googleMapsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number&key=${apiKey}`
        const finalUrl = proxyUrl + encodeURIComponent(googleMapsUrl)

        const response = await fetch(finalUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`)
        }

        const data = await response.json()

        if (data.status !== 'OK') {
          return {}
        }

        if (data.result?.formatted_phone_number) {
          this.log(`✅ Telefone encontrado`)
        }
        return {
          telefone: data.result?.formatted_phone_number
        }

      } catch (error) {
        if (attempt === maxRetries) {
          this.log(`⚠️ Não foi possível obter telefone (${maxRetries} tentativas)`)
          return {}
        }
      }
    }
    
    return {}
  }
}

export const prospeccaoService = new ProspeccaoService()

// Export para uso externo
export const setProspeccaoLogCallback = (callback: LogCallback) => {
  prospeccaoService.setLogCallback(callback)
}
