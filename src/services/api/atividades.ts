import { supabase } from '../../lib/supabase'
import { useAuthStore } from '@/stores/authStore'

function getEntityTypeLabel(tipo: string): string {
  const labels: Record<string, string> = {
    'cliente': 'Cliente',
    'proposta': 'Proposta',
    'produto': 'Produto',
    'vendedor': 'Vendedor',
    'arquivo': 'Arquivo',
    'agendamento': 'Agendamento',
    'categoria': 'Categoria',
    'segmento': 'Segmento',
    'auth': 'Sistema'
  }
  return labels[tipo] || tipo
}

export interface AtividadeData {
  entidade_tipo: string
  entidade_id: string
  acao: string
  descricao: string
  dados_anteriores?: any
  dados_novos?: any
  metadata?: any
}

export interface Atividade {
  id: string
  entidade_tipo: string
  entidade_id: string
  usuario_id: string
  acao: string
  descricao: string
  dados_anteriores?: any
  dados_novos?: any
  metadata?: any
  profile: string
  created_at: string
  // Campos resolvidos
  usuario_nome?: string
  entidade_nome?: string
}

// Serviço centralizado para registro de atividades
export class AtividadeService {
  
  // Registrar uma nova atividade
  static async registrar(data: AtividadeData): Promise<void> {
    try {
      const { user } = useAuthStore.getState()
      
      if (!user?.id) {
        console.warn('Usuário não autenticado - atividade não registrada')
        return
      }

      // Obter perfil do usuário para multi-tenant
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id, role, admin_profile_id')
        .eq('id', user.id)
        .single()

      if (!currentProfile) {
        console.warn('Perfil não encontrado - atividade não registrada')
        return
      }

      // Determinar o ID da empresa (admin_profile_id ou próprio ID se for admin)
      const adminId = currentProfile.admin_profile_id || currentProfile.id

      const atividade = {
        entidade_tipo: data.entidade_tipo,
        entidade_id: data.entidade_id,
        usuario_id: user.id,
        acao: data.acao,
        descricao: data.descricao,
        dados_anteriores: data.dados_anteriores || null,
        dados_novos: data.dados_novos || null,
        metadata: data.metadata || null,
        profile: adminId
      }

      const { error } = await supabase
        .from('atividades')
        .insert([atividade])

      if (error) {
        console.error('Erro ao registrar atividade:', error)
      }
    } catch (error) {
      console.error('Erro ao registrar atividade:', error)
    }
  }

  // Métodos específicos para cada tipo de ação
  static async criar(entidade_tipo: string, entidade_id: string, dados_novos: any, descricao?: string) {
    await this.registrar({
      entidade_tipo,
      entidade_id,
      acao: 'criar',
      descricao: descricao || `${entidade_tipo} criado`,
      dados_novos
    })
  }

  static async editar(entidade_tipo: string, entidade_id: string, dados_anteriores: any, dados_novos: any, descricao?: string) {
    await this.registrar({
      entidade_tipo,
      entidade_id,
      acao: 'editar',
      descricao: descricao || `${entidade_tipo} editado`,
      dados_anteriores,
      dados_novos
    })
  }

  static async deletar(entidade_tipo: string, entidade_id: string, dados_anteriores: any, descricao?: string) {
    await this.registrar({
      entidade_tipo,
      entidade_id,
      acao: 'deletar',
      descricao: descricao || `${entidade_tipo} deletado`,
      dados_anteriores
    })
  }

  static async enviar(entidade_tipo: string, entidade_id: string, metadata?: any, descricao?: string) {
    await this.registrar({
      entidade_tipo,
      entidade_id,
      acao: 'enviar',
      descricao: descricao || `${entidade_tipo} enviado`,
      metadata
    })
  }

  static async aprovar(entidade_tipo: string, entidade_id: string, dados_anteriores: any, dados_novos: any, descricao?: string) {
    await this.registrar({
      entidade_tipo,
      entidade_id,
      acao: 'aprovar',
      descricao: descricao || `${entidade_tipo} aprovado`,
      dados_anteriores,
      dados_novos
    })
  }

  static async upload(entidade_tipo: string, entidade_id: string, metadata: any, descricao?: string) {
    await this.registrar({
      entidade_tipo,
      entidade_id,
      acao: 'upload',
      descricao: descricao || `Arquivo enviado para ${entidade_tipo}`,
      metadata
    })
  }

  static async download(entidade_tipo: string, entidade_id: string, metadata?: any, descricao?: string) {
    await this.registrar({
      entidade_tipo,
      entidade_id,
      acao: 'download',
      descricao: descricao || `Arquivo baixado de ${entidade_tipo}`,
      metadata
    })
  }

