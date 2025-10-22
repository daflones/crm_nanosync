import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  MessageSquare, 
  Users, 
  Clock,
  Check,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  RefreshCw,
  Paperclip,
  FileText,
  Mic,
  Play,
  Pause,
  Download
} from 'lucide-react'
import type { WhatsAppChat, WhatsAppMessage } from '@/hooks/useWhatsAppWeb'
import { ImageEditorModal } from './ImageEditorModal'

interface ChatInterfaceProps {
  chats: WhatsAppChat[]
  messages: { [chatId: string]: WhatsAppMessage[] }
  onSendMessage: (to: string, message: string) => void
  onSendMedia?: (to: string, media: any) => void
  onGetChatMessages: (chatId: string) => void
  isConnected: boolean
}

export function ChatInterface({ chats, messages, onSendMessage, onSendMedia, onGetChatMessages, isConnected }: ChatInterfaceProps) {
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null)
  const [messageText, setMessageText] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioPlayers, setAudioPlayers] = useState<{[key: string]: HTMLAudioElement}>({})
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [imageModal, setImageModal] = useState<{isOpen: boolean, src: string, alt: string}>({
    isOpen: false,
    src: '',
    alt: ''
  })
  const [imageEditorModal, setImageEditorModal] = useState<{isOpen: boolean, file: File | null}>({
    isOpen: false,
    file: null
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto scroll para última mensagem
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100) // Pequeno delay para garantir que as mensagens foram renderizadas
  }

  useEffect(() => {
    if (selectedChat && messages[selectedChat.id]) {
      scrollToBottom()
    }
  }, [messages, selectedChat])

  // Parar loading quando mensagens chegarem
  useEffect(() => {
    if (selectedChat && messages[selectedChat.id]) {
      setLoadingMessages(false)
    }
  }, [messages, selectedChat])

  const handleSendMessage = () => {
    if (!selectedChat || !messageText.trim() || !isConnected) return

    onSendMessage(selectedChat.id, messageText.trim())
    setMessageText('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageAckIcon = (ack: number) => {
    switch (ack) {
      case 0:
        // Enviando (relógio)
        return <Clock className="w-3 h-3 text-gray-400" />
      case 1:
        // Enviado mas não entregue (um check cinza)
        return <Check className="w-3 h-3 text-gray-400" />
      case 2:
        // Entregue (dois checks cinzas)
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 3:
        // Lido (dois checks azuis/verdes)
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      default:
        return null
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderMessageContent = (message: WhatsAppMessage) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <img 
                src={message.mediaUrl} 
                alt="Imagem" 
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setImageModal({
                  isOpen: true,
                  src: message.mediaUrl!,
                  alt: message.filename || 'Imagem'
                })}
              />
            )}
            {message.body && <p className="text-sm">{message.body}</p>}
          </div>
        )
      
      case 'video':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <video 
                controls 
                className="max-w-xs rounded-lg"
                preload="metadata"
              >
                <source src={message.mediaUrl} type="video/mp4" />
                Seu navegador não suporta vídeos.
              </video>
            )}
            {message.body && <p className="text-sm">{message.body}</p>}
          </div>
        )
      
      case 'audio':
      case 'ptt':
        return (
          <div className="flex items-center gap-2 bg-black/10 rounded-lg p-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1"
              onClick={() => toggleAudio(message.id, message.mediaUrl!)}
            >
              {playingAudio === message.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="flex-1 h-1 bg-gray-300 rounded-full">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <span className="text-xs text-gray-500">{message.duration ? formatDuration(message.duration) : '0:00'}</span>
            {message.mediaUrl && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1"
                onClick={() => downloadMedia(message.mediaUrl!, message.filename || 'audio')}
              >
                <Download className="w-3 h-3" />
              </Button>
            )}
          </div>
        )
      
      case 'document':
        return (
          <div className="flex items-center gap-3 bg-black/10 rounded-lg p-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="flex-1">
              <p className="font-medium text-sm">{message.filename || 'Documento'}</p>
              {message.filesize && (
                <p className="text-xs text-gray-500">{formatFileSize(message.filesize)}</p>
              )}
            </div>
            {message.mediaUrl && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => downloadMedia(message.mediaUrl!, message.filename || 'document')}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        )
      
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.body}</p>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleAudio = (messageId: string, mediaUrl: string) => {
    if (playingAudio === messageId) {
      // Pausar áudio atual
      const audio = audioPlayers[messageId]
      if (audio) {
        audio.pause()
        setPlayingAudio(null)
      }
    } else {
      // Pausar qualquer áudio tocando
      Object.values(audioPlayers).forEach(audio => {
        if (!audio.paused) {
          audio.pause()
        }
      })
      setPlayingAudio(null)
      
      // Tocar novo áudio
      let audio = audioPlayers[messageId]
      if (!audio) {
        audio = new Audio(mediaUrl)
        audio.onended = () => setPlayingAudio(null)
        audio.onerror = (e) => {
          console.error('Erro ao reproduzir áudio:', e)
          setPlayingAudio(null)
        }
        setAudioPlayers(prev => ({ ...prev, [messageId]: audio }))
      }
      
      audio.play().catch(error => {
        console.error('Erro ao iniciar reprodução:', error)
        setPlayingAudio(null)
      })
      setPlayingAudio(messageId)
    }
  }

  const downloadMedia = (mediaUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = mediaUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      // Verificar formatos suportados (priorizando formatos mais compatíveis)
      const options = [
        { mimeType: 'audio/mp4' },
        { mimeType: 'audio/wav' },
        { mimeType: 'audio/webm;codecs=opus' },
        { mimeType: 'audio/webm' }
      ]
      
      let selectedOptions = options.find(option => MediaRecorder.isTypeSupported(option.mimeType))
      if (!selectedOptions) {
        selectedOptions = { mimeType: 'audio/webm' }
      }
      
      const recorder = new MediaRecorder(stream, selectedOptions)
      const chunks: BlobPart[] = []
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedOptions.mimeType })
        const filename = `audio_${Date.now()}.${selectedOptions.mimeType.includes('webm') ? 'webm' : 'wav'}`
        const file = new File([blob], filename, { type: selectedOptions.mimeType })
        handleFileUpload([file])
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.onerror = (e) => {
        console.error('Erro na gravação:', e)
        setIsRecording(false)
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start(1000) // Capturar dados a cada segundo
      setMediaRecorder(recorder)
      setIsRecording(true)
      
      console.log('Gravação iniciada com formato:', selectedOptions.mimeType)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      alert('Erro ao acessar o microfone. Verifique as permissões.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!selectedChat) {
      console.error('Nenhum chat selecionado')
      return
    }
    
    if (!onSendMedia) {
      console.error('Função onSendMedia não disponível')
      return
    }
    
    const fileArray = Array.from(files)
    console.log('Processando arquivos:', fileArray.map(f => ({ name: f.name, type: f.type, size: f.size })))
    
    for (const file of fileArray) {
      // Se for uma imagem, abrir o modal de edição
      if (file.type.startsWith('image/')) {
        setImageEditorModal({ isOpen: true, file })
        return // Processar apenas uma imagem por vez
      }
      
      // Para outros tipos de arquivo, enviar diretamente
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        if (base64) {
          const mediaData = {
            data: base64.split(',')[1], // Remove data:type;base64,
            mimetype: file.type,
            filename: file.name,
            filesize: file.size
          }
          
          console.log('Enviando mídia:', {
            chatId: selectedChat.id,
            filename: file.name,
            mimetype: file.type,
            filesize: file.size
          })
          
          onSendMedia(selectedChat.id, mediaData)
        }
      }
      
      reader.onerror = (error) => {
        console.error('Erro ao ler arquivo:', error)
      }
      
      reader.readAsDataURL(file)
    }
  }

  const handleSendEditedImage = (imageData: string, caption: string) => {
    if (!selectedChat || !onSendMedia) return
    
    // Converter data URL para base64
    const base64Data = imageData.split(',')[1]
    
    const mediaData = {
      data: base64Data,
      mimetype: 'image/jpeg',
      filename: `edited_image_${Date.now()}.jpg`,
      filesize: Math.round(base64Data.length * 0.75), // Estimativa do tamanho
      caption: caption || undefined
    }
    
    console.log('Enviando imagem editada:', {
      chatId: selectedChat.id,
      hasCaption: !!caption,
      caption: caption,
      captionLength: caption ? caption.length : 0,
      filename: mediaData.filename,
      mediaData: mediaData
    })
    
    onSendMedia(selectedChat.id, mediaData)
  }

  const getLastMessagePreview = (chat: WhatsAppChat) => {
    const chatMessages = messages[chat.id] || []
    const lastMessage = chatMessages[chatMessages.length - 1]
    
    // Usar mensagem local se disponível, senão usar lastMessage do chat
    const messageToCheck = lastMessage || chat.lastMessage
    
    if (!messageToCheck) {
      return 'Nenhuma mensagem'
    }

    // Se a mensagem tem mídia, mostrar indicador do tipo
    if (messageToCheck.hasMedia || (messageToCheck.type && messageToCheck.type !== 'chat')) {
      switch (messageToCheck.type) {
        case 'image':
          return '📷 Imagem'
        case 'audio':
        case 'ptt':
          return '🎵 Áudio'
        case 'video':
          return '🎥 Vídeo'
        case 'document':
          return '📄 Documento'
        case 'sticker':
          return '🎭 Figurinha'
        default:
          if (messageToCheck.hasMedia) {
            return '📎 Mídia'
          }
      }
    }

    // Para mensagens de texto, mostrar o conteúdo
    const messageText = messageToCheck.body || ''
    return messageText.length > 50 
      ? messageText.substring(0, 50) + '...'
      : messageText || 'Mensagem'
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">WhatsApp não conectado</h3>
            <p className="text-muted-foreground">
              Conecte-se ao WhatsApp Web para acessar suas conversas
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
      {/* Lista de Conversas */}
      <Card className="lg:col-span-1 border-0 shadow-lg bg-gradient-to-b from-white to-slate-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Conversas</h3>
              <p className="text-sm text-slate-500 font-normal">{chats.length} conversas ativas</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhuma conversa encontrada
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`mx-2 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedChat?.id === chat.id 
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 shadow-sm' 
                        : 'hover:bg-slate-50 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      console.log('Chat selecionado:', chat)
                      if (chat && chat.id) {
                        setSelectedChat(chat)
                        setLoadingMessages(true)
                        onGetChatMessages(chat.id)
                        // Marcar como lido imediatamente na UI
                        chat.unreadCount = 0
                        // Reset loading após 3 segundos (timeout)
                        setTimeout(() => setLoadingMessages(false), 3000)
                      } else {
                        console.error('Chat inválido:', chat)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm ${
                        chat.isGroup 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}>
                        {chat.isGroup ? (
                          <Users className="w-5 h-5" />
                        ) : (
                          chat.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{chat.name || 'Contato sem nome'}</h4>
                          {chat.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(chat.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {getLastMessagePreview(chat)}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          {chat.isGroup && (
                            <Badge className="bg-indigo-100 text-indigo-700 text-xs border-0">
                              Grupo
                            </Badge>
                          )}
                          {chat.unreadCount > 0 && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs border-0 shadow-sm">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Área de Chat */}
      <Card className="lg:col-span-2 border-0 shadow-lg bg-gradient-to-b from-white to-slate-50">
        {selectedChat ? (
          <>
            {/* Header do Chat */}
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold shadow-md ${
                    selectedChat.isGroup 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    {selectedChat.isGroup ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      selectedChat.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">{selectedChat.name || 'Contato sem nome'}</h3>
                    <p className="text-sm text-purple-600 font-medium">
                      {selectedChat.isGroup ? '👥 Grupo' : '👤 Contato'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled
                    title="Chamadas não disponíveis"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled
                    title="Videochamadas não disponíveis"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <Separator />

            {/* Mensagens */}
            <CardContent className="p-0">
              <ScrollArea className="h-[450px] p-4 bg-gradient-to-b from-slate-50/50 to-white">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                      <span className="text-slate-600 font-medium">Carregando mensagens...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(messages[selectedChat.id] || []).map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.fromMe
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                      >
                        {!message.fromMe && selectedChat.isGroup && message.author && (
                          <p className="text-xs font-semibold mb-1 text-green-600">
                            {message.author}
                          </p>
                        )}
                        {renderMessageContent(message)}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          message.fromMe ? 'text-green-100' : 'text-muted-foreground'
                        }`}>
                          <span className="text-xs">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.fromMe && getMessageAckIcon(message.ack)}
                        </div>
                      </div>
                    </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input de Mensagem */}
              <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 hover:bg-purple-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 hover:bg-purple-50"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files && files.length > 0) {
                        handleFileUpload(files)
                      }
                    }}
                  />
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border-slate-200 focus:border-purple-300 focus:ring-purple-200 rounded-xl"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || !isConnected}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-xl px-4 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-800">Selecione uma conversa</h3>
              <p className="text-slate-500 max-w-sm">
                Escolha uma conversa da lista ao lado para começar a enviar mensagens
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Modal de edição de imagem */}
      <ImageEditorModal
        isOpen={imageEditorModal.isOpen}
        onClose={() => setImageEditorModal({ isOpen: false, file: null })}
        onSend={handleSendEditedImage}
        imageFile={imageEditorModal.file}
      />

      {/* Modal de visualização de imagem */}
      {imageModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setImageModal({ isOpen: false, src: '', alt: '' })}
        >
          <div className="relative max-w-full max-h-full p-4">
            <img 
              src={imageModal.src} 
              alt={imageModal.alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-60 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 transition-all text-xl font-bold"
              onClick={() => setImageModal({ isOpen: false, src: '', alt: '' })}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
