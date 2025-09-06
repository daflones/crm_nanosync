import { supabase } from '@/lib/supabase'

export interface BaseEntity {
  id: string
  profile: string // Campo que identifica a empresa
  created_at: string
  updated_at: string
}

export class BaseService {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  /**
   * Obtém o profile_id da empresa atual do usuário logado
   */
  protected async getCurrentUserCompanyProfileId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, admin_profile_id')
      .eq('id', user.id)
      .single()

    if (!profile) return null

    // Se é admin da empresa (admin_profile_id = próprio ID), retorna seu próprio ID
    if (profile.role === 'admin' && profile.admin_profile_id === profile.id) {
      return profile.id
    }

    // Se é vendedor ou admin subordinado, retorna o admin_profile_id
    return profile.admin_profile_id
  }

  /**
   * Verifica se o usuário é superadmin
   */
  protected async isSuperAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return profile?.role === 'superadmin'
  }

  /**
   * Aplica filtro de empresa automaticamente nas consultas
   */
  protected async applyCompanyFilter(query: any) {
    const isSuperAdmin = await this.isSuperAdmin()
    
    // Superadmin pode ver todos os dados
    if (isSuperAdmin) {
      return query
    }

    // Outros usuários só veem dados da sua empresa
    const companyProfileId = await this.getCurrentUserCompanyProfileId()
    if (!companyProfileId) {
      throw new Error('Usuário não possui empresa associada')
    }

    return query.eq('profile', companyProfileId)
  }

  /**
   * Lista todos os registros da empresa
   */
  async findAll(select = '*') {
    let query = supabase.from(this.tableName).select(select)
    query = await this.applyCompanyFilter(query)
    return query
  }

  /**
   * Busca um registro por ID (com filtro de empresa)
   */
  async findById(id: string, select = '*') {
    let query = supabase.from(this.tableName).select(select).eq('id', id)
    query = await this.applyCompanyFilter(query)
    return query.single()
  }

  /**
   * Cria um novo registro com o profile da empresa automaticamente
   */
  async create(data: Omit<any, 'id' | 'profile' | 'created_at' | 'updated_at'>) {
    const companyProfileId = await this.getCurrentUserCompanyProfileId()
    if (!companyProfileId) {
      throw new Error('Usuário não possui empresa associada')
    }

    return supabase.from(this.tableName).insert({
      ...data,
      profile: companyProfileId
    }).select().single()
  }

  /**
   * Atualiza um registro (com verificação de empresa)
   */
  async update(id: string, data: Partial<any>) {
    let query = supabase.from(this.tableName).update(data).eq('id', id)
    query = await this.applyCompanyFilter(query)
    return query.select().single()
  }

  /**
   * Deleta um registro (com verificação de empresa)
   */
  async delete(id: string) {
    let query = supabase.from(this.tableName).delete().eq('id', id)
    query = await this.applyCompanyFilter(query)
    return query
  }

  /**
   * Conta registros da empresa
   */
  async count() {
    let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
    query = await this.applyCompanyFilter(query)
    return query
  }
}
