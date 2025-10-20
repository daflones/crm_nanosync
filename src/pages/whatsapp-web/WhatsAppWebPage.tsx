import { useState } from 'react'

export default function WhatsAppWebPage() {
  const [isLoading, setIsLoading] = useState(true)

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className="h-screen w-full p-4">
      {/* Container principal com borda estilizada */}
      <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-gradient">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-1 rounded-2xl">
          <div className="h-full w-full bg-white rounded-xl overflow-hidden relative">
            {/* Loading overlay minimalista */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
                <div className="w-8 h-8 border-3 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
              </div>
            )}

            {/* WhatsApp Web Iframe - tela cheia */}
            <iframe
              id="whatsapp-iframe"
              src="https://web.whatsapp.com"
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              title="WhatsApp Web"
              allow="camera; microphone; geolocation; notifications"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
