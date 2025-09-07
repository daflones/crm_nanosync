import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageCircle, 
  QrCode, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { 
  useWhatsAppInstance, 
  useCreateWhatsAppInstance, 
  useWhatsAppStatus,
  useWhatsAppQRCode,
  useDeleteWhatsAppInstance
} from '@/hooks/useWhatsApp'
import { QRCodeDisplay } from '@/components/whatsapp/QRCodeDisplay'

export default function WhatsAppPage() {
  const [instanceName, setInstanceName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data: instance, isLoading: instanceLoading } = useWhatsAppInstance()
  
  // Determinar se deve fazer polling baseado no status da instância
  const shouldPoll = Boolean(instance?.instanceName && (!instance.status || instance.status !== 'open'))
  
  const { data: status, isLoading: statusLoading } = useWhatsAppStatus(instance?.instanceName || undefined, shouldPoll)
  const { data: qrCode, isLoading: qrLoading } = useWhatsAppQRCode(instance?.instanceName || undefined, status?.status)
  
  const createInstance = useCreateWhatsAppInstance()
  const deleteInstance = useDeleteWhatsAppInstance()

  const handleCreateInstance = async () => {
    if (!instanceName.trim() || !phoneNumber.trim()) return
    
    try {
      await createInstance.mutateAsync({ 
        instanceName: instanceName.trim(), 
        number: phoneNumber.trim() 
      })
      setInstanceName('')
      setPhoneNumber('')
      setShowCreateForm(false)
    } catch (error) {
      // Error handled by hook
    }
  }


  const handleDelete = async () => {
    if (!instance?.instanceName) return
    if (!confirm('Tem certeza que deseja remover completamente esta instância? Esta ação não pode ser desfeita.')) return
    
    try {
      await deleteInstance.mutateAsync(instance.instanceName)
      // Forçar reset do estado local após delete bem-sucedido
      setShowCreateForm(false)
      setInstanceName('')
      setPhoneNumber('')
    } catch (error) {
      // Error handled by hook
    }
  }

  const getStatusBadge = (currentStatus?: string) => {
    switch (currentStatus) {
      case 'open':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Conectando</Badge>
      case 'close':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>
      default:
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Verificando...</Badge>
    }
  }

  const shouldShowQRCode = instance?.instanceName && (status?.status === 'connecting' || status?.status === 'close' || !status?.status)
  
  // Debug logs (removido para reduzir spam no console)
  // console.log('Debug WhatsApp Page:', {
  //   instanceName: instance?.instanceName,
  //   status: status?.status,
  //   shouldShowQRCode,
  //   qrCode: qrCode?.base64 ? 'QR code received' : 'No QR code',
  //   qrLoading
  // })

  if (instanceLoading) {
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
      <div className="flex items-center gap-3">
        <MessageCircle className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Business</h1>
          <p className="text-muted-foreground">Configure sua integração com WhatsApp</p>
        </div>
      </div>

      {!instance?.instanceName ? (
        // Nenhuma instância configurada
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Configurar WhatsApp
            </CardTitle>
            <CardDescription>
              Configure uma instância do WhatsApp Business para sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showCreateForm ? (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma instância configurada</h3>
                <p className="text-muted-foreground mb-4">
                  Configure uma instância do WhatsApp para começar a receber e enviar mensagens
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Configurar WhatsApp
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="instanceName">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    placeholder="Ex: minha-empresa-whatsapp"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Use apenas letras, números e hífens. Este nome será usado para identificar sua instância.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">Número do WhatsApp</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Ex: 5511999999999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Digite o número com código do país (ex: 55 para Brasil). Apenas números.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateInstance}
                    disabled={!instanceName.trim() || !phoneNumber.trim() || createInstance.isPending}
                  >
                    {createInstance.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Instância'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false)
                      setInstanceName('')
                      setPhoneNumber('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Instância configurada
        <div className="grid gap-6 md:grid-cols-2">
          {/* Status da Instância */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Status da Instância
                </span>
                {statusLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  getStatusBadge(status?.status)
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Nome:</span>
                  <span className="text-sm">{instance.instanceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">ID:</span>
                  <span className="text-sm font-mono">{instance.instanceId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className="text-sm">{status?.status || 'Verificando...'}</span>
                </div>
                {status?.owner && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Número:</span>
                    <span className="text-sm">{status.owner}</span>
                  </div>
                )}
                {status?.profileName && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Nome:</span>
                    <span className="text-sm">{status.profileName}</span>
                  </div>
                )}
                {instance.connectedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Conectado em:</span>
                    <span className="text-sm">
                      {new Date(instance.connectedAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteInstance.isPending}
                >
                  {deleteInstance.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Remover Instância
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Conexão WhatsApp
              </CardTitle>
              <CardDescription>
                {status?.status === 'open' 
                  ? 'WhatsApp conectado com sucesso!' 
                  : 'Escaneie o QR Code com seu WhatsApp'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status?.status === 'open' ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    WhatsApp Conectado!
                  </h3>
                  <p className="text-muted-foreground">
                    Sua instância está conectada e pronta para receber mensagens.
                  </p>
                </div>
              ) : shouldShowQRCode ? (
                <QRCodeDisplay 
                  instanceName={instance.instanceName}
                  qrCode={qrCode?.base64}
                  isLoading={qrLoading}
                />
              ) : (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Verificando status da conexão...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Informações importantes */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Apenas uma instância WhatsApp pode ser configurada por empresa. 
          Certifique-se de usar um número WhatsApp Business dedicado para esta integração.
        </AlertDescription>
      </Alert>
    </div>
  )
}
