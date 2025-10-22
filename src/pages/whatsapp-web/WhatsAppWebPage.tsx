import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  QrCode, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Smartphone, 
  MessageSquare, 
  Users, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { useWhatsAppWeb } from '@/hooks/useWhatsAppWeb'
import { QRCodeWebDisplay } from '@/components/whatsapp-web/QRCodeWebDisplay'
import { ChatInterface } from '@/components/whatsapp-web/ChatInterface'
import { ContactsList } from '@/components/whatsapp-web/ContactsList'

export default function WhatsAppWebPage() {
  const {
    isConnected,
    isConnecting,
    qrCode,
    contacts,
    chats,
    messages,
    isLoading,
    error,
    connectWhatsApp,
    disconnectWhatsApp,
    sendMessage,
    sendMedia,
    refreshContacts,
    refreshChats,
    getChatMessages
  } = useWhatsAppWeb()

  const [activeTab, setActiveTab] = useState('status')

  const getStatusBadge = () => {
    if (isConnected) {
      return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>
    } else if (isConnecting) {
      return <Badge className="bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3 mr-1" />Conectando</Badge>
    } else {
      return <Badge className="bg-slate-50 text-slate-600 border border-slate-200"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>
    }
  }

  // Não mudar automaticamente de aba - deixar o usuário escolher

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Phone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            WhatsApp Web
          </h1>
          <p className="text-slate-600">Interface completa do WhatsApp integrada ao CRM</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger 
            value="status" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Smartphone className="w-4 h-4" />
            Status
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            disabled={!isConnected} 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg transition-all disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger 
            value="contacts" 
            disabled={!isConnected} 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg transition-all disabled:opacity-50"
          >
            <Users className="w-4 h-4" />
            Contatos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Status da Conexão</h3>
                    <p className="text-sm text-slate-500 font-normal">Gerencie sua conexão com o WhatsApp Web</p>
                  </div>
                </span>
                {getStatusBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isConnected && !isConnecting && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
                    <QrCode className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-800">WhatsApp Web Desconectado</h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    Conecte-se ao WhatsApp Web para começar a usar todas as funcionalidades
                  </p>
                  <Button 
                    onClick={connectWhatsApp}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg px-8"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Conectar WhatsApp
                  </Button>
                  <p className="text-sm text-slate-500 mt-3">
                    Clique para gerar um novo QR Code
                  </p>
                </div>
              )}

              {isConnecting && (
                <div className="space-y-6">
                  {qrCode ? (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-6 h-6 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2 text-slate-800">Escaneie o QR Code</h4>
                      <p className="text-slate-600 mb-4">Use seu celular para escanear o código abaixo</p>
                      <QRCodeWebDisplay qrCode={qrCode} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                        <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2 text-slate-800">Conectando...</h4>
                      <p className="text-slate-600">Aguarde enquanto geramos o QR Code</p>
                    </div>
                  )}
                </div>
              )}

              {isConnected && (
                <div className="space-y-6">
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 p-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-emerald-900">WhatsApp Conectado</h4>
                        <p className="text-emerald-700">Pronto para enviar e receber mensagens</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="group p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Contatos</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {contacts?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="group p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-indigo-600 font-medium">Conversas</p>
                          <p className="text-2xl font-bold text-indigo-900">
                            {chats?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={refreshContacts}
                      size="sm"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar Contatos
                    </Button>
                    <Button
                      variant="outline"
                      onClick={refreshChats}
                      size="sm"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar Conversas
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
                          disconnectWhatsApp()
                          setActiveTab('status')
                        }
                      }}
                      size="sm"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <ChatInterface 
            chats={chats}
            messages={messages}
            onSendMessage={sendMessage}
            onSendMedia={sendMedia}
            onGetChatMessages={getChatMessages}
            isConnected={isConnected}
          />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <ContactsList 
            contacts={contacts}
            onSendMessage={sendMessage}
            onRefresh={refreshContacts}
          />
        </TabsContent>

      </Tabs>

      {/* Informações importantes */}
      <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>
        <AlertDescription className="text-slate-700">
          <strong className="text-purple-700">Importante:</strong> Esta é uma conexão direta com o WhatsApp Web. 
          Mantenha esta aba aberta para receber mensagens em tempo real. 
          Não use o WhatsApp Web em outro navegador simultaneamente.
        </AlertDescription>
      </Alert>
    </div>
  )
}
