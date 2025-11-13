import { supabase } from '@/lib/supabase'
import type { TicketSuporte, TicketCreateData, TicketUpdateData, StatusTicket } from '@/types/ticket'

// Função auxiliar para obter o profile_id da empresa
async function getCurrentUserCompanyProfileId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, admin_profile_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Perfil não encontrado')

  return profile.admin_profile_id || profile.id
}

// Buscar todos os tickets com filtros opcionais
export async function getTickets(filters?: {
  status?: StatusTicket
  cliente_id?: string
  vendedor_id?: string
  setor_id?: string
}): Promise<{ data: TicketSuporte[] | null; error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    let query = supabase
      .from('tickets_suporte')
      .select(`
        *,
        cliente:clientes!tickets_suporte_cliente_id_fkey(id, nome_contato, nome_empresa, whatsapp),
        vendedor:vendedores!tickets_suporte_vendedor_id_fkey(id, nome),
        setor:setores_atendimento!tickets_suporte_setor_id_fkey(id, nome, cor_identificacao)
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    // Aplicar filtros opcionais
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.cliente_id) {
      query = query.eq('cliente_id', filters.cliente_id)
    }
    if (filters?.vendedor_id) {
      query = query.eq('vendedor_id', filters.vendedor_id)
    }
    if (filters?.setor_id) {
      query = query.eq('setor_id', filters.setor_id)
    }

    const { data, error } = await query

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar tickets:', error)
    return { data: null, error }
  }
}

// Buscar um ticket específico
export async function getTicket(id: string): Promise<{ data: TicketSuporte | null; error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    const { data, error } = await supabase
      .from('tickets_suporte')
      .select(`
        *,
        cliente:clientes!tickets_suporte_cliente_id_fkey(id, nome_contato, nome_empresa, whatsapp),
        vendedor:vendedores!tickets_suporte_vendedor_id_fkey(id, nome),
        setor:setores_atendimento!tickets_suporte_setor_id_fkey(id, nome, cor_identificacao)
      `)
      .eq('id', id)
      .eq('profile_id', profileId)
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar ticket:', error)
    return { data: null, error }
  }
}

// Criar um novo ticket
export async function createTicket(ticketData: TicketCreateData): Promise<{ data: TicketSuporte | null; error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    const { data, error } = await supabase
      .from('tickets_suporte')
      .insert([{
        profile_id: profileId,
        ...ticketData,
        status: ticketData.status || 'aberto',
        prioridade: ticketData.prioridade || 'media',
      }])
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao criar ticket:', error)
    return { data: null, error }
  }
}

// Atualizar um ticket
export async function updateTicket(id: string, ticketData: TicketUpdateData): Promise<{ data: TicketSuporte | null; error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    // Se o status mudou para resolvido, registrar data
    if (ticketData.status === 'resolvido' && !ticketData.resolvido_em) {
      ticketData.resolvido_em = new Date().toISOString()
    }

    // Se o status mudou para fechado, registrar data
    if (ticketData.status === 'fechado' && !ticketData.fechado_em) {
      ticketData.fechado_em = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tickets_suporte')
      .update({
        ...ticketData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('profile_id', profileId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao atualizar ticket:', error)
    return { data: null, error }
  }
}

// Deletar um ticket
export async function deleteTicket(id: string): Promise<{ error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    const { error } = await supabase
      .from('tickets_suporte')
      .delete()
      .eq('id', id)
      .eq('profile_id', profileId)

    return { error }
  } catch (error) {
    console.error('Erro ao deletar ticket:', error)
    return { error }
  }
}

// Estatísticas de tickets
export async function getTicketStats(): Promise<{
  total: number
  abertos: number
  em_andamento: number
  resolvidos: number
  por_prioridade: Record<string, number>
}> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    const { data: tickets } = await supabase
      .from('tickets_suporte')
      .select('status, prioridade')
      .eq('profile_id', profileId)

    if (!tickets) {
      return {
        total: 0,
        abertos: 0,
        em_andamento: 0,
        resolvidos: 0,
        por_prioridade: {}
      }
    }

    const stats = {
      total: tickets.length,
      abertos: tickets.filter((t: any) => t.status === 'aberto').length,
      em_andamento: tickets.filter((t: any) => t.status === 'em_andamento').length,
      resolvidos: tickets.filter((t: any) => t.status === 'resolvido').length,
      por_prioridade: {
        baixa: tickets.filter((t: any) => t.prioridade === 'baixa').length,
        media: tickets.filter((t: any) => t.prioridade === 'media').length,
        alta: tickets.filter((t: any) => t.prioridade === 'alta').length,
        urgente: tickets.filter((t: any) => t.prioridade === 'urgente').length,
      }
    }

    return stats
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return {
      total: 0,
      abertos: 0,
      em_andamento: 0,
      resolvidos: 0,
      por_prioridade: {}
    }
  }
}