  static async login(descricao?: string) {
    const { user } = useAuthStore.getState()
    if (!user?.id) return

    await this.registrar({
      entidade_tipo: 'auth',
      entidade_id: user.id,
      acao: 'login',
      descricao: descricao || 'Usuário fez login no sistema'
    })
  }

  static async logout(descricao?: string) {
    const { user } = useAuthStore.getState()
    if (!user?.id) return

    await this.registrar({
      entidade_tipo: 'auth',
      entidade_id: user.id,
      acao: 'logout',
      descricao: descricao || 'Usuário fez logout do sistema'
    })
  }

  // Buscar atividades com filtros e paginação
  static async buscarAtividades(filtros?: {
    entidade_tipo?: string
    entidade_id?: string
    usuario_id?: string
    acao?: string
    search?: string
    page?: number
    limit?: number
    entityType?: string
    action?: string
  }): Promise<{ atividades: Atividade[], total: number }> {
    try {
      // Obter usuário atual e perfil para filtro multi-tenant
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id, role, admin_profile_id')
        .eq('id', currentUser.id)
        .single()

      if (!currentProfile) {
        throw new Error('Perfil não encontrado')
      }

      // Determinar o ID da empresa (admin_profile_id ou próprio ID se for admin)
      const adminId = currentProfile.admin_profile_id || currentProfile.id

      const page = filtros?.page || 1
      const limit = filtros?.limit || 20
      const offset = (page - 1) * limit

      let query = supabase
        .from('atividades')
        .select(`
          id,
          entidade_tipo,
          entidade_id,
          usuario_id,
          acao,
          descricao,
          dados_anteriores,
          dados_novos,
          metadata,
          profile,
          created_at
        `)
        .eq('profile', adminId)
        .order('created_at', { ascending: false })

      // Filtros de compatibilidade
      if (filtros?.entidade_tipo || filtros?.entityType) {
        query = query.eq('entidade_tipo', filtros.entidade_tipo || filtros.entityType)
      }
      if (filtros?.entidade_id) {
        query = query.eq('entidade_id', filtros.entidade_id)
      }
      if (filtros?.usuario_id) {
        query = query.eq('usuario_id', filtros.usuario_id)
      }
      if (filtros?.acao || filtros?.action) {
        query = query.eq('acao', filtros.acao || filtros.action)
      }
      
      // Busca por texto
      if (filtros?.search) {
        query = query.ilike('descricao', `%${filtros.search}%`)
      }

      // Contar total de registros
      let countQuery = supabase
        .from('atividades')
        .select('id', { count: 'exact', head: true })
        .eq('profile', adminId)

      if (filtros?.entidade_tipo || filtros?.entityType) {
        countQuery = countQuery.eq('entidade_tipo', filtros.entidade_tipo || filtros.entityType)
      }
      if (filtros?.entidade_id) {
        countQuery = countQuery.eq('entidade_id', filtros.entidade_id)
      }
      if (filtros?.usuario_id) {
        countQuery = countQuery.eq('usuario_id', filtros.usuario_id)
      }
      if (filtros?.acao || filtros?.action) {
        countQuery = countQuery.eq('acao', filtros.acao || filtros.action)
      }
      if (filtros?.search) {
        countQuery = countQuery.ilike('descricao', `%${filtros.search}%`)
      }

      // Executar consultas
      const [{ data, error }, { count, error: countError }] = await Promise.all([
        query.range(offset, offset + limit - 1),
        countQuery
      ])

      if (error) {
        console.error('Erro ao buscar atividades:', error)
        return { atividades: [], total: 0 }
      }

      if (countError) {
        console.error('Erro ao contar atividades:', countError)
      }

      return { 
        atividades: data || [], 
        total: count || 0 
      }
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
      return { atividades: [], total: 0 }
    }
  }

  // Método de compatibilidade para retornar apenas array
  static async buscarAtividadesSimples(filtros?: {
    entidade_tipo?: string
    entidade_id?: string
    usuario_id?: string
    acao?: string
    limit?: number
  }): Promise<Atividade[]> {
    const result = await this.buscarAtividades(filtros)
    return result.atividades
  }

