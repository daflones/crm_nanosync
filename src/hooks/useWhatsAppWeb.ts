import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

// Interfaces baseadas na documentação do whatsapp-web.js
export interface WhatsAppContact {
  id: string
  name: string
  number: string
  displayNumber?: string
  isMyContact: boolean
  isGroup: boolean
  isBlocked: boolean
  profilePicUrl?: string
  pushname?: string
  verifiedName?: string
  isWAContact?: boolean
  isBusiness?: boolean
}

export interface WhatsAppChat {
  id: string
  name: string
  isGroup: boolean
  isReadOnly: boolean
  unreadCount: number
  timestamp: number
  lastMessage?: {
    body: string
    timestamp: number
    fromMe: boolean
    type?: string
    hasMedia?: boolean
  }
}

export interface WhatsAppMessage {
  id: string
  body: string
  from: string
  to: string
  fromMe: boolean
  timestamp: number
  type: string
  hasMedia: boolean
  ack: number
  author?: string
  mediaUrl?: string
  filename?: string
  filesize?: number
  mimetype?: string
  duration?: number
}

export interface WhatsAppWebState {
  isConnected: boolean
  isConnecting: boolean
  qrCode: string | null
  contacts: WhatsAppContact[]
  chats: WhatsAppChat[]
  messages: { [chatId: string]: WhatsAppMessage[] }
  isLoading: boolean
  error: string | null
}

