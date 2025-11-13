import { supabase } from '@/lib/supabase'
import type { Tag, TagCreateData, TagUpdateData } from '@/types/tag'

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

  // Retorna o admin_profile_id se for vendedor, ou o próprio id se for admin
  return profile.admin_profile_id || profile.id
}

// Buscar todas as tags ativas da empresa
export async function getTags(): Promise<{ data: Tag[] | null; error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('profile_id', profileId)
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar tags:', error)
    return { data: null, error }
  }
}

// Buscar todas as tags (incluindo inativas)
export async function getAllTags(): Promise<{ data: Tag[] | null; error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('profile_id', profileId)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar todas as tags:', error)
    return { data: null, error }
  }
}

// Buscar uma tag específica
export async function getTag(id: string): Promise<{ data: Tag | null; error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profileId)
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar tag:', error)
    return { data: null, error }
  }
}

// Criar uma nova tag
export async function createTag(tagData: TagCreateData): Promise<{ data: Tag | null; error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    // Verificar se já existe uma tag com o mesmo nome
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('profile_id', profileId)
      .ilike('nome', tagData.nome)
      .maybeSingle()

    if (existingTag) {
      return { 
        data: null, 
        error: { message: 'Já existe uma tag com este nome' } 
      }
    }

    const { data, error } = await supabase
      .from('tags')
      .insert([{
        profile_id: profileId,
        ...tagData,
        ativo: tagData.ativo ?? true,
        ordem: tagData.ordem ?? 0
      }])
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao criar tag:', error)
    return { data: null, error }
  }
}

// Atualizar uma tag
export async function updateTag(id: string, tagData: TagUpdateData): Promise<{ data: Tag | null; error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    // Se estiver mudando o nome, verificar duplicidade
    if (tagData.nome) {
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('profile_id', profileId)
        .ilike('nome', tagData.nome)
        .neq('id', id)
        .maybeSingle()

      if (existingTag) {
        return { 
          data: null, 
          error: { message: 'Já existe uma tag com este nome' } 
        }
      }
    }

    const { data, error } = await supabase
      .from('tags')
      .update({
        ...tagData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('profile_id', profileId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao atualizar tag:', error)
    return { data: null, error }
  }
}

// Deletar uma tag
export async function deleteTag(id: string): Promise<{ error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('profile_id', profileId)

    return { error }
  } catch (error) {
    console.error('Erro ao deletar tag:', error)
    return { error }
  }
}

// Reordenar tags (drag and drop)
export async function reorderTags(tags: { id: string; ordem: number }[]): Promise<{ error: any }> {
  try {
    const profileId = await getCurrentUserCompanyProfileId()

    // Atualizar todas as ordens em uma transação
    const updates = tags.map(tag =>
      supabase
        .from('tags')
        .update({ ordem: tag.ordem })
        .eq('id', tag.id)
        .eq('profile_id', profileId)
    )

    await Promise.all(updates)

    return { error: null }
  } catch (error) {
    console.error('Erro ao reordenar tags:', error)
    return { error }
  }
}