  // Resolver nomes de usuários e entidades
  static async resolverNomes(atividades: Atividade[]): Promise<Atividade[]> {
    try {
      // Coletar IDs únicos
      const usuarioIds = [...new Set(atividades.map(a => a.usuario_id).filter(Boolean))]
      const entidadeIds = [...new Set(atividades.map(a => a.entidade_id).filter(Boolean))]
      
      // Buscar nomes de usuários
      const usuariosMap = new Map<string, string>()
      if (usuarioIds.length > 0) {
        // Primeiro tentar buscar em profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', usuarioIds)
        
        profiles?.forEach((profile: any) => {
          const nome = profile.nome || profile.email || 'Usuário'
          usuariosMap.set(profile.id, nome)
        })
        
        // Para IDs não encontrados, tentar buscar em vendedores
        const idsNaoEncontrados = usuarioIds.filter(id => !usuariosMap.has(id))
        if (idsNaoEncontrados.length > 0) {
          const { data: vendedores } = await supabase
            .from('vendedores')
            .select('user_id, nome, email')
            .in('user_id', idsNaoEncontrados)
          
          vendedores?.forEach((vendedor: any) => {
            if (vendedor.user_id) {
              const nome = vendedor.nome || vendedor.email || 'Vendedor'
              usuariosMap.set(vendedor.user_id, nome)
            }
          })
        }
      }

      // Buscar nomes de entidades organizando por tipo primeiro
      const entidadesMap = new Map<string, string>()
      
      if (entidadeIds.length > 0) {
        // Agrupar entidades por tipo
        const entidadesPorTipo = atividades.reduce((acc, atividade) => {
          if (entidadeIds.includes(atividade.entidade_id)) {
            if (!acc[atividade.entidade_tipo]) {
              acc[atividade.entidade_tipo] = new Set()
            }
            acc[atividade.entidade_tipo].add(atividade.entidade_id)
          }
          return acc
        }, {} as Record<string, Set<string>>)

        // Buscar nomes para cada tipo específico primeiro
        for (const [tipo, ids] of Object.entries(entidadesPorTipo)) {
          const idsArray = Array.from(ids)
          let tableName = ''
          let nameField = 'nome'

          switch (tipo) {
            case 'cliente':
              tableName = 'clientes'
              break
            case 'produto':
              tableName = 'produtos'
              break
            case 'proposta':
              tableName = 'propostas'
              nameField = 'titulo'
              break
            case 'vendedor':
              tableName = 'vendedores'
              break
            case 'arquivo':
              tableName = 'arquivos'
              nameField = 'nome_arquivo'
              break
            case 'agendamento':
              tableName = 'agendamentos'
              nameField = 'titulo'
              break
            case 'categoria':
              tableName = 'categorias'
              break
            case 'segmento':
              tableName = 'segmentos'
              break
            case 'auth':
              // Para auth, buscar em profiles
              tableName = 'profiles'
              nameField = 'nome'
              break
            default:
              continue
          }

          if (tableName && idsArray.length > 0) {
            const selectFields = nameField === 'nome' && tableName === 'profiles' 
              ? 'id, nome, email' 
              : `id, ${nameField}`
              
            const { data: entidades } = await supabase
              .from(tableName)
              .select(selectFields)
              .in('id', idsArray)

            entidades?.forEach((entidade: any) => {
              let nome = entidade[nameField]
              if (tableName === 'profiles' && !nome) {
                nome = entidade.email
              }
              entidadesMap.set(entidade.id, nome || `${getEntityTypeLabel(tipo)}`)
            })
          }
        }

        // Buscar IDs não encontrados em profiles como fallback
        const idsNaoEncontrados = entidadeIds.filter(id => !entidadesMap.has(id))
        if (idsNaoEncontrados.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nome, email')
            .in('id', idsNaoEncontrados)
          
          profiles?.forEach((profile: any) => {
            entidadesMap.set(profile.id, profile.nome || profile.email || 'Usuário')
          })
        }
      }

      // Aplicar nomes resolvidos
      return atividades.map(atividade => ({
        ...atividade,
        usuario_nome: usuariosMap.get(atividade.usuario_id) || 'Sistema',
        entidade_nome: atividade.entidade_tipo === 'auth' 
          ? 'Sistema' 
          : entidadesMap.get(atividade.entidade_id) || `${getEntityTypeLabel(atividade.entidade_tipo)} não encontrado`
      }))

    } catch (error) {
      console.error('Erro ao resolver nomes:', error)
      return atividades.map(atividade => ({
        ...atividade,
        usuario_nome: 'Sistema',
        entidade_nome: `${atividade.entidade_tipo} (${atividade.entidade_id.slice(0, 8)}...)`
      }))
    }
  }
}

// Hook para usar o serviço de atividades
export const useAtividades = () => {
  return {
    registrar: AtividadeService.registrar,
    criar: AtividadeService.criar,
    editar: AtividadeService.editar,
    deletar: AtividadeService.deletar,
    enviar: AtividadeService.enviar,
    aprovar: AtividadeService.aprovar,
    upload: AtividadeService.upload,
    download: AtividadeService.download,
    login: AtividadeService.login,
    logout: AtividadeService.logout,
    buscar: AtividadeService.buscarAtividades,
    buscarSimples: AtividadeService.buscarAtividadesSimples
  }
}
