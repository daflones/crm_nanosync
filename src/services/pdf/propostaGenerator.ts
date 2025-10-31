import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '@/utils/format'
import type { Proposta, PropostaItem } from '@/services/api/propostas'

// Extend jsPDF types para TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
    lastAutoTable?: {
      finalY: number
    }
  }
}

interface PropostaComCliente extends Proposta {
  cliente?: {
    nome_contato?: string
    nome_empresa?: string
    email?: string
    whatsapp?: string
    remotejid?: string  // ID único do WhatsApp (ex: 5511999999999@s.whatsapp.net)
    cnpj?: string
    endereco?: string
    cidade?: string
    estado?: string
  }
  vendedor?: {
    nome?: string
    email?: string
    telefone?: string
  }
  empresa_nome?: string  // Nome da empresa que usa o NanoSync
}

export type ColorTheme = 'purple' | 'blue' | 'green' | 'orange' | 'red'

// Paletas de cores disponíveis
const COLOR_THEMES = {
  purple: {
    primary: '#a855f7',
    secondary: '#9333ea',
    light: '#f3e8ff',
    name: 'Roxo Profissional'
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    light: '#dbeafe',
    name: 'Azul Corporativo'
  },
  green: {
    primary: '#10b981',
    secondary: '#059669',
    light: '#d1fae5',
    name: 'Verde Sustentável'
  },
  orange: {
    primary: '#f97316',
    secondary: '#ea580c',
    light: '#ffedd5',
    name: 'Laranja Vibrante'
  },
  red: {
    primary: '#ef4444',
    secondary: '#dc2626',
    light: '#fee2e2',
    name: 'Vermelho Impactante'
  }
}

