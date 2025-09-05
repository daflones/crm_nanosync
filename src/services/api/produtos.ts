import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AtividadeService } from './atividades'

export interface Produto {
  id: string
  categoria_id?: string
  segmento_id?: string
  nome: string
  codigo: string
  descricao?: string
  resumo?: string
  valor_unitario: number
  unidade?: string
  especificacoes?: string
  dimensoes?: string
  peso?: string
  material?: string
  cores_disponiveis?: string[]
  acabamento?: string
  embalagem?: string
  prazo_entrega?: string
  minimo_pedido?: number
  multiplo_venda?: number
  tabela_desconto?: any[]
  imagem_principal?: string
  galeria_imagens?: string[]
  video_url?: string
  catalogo_url?: string
  ficha_tecnica_url?: string
  status?: 'ativo' | 'inativo' | 'descontinuado' | 'em_desenvolvimento'
  destaque?: boolean
  mais_vendido?: boolean
  novidade?: boolean
  tags?: string[]
  palavras_chave?: string[]
  controla_estoque?: boolean
  estoque_atual?: number
  estoque_minimo?: number
  created_at: string
  updated_at: string
  // Relations
  categoria?: { nome: string }
  segmento?: { nome: string }
}

export interface ProdutoCreateData {
  categoria_id?: string
  segmento_id?: string
  nome: string
  codigo: string
  descricao?: string
  resumo?: string
  valor_unitario: number
  unidade?: string
  especificacoes?: string
  dimensoes?: string
  peso?: string
  material?: string
  cores_disponiveis?: string[]
  acabamento?: string
  embalagem?: string
  prazo_entrega?: string
  minimo_pedido?: number
  multiplo_venda?: number
  tabela_desconto?: any[]
  imagem_principal?: string
  galeria_imagens?: string[]
  video_url?: string
  catalogo_url?: string
  ficha_tecnica_url?: string
  status?: 'ativo' | 'inativo' | 'descontinuado' | 'em_desenvolvimento'
  destaque?: boolean
  mais_vendido?: boolean
  novidade?: boolean
  tags?: string[]
  palavras_chave?: string[]
  controla_estoque?: boolean
  estoque_atual?: number
  estoque_minimo?: number
}

export interface ProdutoUpdateData extends Partial<ProdutoCreateData> {}

