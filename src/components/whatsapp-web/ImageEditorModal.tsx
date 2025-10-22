import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  X, 
  RotateCw, 
  Crop, 
  Type, 
  Pen, 
  Undo, 
  Redo,
  Download,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react'
import { toast } from 'sonner'

interface ImageEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (imageData: string, caption: string) => void
  imageFile: File | null
}

interface DrawingPoint {
  x: number
  y: number
}

interface DrawingStroke {
  points: DrawingPoint[]
  color: string
  width: number
}

interface TextElement {
  id: string
  text: string
  x: number
  y: number
  color: string
  fontSize: number
  fontFamily: string
}

export function ImageEditorModal({ isOpen, onClose, onSend, imageFile }: ImageEditorModalProps) {
  const [caption, setCaption] = useState('')
  const [editedImageData, setEditedImageData] = useState<string>('')
  const [currentTool, setCurrentTool] = useState<'move' | 'draw' | 'text' | 'crop'>('move')
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([])
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([])
  const [drawColor, setDrawColor] = useState('#ff0000')
  const [drawWidth, setDrawWidth] = useState(3)
  const [textColor, setTextColor] = useState('#ffffff')
  const [fontSize, setFontSize] = useState(24)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Carregar imagem inicial
  useEffect(() => {
    if (imageFile && isOpen) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setEditedImageData(result)
        loadImageToCanvas(result)
      }
      reader.readAsDataURL(imageFile)
    }
  }, [imageFile, isOpen])

  const loadImageToCanvas = (imageSrc: string) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      if (canvas && ctx) {
        // Ajustar tamanho do canvas para a imagem
        const maxWidth = 800
        const maxHeight = 600
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        
        canvas.width = width
        canvas.height = height
        
        // Desenhar imagem
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        
        // Salvar estado inicial
        saveToHistory()
      }
    }
    
    img.src = imageSrc
  }

  const saveToHistory = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const imageData = canvas.toDataURL()
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(imageData)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setHistoryIndex(prevIndex)
      loadImageFromHistory(history[prevIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      loadImageFromHistory(history[nextIndex])
    }
  }

  const loadImageFromHistory = (imageData: string) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
    }
    
    img.src = imageData
  }

  const rotateImage = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      
      if (tempCtx) {
        // Trocar dimensões para rotação de 90°
        tempCanvas.width = canvas.height
        tempCanvas.height = canvas.width
        
        // Rotacionar
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
        tempCtx.rotate(Math.PI / 2)
        tempCtx.putImageData(imageData, -canvas.width / 2, -canvas.height / 2)
        
        // Aplicar de volta ao canvas principal
        canvas.width = tempCanvas.width
        canvas.height = tempCanvas.height
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(tempCanvas, 0, 0)
        
        setRotation((prev) => (prev + 90) % 360)
        saveToHistory()
      }
    }
  }

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'draw') {
      setIsDrawing(true)
      const coords = getCanvasCoordinates(e)
      setCurrentStroke([coords])
    } else if (currentTool === 'text') {
      const coords = getCanvasCoordinates(e)
      const text = prompt('Digite o texto:')
      if (text) {
        addTextElement(text, coords.x, coords.y)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool !== 'draw') return
    
    const coords = getCanvasCoordinates(e)
    const newStroke = [...currentStroke, coords]
    setCurrentStroke(newStroke)
    
    // Desenhar no canvas
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    
    if (ctx && newStroke.length > 1) {
      ctx.strokeStyle = drawColor
      ctx.lineWidth = drawWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      const prevPoint = newStroke[newStroke.length - 2]
      const currentPoint = newStroke[newStroke.length - 1]
      
      ctx.beginPath()
      ctx.moveTo(prevPoint.x, prevPoint.y)
      ctx.lineTo(currentPoint.x, currentPoint.y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      setDrawingStrokes(prev => [...prev, {
        points: currentStroke,
        color: drawColor,
        width: drawWidth
      }])
      setCurrentStroke([])
      saveToHistory()
    }
    setIsDrawing(false)
  }

  const addTextElement = (text: string, x: number, y: number) => {
    const newTextElement: TextElement = {
      id: Date.now().toString(),
      text,
      x,
      y,
      color: textColor,
      fontSize,
      fontFamily: 'Arial'
    }
    
    setTextElements(prev => [...prev, newTextElement])
    
    // Desenhar texto no canvas
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    
    if (ctx) {
      ctx.font = `${fontSize}px Arial`
      ctx.fillStyle = textColor
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      
      // Texto com contorno para melhor visibilidade
      ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
      
      saveToHistory()
    }
  }

  const handleSend = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      onSend(imageData, caption)
      handleClose()
    }
  }

  const handleClose = () => {
    setCaption('')
    setEditedImageData('')
    setDrawingStrokes([])
    setTextElements([])
    setHistory([])
    setHistoryIndex(-1)
    setZoom(1)
    setRotation(0)
    onClose()
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement('a')
      link.download = `edited_image_${Date.now()}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.9)
      link.click()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pen className="w-5 h-5" />
            Editor de Imagem
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[70vh]">
          {/* Ferramentas */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <div>
              <Label className="text-sm font-medium">Ferramentas</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={currentTool === 'move' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('move')}
                >
                  <Move className="w-4 h-4" />
                </Button>
                <Button
                  variant={currentTool === 'draw' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('draw')}
                >
                  <Pen className="w-4 h-4" />
                </Button>
                <Button
                  variant={currentTool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('text')}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant={currentTool === 'crop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('crop')}
                  disabled
                >
                  <Crop className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Controles de Desenho */}
            {currentTool === 'draw' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Desenho</Label>
                <div>
                  <Label className="text-xs">Cor</Label>
                  <Input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Espessura: {drawWidth}px</Label>
                  <Input
                    type="range"
                    min="1"
                    max="20"
                    value={drawWidth}
                    onChange={(e) => setDrawWidth(Number(e.target.value))}
                    className="h-2"
                  />
                </div>
              </div>
            )}

            {/* Controles de Texto */}
            {currentTool === 'text' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Texto</Label>
                <div>
                  <Label className="text-xs">Cor</Label>
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tamanho: {fontSize}px</Label>
                  <Input
                    type="range"
                    min="12"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="h-2"
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Ações */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ações</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rotateImage}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadImage}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas de Edição */}
          <div className="lg:col-span-3 flex flex-col">
            <div 
              ref={containerRef}
              className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
            >
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full border border-gray-300 cursor-crosshair"
                style={{ 
                  cursor: currentTool === 'move' ? 'move' : 
                         currentTool === 'draw' ? 'crosshair' : 
                         currentTool === 'text' ? 'text' : 'crosshair'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>

            {/* Campo de Legenda */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Textarea
                id="caption"
                placeholder="Digite uma legenda para a imagem..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700">
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