// Cores complementares (não mudam)
const COLORS = {
  dark: '#1f2937',
  medium: '#6b7280',
  white: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

export class PropostaPDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number = 20
  private currentY: number = 20
  private colorTheme: typeof COLOR_THEMES.purple
  private empresaNome: string

  constructor(theme: ColorTheme = 'purple', empresaNome?: string) {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.colorTheme = COLOR_THEMES[theme]
    this.empresaNome = empresaNome || 'NanoSync CRM'
  }

  /**
   * Converte cor hexadecimal para RGB
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : [168, 85, 247] // fallback purple
  }

  /**
   * Gera o PDF completo da proposta
   */
  public async generate(proposta: PropostaComCliente): Promise<Blob> {
    // Header
    this.addHeader(proposta)
    
    // Informações principais
    this.addMainInfo(proposta)
    
    // Dados do cliente
    this.addClientInfo(proposta)
    
    // Itens da proposta
    this.addItems(proposta)
    
    // Totais
    this.addTotals(proposta)
    
    // Termos e Condições
    this.addTermsAndConditions(proposta)
    
    // Footer
    this.addFooter()

    // Retornar como Blob
    return this.doc.output('blob')
  }

  /**
   * Header com logo e informações da empresa - Design moderno
   */
  private addHeader(proposta: PropostaComCliente) {
    // Background gradiente colorido no topo (simulado com retângulos)
    const primaryRgb = this.hexToRgb(this.colorTheme.primary)
    this.doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.rect(0, 0, this.pageWidth, 50, 'F')
    
    // Faixa decorativa mais escura embaixo
    const secondaryRgb = this.hexToRgb(this.colorTheme.secondary)
    this.doc.setFillColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2])
    this.doc.rect(0, 46, this.pageWidth, 4, 'F')

    // Nome da empresa (topo, centralizado, destaque máximo)
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(22)
    this.doc.setFont('helvetica', 'bold')
    const empresaText = this.empresaNome.toUpperCase()
    const empresaWidth = this.doc.getTextWidth(empresaText)
    this.doc.text(empresaText, (this.pageWidth - empresaWidth) / 2, 15)
    
    // Linha decorativa abaixo do nome da empresa
    const lineY = 18
    const lineWidth = empresaWidth + 20
    const lineX = (this.pageWidth - lineWidth) / 2
    this.doc.setDrawColor(255, 255, 255)
    this.doc.setLineWidth(0.5)
    this.doc.line(lineX, lineY, lineX + lineWidth, lineY)

    // Título "PROPOSTA COMERCIAL"
    this.doc.setFontSize(28)
    this.doc.setFont('helvetica', 'bold')
    const tituloText = 'PROPOSTA COMERCIAL'
    const tituloWidth = this.doc.getTextWidth(tituloText)
    this.doc.text(tituloText, (this.pageWidth - tituloWidth) / 2, 32)

    // Número da proposta (centralizado)
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    const numeroWidth = this.doc.getTextWidth(proposta.numero_proposta)
    this.doc.text(proposta.numero_proposta, (this.pageWidth - numeroWidth) / 2, 42)

    this.currentY = 60
  }

  /**
   * Informações principais da proposta - Design moderno
   */
  private addMainInfo(proposta: PropostaComCliente) {
    // Título da proposta (centralizado, destaque)
    this.doc.setTextColor(COLORS.dark)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    const tituloPropostaText = proposta.titulo || 'Proposta Comercial'
    const tituloPropostaWidth = this.doc.getTextWidth(tituloPropostaText)
    this.doc.text(tituloPropostaText, (this.pageWidth - tituloPropostaWidth) / 2, this.currentY)
    
    this.currentY += 12

    // Box com informações chave
    const boxHeight = 22
    const lightRgb = this.hexToRgb(this.colorTheme.light)
    this.doc.setFillColor(lightRgb[0], lightRgb[1], lightRgb[2])
    this.doc.roundedRect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, boxHeight, 3, 3, 'F')
    
    // Border do box
    const primaryRgb = this.hexToRgb(this.colorTheme.primary)
    this.doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, boxHeight, 3, 3, 'S')

    this.doc.setFontSize(9)
    const leftCol = this.margin + 5
    const col2 = this.margin + 50
    const col3 = this.pageWidth / 2 + 5
    const col4 = this.pageWidth / 2 + 45

    // Primeira linha
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.text('Emissão:', leftCol, this.currentY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(COLORS.dark)
    this.doc.text(new Date(proposta.created_at).toLocaleDateString('pt-BR'), col2, this.currentY)

    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.text('Validade:', col3, this.currentY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(COLORS.dark)
    this.doc.text(`${proposta.validade_dias} dias`, col4, this.currentY)

    this.currentY += 6

    // Segunda linha
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.text('Status:', leftCol, this.currentY)
    this.doc.setFont('helvetica', 'normal')
    
    // Status labels
    const statusLabels: Record<string, string> = {
      'rascunho': 'Rascunho',
      'revisao': 'Em Revisão',
      'aprovada_interna': 'Aprovada Internamente',
      'enviada': 'Enviada',
      'visualizada': 'Visualizada',
      'em_negociacao': 'Em Negociação',
      'aprovada': 'Aprovada',
      'rejeitada': 'Rejeitada',
      'vencida': 'Vencida'
    }

    const statusLabel = statusLabels[proposta.status] || proposta.status
    this.doc.setTextColor(COLORS.dark)
    this.doc.text(statusLabel, col2, this.currentY)

    // Vendedor (se existir)
    if (proposta.vendedor?.nome) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      this.doc.text('Vendedor:', col3, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(COLORS.dark)
      this.doc.text(proposta.vendedor.nome, col4, this.currentY)
    }

    this.currentY += 15
  }

  /**
   * Dados do cliente - Design moderno
   */
  private addClientInfo(proposta: PropostaComCliente) {
    if (!proposta.cliente) return
    
    // Box colorido com borda arredondada
    const lightRgb = this.hexToRgb(this.colorTheme.light)
    this.doc.setFillColor(lightRgb[0], lightRgb[1], lightRgb[2])
    
    // Calcular altura do box dinamicamente
    let camposCount = 0
    if (proposta.cliente.nome_empresa || proposta.cliente.nome_contato) camposCount++
    if (proposta.cliente.cnpj) camposCount++
    if (proposta.cliente.email) camposCount++
    if (proposta.cliente.whatsapp) camposCount++
    if (proposta.cliente.endereco) camposCount++
    
    const boxHeight = 10 + (camposCount * 7)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 3, 3, 'F')
    
    // Border do box
    const primaryRgb = this.hexToRgb(this.colorTheme.primary)
    this.doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 3, 3, 'S')

    this.currentY += 7

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.text('DADOS DO CLIENTE', this.margin + 5, this.currentY)

    this.currentY += 7
    this.doc.setFontSize(9)

    const leftCol = this.margin + 5
    const leftVal = this.margin + 40
    const rightCol = this.pageWidth / 2 + 5
    const rightVal = this.pageWidth / 2 + 40

    // Nome/Empresa + CNPJ (mesma linha se ambos existem)
    if (proposta.cliente.nome_empresa || proposta.cliente.nome_contato) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      this.doc.text('Empresa:', leftCol, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(COLORS.dark)
      this.doc.text(proposta.cliente.nome_empresa || proposta.cliente.nome_contato || '', leftVal, this.currentY)

      if (proposta.cliente.cnpj) {
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
        this.doc.text('CNPJ:', rightCol, this.currentY)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(COLORS.dark)
        this.doc.text(proposta.cliente.cnpj, rightVal, this.currentY)
      }
      
      this.currentY += 6
    }

    // Email + WhatsApp (mesma linha se ambos existem)
    if (proposta.cliente.email || proposta.cliente.whatsapp) {
      if (proposta.cliente.email) {
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
        this.doc.text('Email:', leftCol, this.currentY)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(COLORS.dark)
        this.doc.text(proposta.cliente.email, leftVal, this.currentY)
      }

      if (proposta.cliente.whatsapp) {
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
        this.doc.text('WhatsApp:', rightCol, this.currentY)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(COLORS.dark)
        this.doc.text(proposta.cliente.whatsapp, rightVal, this.currentY)
      }
      
      this.currentY += 6
    }

    // Endereço (linha completa)
    if (proposta.cliente.endereco) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      this.doc.text('Endereço:', leftCol, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(COLORS.dark)
      const enderecoCompleto = `${proposta.cliente.endereco}${proposta.cliente.cidade ? ', ' + proposta.cliente.cidade : ''}${proposta.cliente.estado ? ' - ' + proposta.cliente.estado : ''}`
      this.doc.text(enderecoCompleto, leftVal, this.currentY)
      this.currentY += 6
    }

    this.currentY += 10
  }

  /**
   * Itens da proposta em tabela - Design moderno
   */
  private addItems(proposta: PropostaComCliente) {
    this.doc.setFontSize(13)
    this.doc.setFont('helvetica', 'bold')
    const primaryRgb = this.hexToRgb(this.colorTheme.primary)
    this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.text('ITENS DA PROPOSTA', this.margin, this.currentY)

    this.currentY += 7

    // Preparar dados para a tabela
    const items = proposta.itens || []
    const tableData = items.map((item, index) => {
      const row = [
        (index + 1).toString(),
        item.nome + (item.descricao ? `\n${item.descricao}` : ''),
        `${item.quantidade} ${item.unidade}`,
        formatCurrency(item.valor_unitario),
      ]
      
      // Só adiciona coluna de desconto se algum item tiver desconto
      const hasDesconto = items.some(i => i.percentual_desconto > 0)
      if (hasDesconto) {
        row.push(item.percentual_desconto > 0 ? `${item.percentual_desconto}%` : '-')
      }
      
      row.push(formatCurrency(item.valor_total))
      return row
    })

    // Headers dinâmicos
    const hasDesconto = items.some(i => i.percentual_desconto > 0)
    const headers = hasDesconto 
      ? ['#', 'Item/Serviço', 'Qtd', 'Valor Unit.', 'Desc.', 'Total']
      : ['#', 'Item/Serviço', 'Qtd', 'Valor Unit.', 'Total']

    // Configuração da tabela
    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.hexToRgb(this.colorTheme.primary),
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.1,
        lineColor: this.hexToRgb(this.colorTheme.secondary)
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      columnStyles: hasDesconto ? {
        0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
        1: { halign: 'left', cellWidth: 65 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 27, fontStyle: 'bold' }
      } : {
        0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
        1: { halign: 'left', cellWidth: 85 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 27 },
        4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: this.hexToRgb(this.colorTheme.light)
      },
      margin: { left: this.margin, right: this.margin }
    })

    // @ts-ignore - lastAutoTable é adicionada pela biblioteca
    this.currentY = (this.doc as any).lastAutoTable?.finalY || this.currentY + 50
    this.currentY += 12
  }

  /**
   * Totais da proposta - Design moderno
   */
  private addTotals(proposta: PropostaComCliente) {
    const rightAlign = this.pageWidth - this.margin
    const boxWidth = 70
    const labelX = rightAlign - boxWidth + 5
    const valueX = rightAlign - 5

    // Calcular altura do box dinamicamente
    let linhasCount = 1 // Subtotal sempre existe
    if (proposta.valor_desconto > 0) linhasCount++
    if (proposta.valor_frete > 0) linhasCount++
    if (proposta.valor_impostos > 0) linhasCount++
    linhasCount++ // Linha do total
    
    const boxHeight = 10 + (linhasCount * 7)
    
    // Box com gradiente
    const lightRgb = this.hexToRgb(this.colorTheme.light)
    this.doc.setFillColor(lightRgb[0], lightRgb[1], lightRgb[2])
    this.doc.roundedRect(rightAlign - boxWidth, this.currentY - 5, boxWidth, boxHeight, 3, 3, 'F')
    
    // Border do box
    const primaryRgb = this.hexToRgb(this.colorTheme.primary)
    this.doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(rightAlign - boxWidth, this.currentY - 5, boxWidth, boxHeight, 3, 3, 'S')

    this.doc.setFontSize(9)
    this.doc.setTextColor(COLORS.dark)

    // Subtotal
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Subtotal:', labelX, this.currentY, { align: 'left' })
    this.doc.text(formatCurrency(proposta.valor_produtos + proposta.valor_servicos), valueX, this.currentY, { align: 'right' })
    this.currentY += 6

    // Desconto (se existir)
    if (proposta.valor_desconto > 0) {
      this.doc.setTextColor(239, 68, 68) // Red
      this.doc.text(`Desconto (${proposta.percentual_desconto}%):`, labelX, this.currentY, { align: 'left' })
      this.doc.text(`- ${formatCurrency(proposta.valor_desconto)}`, valueX, this.currentY, { align: 'right' })
      this.currentY += 6
      this.doc.setTextColor(COLORS.dark)
    }

    // Frete (se existir)
    if (proposta.valor_frete > 0) {
      this.doc.text('Frete:', labelX, this.currentY, { align: 'left' })
      this.doc.text(formatCurrency(proposta.valor_frete), valueX, this.currentY, { align: 'right' })
      this.currentY += 6
    }

    // Impostos (se existir)
    if (proposta.valor_impostos > 0) {
      this.doc.text('Impostos:', labelX, this.currentY, { align: 'left' })
      this.doc.text(formatCurrency(proposta.valor_impostos), valueX, this.currentY, { align: 'right' })
      this.currentY += 6
    }

    // Linha separadora
    this.doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.setLineWidth(1)
    this.doc.line(labelX, this.currentY - 1, valueX, this.currentY - 1)
    this.currentY += 5

    // Total
    this.doc.setFontSize(13)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    this.doc.text('TOTAL:', labelX, this.currentY, { align: 'left' })
    this.doc.text(formatCurrency(proposta.valor_total), valueX, this.currentY, { align: 'right' })

    this.currentY += 18
  }

  /**
   * Termos e Condições - Design moderno
   */
  private addTermsAndConditions(proposta: PropostaComCliente) {
    // Nova página se necessário
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage()
      this.currentY = 20
    }

    const primaryRgb = this.hexToRgb(this.colorTheme.primary)
    
    // Coletar condições comerciais que existem
    const conditions: Array<{ label: string; value: string; icon: string }> = []

    if (proposta.forma_pagamento) {
      conditions.push({ label: 'Forma de Pagamento', value: proposta.forma_pagamento, icon: '💳' })
    }
    if (proposta.condicoes_pagamento) {
      conditions.push({ label: 'Condições de Pagamento', value: proposta.condicoes_pagamento, icon: '📋' })
    }
    if (proposta.prazo_entrega) {
      conditions.push({ label: 'Prazo de Entrega', value: proposta.prazo_entrega, icon: '🚚' })
    }
    if (proposta.local_entrega) {
      conditions.push({ label: 'Local de Entrega', value: proposta.local_entrega, icon: '📍' })
    }
    if (proposta.garantia) {
      conditions.push({ label: 'Garantia', value: proposta.garantia, icon: '✅' })
    }
    if (proposta.suporte_incluido) {
      conditions.push({ label: 'Suporte Técnico', value: 'Incluído', icon: '🛠️' })
    }
    if (proposta.treinamento_incluido) {
      conditions.push({ label: 'Treinamento', value: 'Incluído', icon: '🎓' })
    }

    // Só mostrar seção se houver condições
    if (conditions.length > 0) {
      this.doc.setFontSize(13)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      this.doc.text('CONDIÇÕES COMERCIAIS', this.margin, this.currentY)

      this.currentY += 8

      // Renderizar condições em grid
      conditions.forEach((condition, index) => {
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
        this.doc.text(`${condition.label}:`, this.margin, this.currentY)
        
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(COLORS.dark)
        const lines = this.doc.splitTextToSize(
          condition.value, 
          this.pageWidth - 2 * this.margin - 45
        )
        this.doc.text(lines, this.margin + 45, this.currentY)
        this.currentY += 6 * Math.max(1, lines.length)
      })

      this.currentY += 5
    }

    // Descrição (se existir)
    if (proposta.descricao) {
      this.doc.setFontSize(13)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      this.doc.text('DESCRIÇÃO', this.margin, this.currentY)
      this.currentY += 7
      
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(9)
      this.doc.setTextColor(COLORS.dark)
      const descricao = this.doc.splitTextToSize(
        proposta.descricao, 
        this.pageWidth - 2 * this.margin
      )
      this.doc.text(descricao, this.margin, this.currentY)
      this.currentY += 5 * descricao.length + 5
    }

    // Termos e condições gerais (se existir)
    if (proposta.termos_condicoes) {
      this.doc.setFontSize(13)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      this.doc.text('TERMOS E CONDIÇÕES', this.margin, this.currentY)
      this.currentY += 7
      
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(8)
      this.doc.setTextColor(COLORS.dark)
      const termos = this.doc.splitTextToSize(
        proposta.termos_condicoes, 
        this.pageWidth - 2 * this.margin
      )
      this.doc.text(termos, this.margin, this.currentY)
      this.currentY += 4 * termos.length + 5
    }

    // Observações (se existir)
    if (proposta.observacoes) {
      this.doc.setFontSize(13)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      this.doc.text('OBSERVAÇÕES', this.margin, this.currentY)
      this.currentY += 7
      
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(9)
      this.doc.setTextColor(COLORS.dark)
      const obs = this.doc.splitTextToSize(
        proposta.observacoes, 
        this.pageWidth - 2 * this.margin
      )
      this.doc.text(obs, this.margin, this.currentY)
      this.currentY += 5 * obs.length
    }
  }

  /**
   * Footer em todas as páginas - Design moderno
   */
  private addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    const primaryRgb = this.hexToRgb(this.colorTheme.primary)
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Background colorido no footer
      const lightRgb = this.hexToRgb(this.colorTheme.light)
      this.doc.setFillColor(lightRgb[0], lightRgb[1], lightRgb[2])
      this.doc.rect(0, this.pageHeight - 25, this.pageWidth, 25, 'F')
      
      // Linha separadora superior
      this.doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      this.doc.setLineWidth(1)
      this.doc.line(0, this.pageHeight - 25, this.pageWidth, this.pageHeight - 25)
      
      // Nome da empresa (centralizado, destaque)
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      const footerText = this.empresaNome.toUpperCase()
      const footerWidth = this.doc.getTextWidth(footerText)
      this.doc.text(footerText, (this.pageWidth - footerWidth) / 2, this.pageHeight - 15)
      
      // Número da página (direita)
      this.doc.setFontSize(7)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(107, 114, 128) // Gray
      const pageText = `Página ${i}/${pageCount}`
      this.doc.text(pageText, this.pageWidth - this.margin, this.pageHeight - 15, { align: 'right' })
      
      // Data de geração (esquerda)
      const dataGeracao = new Date().toLocaleDateString('pt-BR')
      this.doc.text(dataGeracao, this.margin, this.pageHeight - 15)
      
      // Texto secundário (linha inferior)
      this.doc.setFontSize(6)
      this.doc.setTextColor(156, 163, 175) // Gray lighter
      const subText = 'Documento gerado digitalmente'
      const subTextWidth = this.doc.getTextWidth(subText)
      this.doc.text(subText, (this.pageWidth - subTextWidth) / 2, this.pageHeight - 8)
    }
  }
}

/**
 * Função helper para gerar PDF de uma proposta
 */
export async function generatePropostaPDF(
  proposta: PropostaComCliente, 
  theme: ColorTheme = 'purple',
  empresaNome?: string
): Promise<Blob> {
  const generator = new PropostaPDFGenerator(theme, empresaNome)
  return await generator.generate(proposta)
}

/**
 * Função helper para fazer download do PDF
 */
export async function downloadPropostaPDF(
  proposta: PropostaComCliente,
  theme: ColorTheme = 'purple',
  empresaNome?: string
): Promise<void> {
  const pdfBlob = await generatePropostaPDF(proposta, theme, empresaNome)
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Proposta_${proposta.numero_proposta}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Exportar as cores disponíveis para uso externo
export { COLOR_THEMES }