export function useWhatsAppWeb() {
  const [state, setState] = useState<WhatsAppWebState>(() => {
    // Verificar se já foi conectado anteriormente
    const wasConnected = localStorage.getItem('whatsapp_was_connected') === 'true'
    return {
      isConnected: false,
      isConnecting: wasConnected, // Se já foi conectado, iniciar tentando conectar
      qrCode: null,
      contacts: [],
      chats: [],
      messages: {},
      isLoading: true,
      error: null
    }
  })

  const wsRef = useRef<WebSocket | null>(null)

  // Conectar ao servidor WhatsApp Web (backend)
  const connectToBackend = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // Determinar URL do WebSocket baseada no ambiente
      const getWebSocketUrl = () => {
        if (import.meta.env.VITE_WHATSAPP_WS_URL) {
          return import.meta.env.VITE_WHATSAPP_WS_URL
        }
        
        // Em produção, usar o mesmo host da aplicação
        if (window.location.protocol === 'https:') {
          return `wss://${window.location.host}/whatsapp-web`
        } else {
          return `ws://${window.location.host}/whatsapp-web`
        }
      }
      
      const wsUrl = getWebSocketUrl()
      console.log('Conectando ao WebSocket:', wsUrl)
      
      // Conectar ao WebSocket do backend
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Conectado ao servidor WhatsApp Web')
        setState(prev => ({ ...prev, isLoading: false, error: null }))
        
        // Solicitar status atual do WhatsApp
        ws.send(JSON.stringify({ type: 'get_status' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleBackendMessage(data)
        } catch (error) {
          console.error('Erro ao processar mensagem do backend:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('Desconectado do servidor WhatsApp Web', event.code, event.reason)
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false,
          qrCode: null 
        }))
        
        // Só reconectar se não foi um fechamento intencional
        if (event.code !== 1000) {
          setTimeout(connectToBackend, 3000)
        }
      }

      ws.onerror = (error) => {
        console.error('Erro na conexão WebSocket:', error)
        setState(prev => ({ 
          ...prev, 
          error: 'Erro na conexão com o servidor WhatsApp',
          isLoading: false 
        }))
      }

    } catch (error) {
      console.error('Erro ao conectar ao backend:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Não foi possível conectar ao servidor WhatsApp',
        isLoading: false 
      }))
    }
  }, [])

  // Processar mensagens do backend
  const handleBackendMessage = useCallback((data: any) => {
    console.log('Mensagem recebida do backend:', data.type, data)
    
    switch (data.type) {
      case 'qr':
        console.log('QR Code recebido')
        setState(prev => ({ 
          ...prev, 
          qrCode: data.qr,
          isConnecting: true,
          isConnected: false,
          error: null 
        }))
        break

      case 'ready':
        console.log('WhatsApp está pronto!')
        localStorage.setItem('whatsapp_was_connected', 'true')
        setState(prev => ({ 
          ...prev, 
          isConnected: true,
          isConnecting: false,
          qrCode: null,
          error: null,
          contacts: data.contacts || prev.contacts,
          chats: data.chats || prev.chats
        }))
        // Remover toast - muito frequente
        break

      case 'connecting':
        console.log('WhatsApp conectando...')
        setState(prev => ({ 
          ...prev, 
          isConnecting: true,
          isConnected: false,
          error: null 
        }))
        break

      case 'authenticated':
        toast.success('WhatsApp autenticado!')
        break

      case 'auth_failure':
        setState(prev => ({ 
          ...prev, 
          error: 'Falha na autenticação do WhatsApp',
          isConnecting: false,
          qrCode: null 
        }))
        toast.error('Falha na autenticação do WhatsApp')
        break

      case 'disconnected':
        console.log('WhatsApp desconectado:', data.reason)
        localStorage.removeItem('whatsapp_was_connected')
        setState(prev => ({ 
          ...prev, 
          isConnected: false,
          isConnecting: false,
          qrCode: null,
          contacts: [],
          chats: [],
          messages: {}
        }))
        toast.error('WhatsApp desconectado')
        break

      case 'contacts':
        setState(prev => ({ ...prev, contacts: data.contacts }))
        break

      case 'chats':
        setState(prev => ({ ...prev, chats: data.chats }))
        break

      case 'message':
        const message = data.message
        setState(prev => ({
          ...prev,
          messages: {
            ...prev.messages,
            [message.from]: [
              ...(prev.messages[message.from] || []),
              message
            ]
          }
        }))
        
        // Mostrar notificação para mensagens recebidas
        if (!message.fromMe) {
          toast.info(`Nova mensagem de ${message.from}`)
        }
        break

      case 'message_sent':
        console.log('Mensagem enviada confirmada:', data)
        console.log('Dados de confirmação:', {
          messageId: data.messageId,
          captionMessageId: data.captionMessageId,
          tempId: data.tempId,
          chatId: data.chatId
        })
        // Atualizar status da mensagem para enviada
        if (data.messageId) {
          setState(prev => {
            const newMessages = { ...prev.messages }
            Object.keys(newMessages).forEach(chatId => {
              newMessages[chatId] = newMessages[chatId].map(msg => {
                // Atualizar mensagem de mídia
                if (msg.id === data.tempId) {
                  console.log('✅ Atualizando mensagem de mídia:', {
                    oldId: msg.id,
                    newId: data.messageId,
                    oldAck: msg.ack,
                    newAck: 1
                  })
                  return { ...msg, ack: 1, id: data.messageId }
                }
                // Atualizar mensagem de legenda se existir
                if (data.captionMessageId && msg.id.startsWith('temp_caption_')) {
                  console.log('Atualizando mensagem de legenda:', {
                    oldId: msg.id,
                    newId: data.captionMessageId,
                    body: msg.body
                  })
                  return { ...msg, ack: 1, id: data.captionMessageId }
                }
                // Atualizar mensagem de texto normal
                if (msg.id.startsWith('temp_') && !msg.id.startsWith('temp_caption_')) {
                  console.log('✅ Atualizando mensagem de texto:', {
                    oldId: msg.id,
                    newId: data.messageId,
                    oldAck: msg.ack,
                    newAck: 1,
                    body: msg.body.substring(0, 50)
                  })
                  return { ...msg, ack: 1, id: data.messageId }
                }
                return msg
              })
            })
            return { ...prev, messages: newMessages }
          })
        }
        // Remover toast de mensagem enviada - muito frequente
        break

      case 'message_ack':
        // Atualizar status de entrega da mensagem
        const { id, ack } = data
        console.log('📨 Acknowledgment recebido:', { id, ack })
        
        setState(prev => {
          const newMessages = { ...prev.messages }
          let messageFound = false
          
          Object.keys(newMessages).forEach(chatId => {
            newMessages[chatId] = newMessages[chatId].map(msg => {
              if (msg.id === id) {
                messageFound = true
                console.log('✅ Mensagem encontrada para atualizar ack:', {
                  messageId: msg.id,
                  oldAck: msg.ack,
                  newAck: ack,
                  body: msg.body.substring(0, 50)
                })
                return { ...msg, ack }
              }
              return msg
            })
          })
          
          if (!messageFound) {
            console.log('❌ Mensagem não encontrada para ack:', id)
          }
          
          return { ...prev, messages: newMessages }
        })
        break

      case 'chat_messages':
        console.log('Mensagens do chat recebidas:', data.chatId, data.messages?.length)
        setState(prev => ({
          ...prev,
          messages: {
            ...prev.messages,
            [data.chatId]: data.messages || []
          }
        }))
        break

      case 'chat_read':
        console.log('Chat marcado como lido:', data.chatId)
        setState(prev => ({
          ...prev,
          chats: prev.chats.map(chat => 
            chat.id === data.chatId 
              ? { ...chat, unreadCount: 0 }
              : chat
          )
        }))
        break

      case 'error':
        console.error('Erro do backend:', data.message)
        setState(prev => ({ ...prev, error: data.message }))
        
        // Não mostrar toast para erros de mensagens (chats vazios são normais)
        if (!data.message.includes('Erro ao buscar mensagens')) {
          toast.error(data.message)
        }
        break

      default:
        console.log('Mensagem não reconhecida do backend:', data)
    }
  }, [])

  // Conectar WhatsApp
  const connectWhatsApp = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Enviando comando de conexão...')
      wsRef.current.send(JSON.stringify({ type: 'connect' }))
      setState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        isConnected: false,
        qrCode: null,
        error: null,
        contacts: [],
        chats: [],
        messages: {}
      }))
    } else {
      setState(prev => ({ ...prev, error: 'Não conectado ao servidor' }))
    }
  }, [])

  // Desconectar WhatsApp
  const disconnectWhatsApp = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Enviando comando de desconexão...')
      wsRef.current.send(JSON.stringify({ type: 'disconnect' }))
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        isConnected: false,
        qrCode: null,
        contacts: [],
        chats: [],
        messages: {}
      }))
    }
  }, [])

  // Enviar mensagem
  const sendMessage = useCallback((to: string, message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && state.isConnected) {
      wsRef.current.send(JSON.stringify({ 
        type: 'send_message', 
        to, 
        message 
      }))
      
      // Adicionar mensagem localmente
      const tempMessage: WhatsAppMessage = {
        id: `temp_${Date.now()}`,
        body: message,
        from: 'me',
        to,
        fromMe: true,
        timestamp: Date.now(),
        type: 'chat',
        hasMedia: false,
        ack: 0
      }

      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [to]: [
            ...(prev.messages[to] || []),
            tempMessage
          ]
        }
      }))

      // Remover toast de mensagem enviada - muito frequente
    } else {
      toast.error('WhatsApp não está conectado')
    }
  }, [state.isConnected])

  // Atualizar contatos
  const refreshContacts = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && state.isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'get_contacts' }))
    }
  }, [state.isConnected])

  // Atualizar conversas
  const refreshChats = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && state.isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'get_chats' }))
    }
  }, [state.isConnected])

  // Buscar mensagens de um chat
  const getChatMessages = useCallback((chatId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && state.isConnected) {
      console.log('Buscando mensagens para chat:', chatId)
      wsRef.current.send(JSON.stringify({ 
        type: 'get_messages', 
        chatId 
      }))
    }
  }, [state.isConnected])

  // Enviar mídia
  const sendMedia = useCallback((to: string, media: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && state.isConnected) {
      const tempId = `temp_${Date.now()}`
      const tempCaptionId = media.caption ? `temp_caption_${Date.now()}` : null
      
      wsRef.current.send(JSON.stringify({ 
        type: 'send_media', 
        to, 
        media,
        tempId
      }))
      
      // Adicionar mensagem de mídia localmente
      const tempMediaMessage: WhatsAppMessage = {
        id: tempId,
        body: '',
        from: 'me',
        to,
        fromMe: true,
        timestamp: Date.now(),
        type: media.mimetype?.startsWith('image/') ? 'image' : 
              media.mimetype?.startsWith('audio/') ? 'audio' :
              media.mimetype?.startsWith('video/') ? 'video' : 'document',
        hasMedia: true,
        ack: 0,
        mediaUrl: `data:${media.mimetype};base64,${media.data}`,
        filename: media.filename,
        filesize: media.filesize,
        mimetype: media.mimetype
      }

      const messagesToAdd = [tempMediaMessage]
      
      // Se há legenda, adicionar como mensagem de texto separada
      if (media.caption && media.caption.trim()) {
        console.log('Criando mensagem temporária de legenda:', {
          tempCaptionId,
          caption: media.caption.trim(),
          to
        })
        const tempCaptionMessage: WhatsAppMessage = {
          id: tempCaptionId!,
          body: media.caption.trim(),
          from: 'me',
          to,
          fromMe: true,
          timestamp: Date.now() + 1, // +1ms para garantir ordem
          type: 'chat',
          hasMedia: false,
          ack: 0
        }
        messagesToAdd.push(tempCaptionMessage)
        console.log('Mensagem de legenda adicionada à lista:', tempCaptionMessage)
      }

      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [to]: [
            ...(prev.messages[to] || []),
            ...messagesToAdd
          ]
        }
      }))

    } else {
      toast.error('WhatsApp não está conectado')
    }
  }, [state.isConnected])

  // Conectar ao backend quando o hook é montado
  useEffect(() => {
    let mounted = true
    if (mounted) {
      connectToBackend()
      
      // Se já foi conectado antes, tentar conectar automaticamente
      const wasConnected = localStorage.getItem('whatsapp_was_connected') === 'true'
      if (wasConnected) {
        console.log('Tentando reconexão automática...')
        setTimeout(() => {
          if (mounted && wsRef.current?.readyState === WebSocket.OPEN) {
            connectWhatsApp()
          }
        }, 1000) // Aguardar 1 segundo para o WebSocket conectar
      }
    }
    return () => {
      mounted = false
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted')
      }
    }
  }, [connectToBackend, connectWhatsApp])

  // Listener para reconexão quando a aba se torna visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && localStorage.getItem('whatsapp_was_connected') === 'true') {
        // Se a aba se tornou visível e já foi conectado antes
        if (!state.isConnected && !state.isConnecting) {
          console.log('Aba visível - tentando reconectar automaticamente...')
          setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              connectWhatsApp()
            }
          }, 500)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [state.isConnected, state.isConnecting, connectWhatsApp])

  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    qrCode: state.qrCode,
    contacts: state.contacts,
    chats: state.chats,
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    connectWhatsApp,
    disconnectWhatsApp,
    sendMessage,
    sendMedia,
    refreshContacts,
    refreshChats,
    getChatMessages,
    wsRef
  }
}