export const produtosService = {
  async getAll(filters?: {
    categoria_id?: string
    status?: string
    search?: string
  }): Promise<Produto[]> {
    let query = supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(nome),
        segmento:segmentos(nome)
      `)
      .order('nome', { ascending: true })

    if (filters?.categoria_id) {
      query = query.eq('categoria_id', filters.categoria_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%,codigo.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar produtos:', error)
      throw new Error(`Erro ao buscar produtos: ${error.message}`)
    }

    return data || []
  },

  async getStats(): Promise<{
    total: number
    ativos: number
    inativos: number
    baixo_estoque: number
    valor_total_estoque: number
  }> {
    const { data, error } = await supabase
      .from('produtos')
      .select('status, estoque_atual, estoque_minimo, valor_unitario, controla_estoque')

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
    }

    const stats = {
      total: data.length,
      ativos: data.filter(p => p.status === 'ativo').length,
      inativos: data.filter(p => p.status === 'inativo').length,
      baixo_estoque: data.filter(p => 
        p.controla_estoque && 
        p.estoque_atual !== null && 
        p.estoque_minimo !== null && 
        p.estoque_atual <= p.estoque_minimo
      ).length,
      valor_total_estoque: data.reduce((total, p) => 
        total + ((p.estoque_atual || 0) * (p.valor_unitario || 0)), 0
      )
    }

    return stats
  },

  async getById(id: string): Promise<Produto | null> {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar produto:', error)
      throw new Error(`Erro ao buscar produto: ${error.message}`)
    }

    return data
  },

  async create(produtoData: ProdutoCreateData): Promise<Produto> {
    // Clean empty strings to null and ensure required fields
    const cleanData = { ...produtoData }
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key as keyof ProdutoCreateData] === '') {
        (cleanData as any)[key] = null
      }
    })

    // Ensure required fields have values
    if (!cleanData.nome?.trim()) {
      throw new Error('Nome do produto é obrigatório')
    }
    if (!cleanData.codigo?.trim()) {
      throw new Error('Código do produto é obrigatório')
    }

    const { data, error } = await supabaseAdmin
      .from('produtos')
      .insert({
        nome: cleanData.nome,
        codigo: cleanData.codigo,
        descricao: cleanData.descricao || null,
        resumo: cleanData.resumo || null,
        valor_unitario: cleanData.valor_unitario || 0,
        categoria_id: cleanData.categoria_id || null,
        segmento_id: cleanData.segmento_id || null,
        unidade: cleanData.unidade || 'un',
        especificacoes: cleanData.especificacoes || {},
        dimensoes: cleanData.dimensoes || null,
        peso: cleanData.peso || null,
        material: cleanData.material || null,
        cores_disponiveis: cleanData.cores_disponiveis || [],
        acabamento: cleanData.acabamento || null,
        embalagem: cleanData.embalagem || null,
        prazo_entrega: cleanData.prazo_entrega || '15 dias',
        minimo_pedido: cleanData.minimo_pedido || 1,
        multiplo_venda: cleanData.multiplo_venda || 1,
        tabela_desconto: cleanData.tabela_desconto || [],
        imagem_principal: cleanData.imagem_principal || null,
        galeria_imagens: cleanData.galeria_imagens || [],
        video_url: cleanData.video_url || null,
        catalogo_url: cleanData.catalogo_url || null,
        ficha_tecnica_url: cleanData.ficha_tecnica_url || null,
        status: cleanData.status || 'ativo',
        destaque: cleanData.destaque || false,
        mais_vendido: cleanData.mais_vendido || false,
        novidade: cleanData.novidade || false,
        tags: cleanData.tags || [],
        palavras_chave: cleanData.palavras_chave || [],
        controla_estoque: cleanData.controla_estoque || false,
        estoque_atual: cleanData.estoque_atual || 0,
        estoque_minimo: cleanData.estoque_minimo || 0
      })
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar produto:', error)
      throw new Error(`Erro ao criar produto: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.criar(
      'produto',
      data.id,
      data,
      `Produto criado: ${data.nome} (${data.codigo})`
    )

    return data
  },

  async update(id: string, updates: ProdutoUpdateData): Promise<Produto> {
    // Buscar dados anteriores para o log
    const produtoAnterior = await this.getById(id)
    
    // Clean empty strings to null
    const cleanUpdates = { ...updates }
    Object.keys(cleanUpdates).forEach(key => {
      if (cleanUpdates[key as keyof ProdutoUpdateData] === '') {
        (cleanUpdates as any)[key] = null
      }
    })

    const { data, error } = await supabaseAdmin
      .from('produtos')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        categoria:categorias(nome),
        segmento:segmentos(nome)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar produto:', error)
      throw new Error(`Erro ao atualizar produto: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.editar(
      'produto',
      data.id,
      produtoAnterior,
      data,
      `Produto editado: ${data.nome} (${data.codigo})`
    )

    return data
  },

  async delete(id: string): Promise<void> {
    console.log('Deletando produto com ID:', id)
    
    // Buscar dados do produto antes de deletar
    const produto = await this.getById(id)
    
    // First, delete the product image if it exists
    try {
      const { data: product } = await supabaseAdmin
        .from('produtos')
        .select('imagem_principal')
        .eq('id', id)
        .single()

      if (product?.imagem_principal) {
        // Extract filename from URL and delete from storage
        const fileName = product.imagem_principal.split('/').pop()
        if (fileName) {
          await supabaseAdmin.storage
            .from('product-images')
            .remove([`products/${fileName}`])
        }
      }
    } catch (storageError) {
      console.warn('Erro ao deletar imagem do produto:', storageError)
      // Continue with product deletion even if image deletion fails
    }

    const { error } = await supabaseAdmin
      .from('produtos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar produto:', error)
      throw new Error(`Erro ao deletar produto: ${error.message}`)
    }

    // Registrar atividade
    if (produto) {
      await AtividadeService.deletar(
        'produto',
        id,
        produto,
        `Produto deletado: ${produto.nome} (${produto.codigo})`
      )
    }
    
    console.log('Produto deletado com sucesso:', id)
  }
}
