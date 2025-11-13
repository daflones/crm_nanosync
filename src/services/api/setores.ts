import { supabase } from '@/lib/supabase'
// import { supabaseAdmin } from '@/lib/supabase-admin'
// import { AtividadeService } from './atividades'

export interface Setor {
  id: string
  nome: string
  descricao?: string
  email?: string
  telefone?: string
  whatsapp?: string
  responsavel?: string
  horario_funcionamento?: {
    [key: string]: {
      ativo: boolean
      periodos: Array<{
        inicio: string
        fim: string
      }>
    }
  }
  cor_identificacao?: string
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
  ativo: boolean
  notificacoes_ativas: boolean
  // Novos campos para IA
  instrucoes_ia?: string
  contexto_uso?: string
  palavras_chave?: string[]
  profile: string // Campo para filtro por empresa
  created_at: string
  updated_at: string
}

export interface SetorCreateData {
  nome: string
  descricao?: string
  email?: string
  telefone?: string
  whatsapp?: string
  responsavel?: string
  horario_funcionamento?: {
    [key: string]: {
      ativo: boolean
      periodos: Array<{
        inicio: string
        fim: string
      }>
    }
  }
  cor_identificacao?: string
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
  ativo?: boolean
  notificacoes_ativas?: boolean
  // Novos campos para IA
  instrucoes_ia?: string
  contexto_uso?: string
  palavras_chave?: string[]
}

export interface SetorUpdateData extends Partial<SetorCreateData> {}

export class SetorService {
  static async getAll(): Promise<Setor[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('setores_atendimento')
        .select('*')
        .eq('profile', user.id)
        .order('nome')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar setores:', error)
      throw error
    }
  }

  static async getById(id: string): Promise<Setor | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('setores_atendimento')
        .select('*')
        .eq('id', id)
        .eq('profile', user.id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar setor:', error)
      throw error
    }
  }

  static async create(setorData: SetorCreateData): Promise<Setor> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const dataToInsert = {
        ...setorData,
        profile: user.id,
        ativo: setorData.ativo ?? true,
        notificacoes_ativas: setorData.notificacoes_ativas ?? true,
        prioridade: setorData.prioridade || 'media',
        cor_identificacao: setorData.cor_identificacao || '#6366f1'
      }

      const { data, error } = await supabase
        .from('setores_atendimento')
        .insert([dataToInsert])
        .select()
        .single()

      if (error) throw error

      // Registrar atividade
      // TODO: Implementar AtividadeService.registrarAtividade
      // try {
      //   await AtividadeService.registrarAtividade({
      //     tipo: 'setor_criado',
      //     descricao: `Setor "${setorData.nome}" foi criado`,
      //     detalhes: {
      //       setor_id: data.id,
      //       setor_nome: setorData.nome
      //     }
      //   })
      // } catch (error) {
      //   console.error('Erro ao registrar atividade:', error)
      // }

      return data
    } catch (error) {
      console.error('Erro ao criar setor:', error)
      throw error
    }
  }

  static async update(id: string, setorData: SetorUpdateData): Promise<Setor> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('setores_atendimento')
        .update({
          ...setorData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('profile', user.id)
        .select()
        .single()

      if (error) throw error

      // Registrar atividade
      // TODO: Implementar AtividadeService.registrarAtividade
      // try {
      //   await AtividadeService.registrarAtividade({
      //     tipo: 'setor_atualizado',
      //     descricao: `Setor "${data.nome}" foi atualizado`,
      //     detalhes: {
      //       setor_id: id,
      //       setor_nome: data.nome,
      //       alteracoes: setorData
      //     }
      //   })
      // } catch (atividadeError) {
      //   console.warn('Erro ao registrar atividade:', atividadeError)
      // }

      return data
    } catch (error) {
      console.error('Erro ao atualizar setor:', error)
      throw error
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Buscar dados do setor antes de deletar para o log
      const setor = await this.getById(id)

      const { error } = await supabase
        .from('setores_atendimento')
        .delete()
        .eq('id', id)
        .eq('profile', user.id)

      if (error) throw error

      // Registrar atividade
      // TODO: Implementar AtividadeService.registrarAtividade
      // if (setor) {
      //   try {
      //     await AtividadeService.registrarAtividade({
      //       tipo: 'setor_excluido',
      //       descricao: `Setor "${setor.nome}" foi excluído`,
      //       detalhes: {
      //         setor_id: id,
      //         setor_nome: setor.nome
      //       }
      //     })
      //   } catch (error) {
      //     console.error('Erro ao registrar atividade:', error)
      //   }
      // }
    } catch (error) {
      console.error('Erro ao excluir setor:', error)
      throw error
    }
  }

  static async toggleStatus(id: string): Promise<Setor> {
    try {
      const setor = await this.getById(id)
      if (!setor) throw new Error('Setor não encontrado')

      return await this.update(id, { ativo: !setor.ativo })
    } catch (error) {
      console.error('Erro ao alterar status do setor:', error)
      throw error
    }
  }

  static async getSetoresAtivos(): Promise<Setor[]> {
    try {
      const setores = await SetorService.getAll()
      return setores.filter(setor => setor.ativo)
    } catch (error) {
      console.error('Erro ao buscar setores ativos:', error)
      throw error
    }
  }
}
