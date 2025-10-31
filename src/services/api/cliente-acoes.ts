import { supabase } from '@/lib/supabase'
import type { 
  ClienteAcao, 
  ClienteAcaoCreateData, 
  ClienteAcaoUpdateData 
} from '@/types/cliente-acao'

export const clienteAcoesService = {
  // Buscar todas as ações de um cliente
  async buscarPorCliente(clienteId: string): Promise<ClienteAcao[]> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id, admin_profile_id')
        .eq('id', currentUser.id)
        .single()

      if (!currentProfile) {
        throw new Error('Perfil não encontrado')
      }

      const profileId = currentProfile.admin_profile_id || currentProfile.id

      const { data, error } = await supabase
        .from('cliente_acoes')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('profile_id', profileId)
        .order('ordem', { ascending: true })
        .order('data_prevista', { ascending: true })

      if (error) {
        console.error('Erro ao buscar ações:', error)
        throw new Error(`Erro ao buscar ações: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar ações:', error)
      throw error
    }
  },

  // Criar nova ação
  async criar(acaoData: ClienteAcaoCreateData): Promise<ClienteAcao> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id, admin_profile_id')
        .eq('id', currentUser.id)
        .single()

      if (!currentProfile) {
        throw new Error('Perfil não encontrado')
      }

      const profileId = currentProfile.admin_profile_id || currentProfile.id

      // Buscar próxima ordem disponível
      const { data: ultimaAcao } = await supabase
        .from('cliente_acoes')
        .select('ordem')
        .eq('cliente_id', acaoData.cliente_id)
        .eq('profile_id', profileId)
        .order('ordem', { ascending: false })
        .limit(1)
        .single()

      const proximaOrdem = ultimaAcao ? ultimaAcao.ordem + 1 : 0

      const insertData = {
        ...acaoData,
        profile_id: profileId,
        criado_por: currentUser.id,
        status: acaoData.status || 'pendente',
        ordem: acaoData.ordem !== undefined ? acaoData.ordem : proximaOrdem,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('cliente_acoes')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar ação:', error)
        throw new Error(`Erro ao criar ação: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Erro ao criar ação:', error)
      throw error
    }
  },

  // Atualizar ação
  async atualizar(id: string, acaoData: ClienteAcaoUpdateData): Promise<ClienteAcao> {
    try {
      const updateData = {
        ...acaoData,
        updated_at: new Date().toISOString()
      }

      // Se mudou para concluída, adicionar data de conclusão
      if (acaoData.status === 'concluida' && !acaoData.data_conclusao) {
        updateData.data_conclusao = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('cliente_acoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar ação:', error)
        throw new Error(`Erro ao atualizar ação: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar ação:', error)
      throw error
    }
  },

  // Deletar ação
  async deletar(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cliente_acoes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar ação:', error)
        throw new Error(`Erro ao deletar ação: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao deletar ação:', error)
      throw error
    }
  },

  // Reordenar ações (para drag & drop)
  async reordenar(acoes: { id: string; ordem: number }[]): Promise<void> {
    try {
      // Atualizar cada ação com sua nova ordem
      const updates = acoes.map(acao =>
        supabase
          .from('cliente_acoes')
          .update({ 
            ordem: acao.ordem,
            updated_at: new Date().toISOString()
          })
          .eq('id', acao.id)
      )

      await Promise.all(updates)
    } catch (error) {
      console.error('Erro ao reordenar ações:', error)
      throw error
    }
  },

  // Marcar como concluída
  async marcarConcluida(id: string): Promise<ClienteAcao> {
    return this.atualizar(id, {
      status: 'concluida',
      data_conclusao: new Date().toISOString()
    })
  },

  // Buscar ações pendentes de um cliente
  async buscarPendentes(clienteId: string): Promise<ClienteAcao[]> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id, admin_profile_id')
        .eq('id', currentUser.id)
        .single()

      if (!currentProfile) {
        throw new Error('Perfil não encontrado')
      }

      const profileId = currentProfile.admin_profile_id || currentProfile.id

      const { data, error } = await supabase
        .from('cliente_acoes')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('profile_id', profileId)
        .in('status', ['pendente', 'em_andamento'])
        .order('data_prevista', { ascending: true })

      if (error) {
        console.error('Erro ao buscar ações pendentes:', error)
        throw new Error(`Erro ao buscar ações pendentes: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar ações pendentes:', error)
      throw error
    }
  }
}
