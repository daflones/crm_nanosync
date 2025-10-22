import { useEffect, useState } from 'react'
import { RefreshCw, Smartphone, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import QRCode from 'qrcode'

interface QRCodeWebDisplayProps {
  qrCode: string
}

export function QRCodeWebDisplay({ qrCode }: QRCodeWebDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [qrExpired, setQrExpired] = useState(false)
  const [countdown, setCountdown] = useState(60)

  // Gerar QR Code visual a partir do código
  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => {
        setQrDataUrl(url)
        setQrExpired(false)
        setCountdown(60)
      })
      .catch(err => {
        console.error('Erro ao gerar QR Code:', err)
      })
    }
  }, [qrCode])

  // Countdown timer para expiração do QR code
  useEffect(() => {
    if (!qrCode || qrExpired) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setQrExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [qrCode, qrExpired])

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!qrCode) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">QR Code não disponível</p>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        {qrExpired ? (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">QR Code Expirado</h3>
            <p className="text-muted-foreground mb-4">
              O QR Code expirou. Clique em atualizar para gerar um novo.
            </p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar QR Code
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code WhatsApp Web" 
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="font-medium">Escaneie com seu WhatsApp</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Expira em: <span className="font-mono font-semibold">{countdown}s</span>
              </p>
            </div>
          </>
        )}
      </div>

      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          <strong>Como conectar:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Abra o WhatsApp no seu celular</li>
            <li>Toque em "Mais opções" (⋮) e depois em "Aparelhos conectados"</li>
            <li>Toque em "Conectar um aparelho"</li>
            <li>Aponte seu celular para este QR Code</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}
