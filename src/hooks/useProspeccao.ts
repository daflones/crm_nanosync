import { useState } from 'react'
import { toast } from 'sonner'
import { useWhatsAppInstance } from './useWhatsApp'
import { prospeccaoService } from '../services/api/prospeccao'

// Interfaces
interface EstabelecimentoGoogleMaps {
  place_id: string
  nome: string
  endereco: string
  telefone?: string
}

interface ValidacaoWhatsApp {
  isWhatsApp: boolean
  jid?: string
  number?: string
}

interface DisparoProspeccao {
  id: string
  telefone: string
  jid: string
  mensagem: string
  data_envio: Date
  estabelecimento_nome: string
  status: 'enviado' | 'erro'
}

// Configurações das APIs
const EVOLUTION_API_BASE_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolutionapi.agenciagvcompany.com.br/'
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '3fkUb5AJcvYfXa3eduZLFAhlbkwM6pYB'

export const useProspeccao = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { data: whatsappInstance } = useWhatsAppInstance()

  // Buscar estabelecimentos no Google Maps
  const buscarEstabelecimentos = async (
    tipoEstabelecimento: string, 
    cidade: string
  ): Promise<EstabelecimentoGoogleMaps[]> => {
    setIsLoading(true)
    
    try {
      const estabelecimentos = await prospeccaoService.buscarEstabelecimentos(tipoEstabelecimento, cidade)
      return estabelecimentos

    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error)
      toast.error('Erro ao buscar estabelecimentos no Google Maps')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Validar se um número é WhatsApp usando Evolution API
  const validarWhatsApp = async (telefone: string): Promise<ValidacaoWhatsApp> => {
    try {
      // Verificar se existe instância WhatsApp configurada
      if (!whatsappInstance?.instanceName) {
        throw new Error('Nenhuma instância WhatsApp configurada. Configure na aba WhatsApp primeiro.')
      }

      // Limpar e formatar o número
      const numeroLimpo = telefone.replace(/\D/g, '')
      
      // Se não começar com código do país, assumir Brasil (+55)
      const numeroFormatado = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`

      // URL correta conforme documentação: /chat/whatsappNumbers/{instance}
      const url = `${EVOLUTION_API_BASE_URL}chat/whatsappNumbers/${whatsappInstance.instanceName}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          numbers: [numeroFormatado]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Evolution API Error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      // Verificar se o número é WhatsApp válido
      // Resposta esperada: [{ "exists": true, "jid": "553198296801@s.whatsapp.net", "number": "553198296801" }]
      if (data && Array.isArray(data) && data.length > 0) {
        const resultado = data[0]
        return {
          isWhatsApp: resultado.exists === true,
          jid: resultado.jid,
          number: resultado.number
        }
      }

      return { isWhatsApp: false }

    } catch (error) {
      console.error('Erro ao validar WhatsApp:', error)
      return { isWhatsApp: false }
    }
  }

  // Enviar mensagem via Evolution API
  const enviarMensagem = async (numeroOuJid: string, mensagem: string): Promise<void> => {
    try {
      // Verificar se existe instância WhatsApp configurada
      if (!whatsappInstance?.instanceName) {
        throw new Error('Nenhuma instância WhatsApp configurada. Configure na aba WhatsApp primeiro.')
      }

      // URL correta conforme documentação: /message/sendText/{instance}
      const url = `${EVOLUTION_API_BASE_URL}message/sendText/${whatsappInstance.instanceName}`
      
      // Extrair apenas o número do JID se necessário
      // JID formato: "553198296801@s.whatsapp.net" -> número: "553198296801"
      const numero = numeroOuJid.includes('@') ? numeroOuJid.split('@')[0] : numeroOuJid
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: numero,
          text: mensagem
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Evolution API Error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      // Resposta esperada: { "key": { "remoteJid": "553198296801@s.whatsapp.net", "fromMe": true, "id": "BAE594145F4C59B4" }, ... }
      if (!data.key || !data.key.id) {
        throw new Error('Falha ao enviar mensagem - resposta inválida')
      }

      // Salvar disparo no localStorage para controle diário
      await salvarDisparoProspeccao({
        id: data.key.id,
        telefone: numero,
        jid: numeroOuJid,
        mensagem: mensagem,
        data_envio: new Date(),
        estabelecimento_nome: '', // Será preenchido pela função chamadora
        status: 'enviado'
      })

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      throw error
    }
  }

  // Salvar disparo no localStorage
  const salvarDisparoProspeccao = async (disparo: DisparoProspeccao): Promise<void> => {
    try {
      const hoje = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const chave = `disparos_prospeccao_${hoje}`
      
      const disparosExistentes = JSON.parse(localStorage.getItem(chave) || '[]')
      disparosExistentes.push(disparo)
      
      localStorage.setItem(chave, JSON.stringify(disparosExistentes))
    } catch (error) {
      console.error('Erro ao salvar disparo:', error)
    }
  }

  // Obter quantidade de disparos do dia atual
  const obterDisparosHoje = async (): Promise<number> => {
    try {
      const hoje = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const chave = `disparos_prospeccao_${hoje}`
      
      const disparos = JSON.parse(localStorage.getItem(chave) || '[]')
      return disparos.length
    } catch (error) {
      console.error('Erro ao obter disparos:', error)
      return 0
    }
  }

  // Limpar disparos antigos (executar diariamente)
  const limparDisparosAntigos = async (): Promise<void> => {
    try {
      const hoje = new Date()
      const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      // Remover disparos com mais de 7 dias
      for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i)
        if (chave && chave.startsWith('disparos_prospeccao_')) {
          const dataString = chave.replace('disparos_prospeccao_', '')
          const dataDisparo = new Date(dataString)
          
          if (dataDisparo < seteDiasAtras) {
            localStorage.removeItem(chave)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao limpar disparos antigos:', error)
    }
  }

  // Obter histórico de disparos
  const obterHistoricoDisparos = async (dias: number = 7): Promise<DisparoProspeccao[]> => {
    try {
      const disparos: DisparoProspeccao[] = []
      const hoje = new Date()
      
      for (let i = 0; i < dias; i++) {
        const data = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000)
        const dataString = data.toISOString().split('T')[0]
        const chave = `disparos_prospeccao_${dataString}`
        
        const disparosDia = JSON.parse(localStorage.getItem(chave) || '[]')
        disparos.push(...disparosDia)
      }
      
      return disparos.sort((a, b) => new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime())
    } catch (error) {
      console.error('Erro ao obter histórico:', error)
      return []
    }
  }

  return {
    buscarEstabelecimentos,
    validarWhatsApp,
    enviarMensagem,
    obterDisparosHoje,
    limparDisparosAntigos,
    obterHistoricoDisparos,
    isLoading
  }
}
