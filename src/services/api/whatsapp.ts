import { supabase } from '@/lib/supabase'

export interface WhatsAppInstance {
  instanceName: string
  instanceId: string
  status: 'created' | 'connecting' | 'open' | 'close' | 'disconnected'
  qrcode?: string
  apikey?: string
}

export interface CreateInstanceRequest {
  instanceName: string
  number: string
}

export interface CreateInstanceResponse {
  instance: {
    instanceName: string
    instanceId: string
    status: string
  }
  hash: {
    apikey: string
  }
  qrcode?: {
    code: string
    base64: string
  }
}

export interface ConnectionStatus {
  instance: string
  state: 'open' | 'close' | 'connecting'
}

class WhatsAppService {
  private baseUrl: string
  private apiKey: string
  private webhookUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_EVOLUTION_API_URL || ''
    this.apiKey = import.meta.env.VITE_EVOLUTION_API_KEY || ''
    this.webhookUrl = 'https://n8n.agenciagvcompany.com.br/webhook/crmnanosync'
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Evolution API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async createInstance(instanceName: string, number: string): Promise<CreateInstanceResponse> {
    const payload = {
      instanceName,
      number,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: this.webhookUrl,
        byEvents: false,
        base64: true,
        events: ['MESSAGES_UPSERT']
      },
      // Configurações padrão
      rejectCall: true,
      msgCall: 'Chamadas não são aceitas neste número.',
      groupsIgnore: true,
      alwaysOnline: true,
      readMessages: true,
      readStatus: false,
      syncFullHistory: false
    }

    return this.makeRequest('/instance/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }


  async getInstanceStatus(instanceName: string): Promise<any> {
    return this.makeRequest(`/instance/connectionState/${instanceName}`)
  }

  async fetchInstances(): Promise<any[]> {
    const result = await this.makeRequest('/instance/fetchInstances')
    return result || []
  }

  async getInstanceByName(instanceName: string): Promise<any | null> {
    const instances = await this.fetchInstances()
    const instance = instances.find((inst: any) => inst.name === instanceName)
    
    // Normalizar a estrutura da resposta para compatibilidade
    if (instance) {
      return {
        instanceName: instance.name,
        instanceId: instance.id,
        status: instance.connectionStatus,
        owner: instance.ownerJid,
        profileName: instance.profileName,
        profilePictureUrl: instance.profilePictureUrl,
        profileStatus: instance.profileStatus
      }
    }
    
    return null
  }

  async getQRCode(instanceName: string): Promise<{ code: string; pairingCode: string; count: number; base64: string }> {
    const result = await this.makeRequest(`/instance/connect/${instanceName}`)
    return result
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/delete/${instanceName}`, {
      method: 'DELETE'
    })
  }

  async logoutInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/logout/${instanceName}`, {
      method: 'DELETE'
    })
  }

  // Salvar dados da instância no Supabase
  async saveInstanceToProfile(instanceData: {
    instanceName: string
    instanceId: string
    status: string
    apikey?: string
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, admin_profile_id')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Perfil não encontrado')

    const adminId = profile.admin_profile_id || profile.id

    const { error } = await supabase
      .from('profiles')
      .update({
        instancia_whatsapp: instanceData.instanceName,
        whatsapp_status: instanceData.status,
        whatsapp_instance_id: instanceData.instanceId,
        whatsapp_connected_at: instanceData.status === 'open' ? new Date().toISOString() : null
      })
      .eq('id', adminId)

    if (error) throw error
  }


  // Buscar dados da instância do perfil
  async getInstanceFromProfile(): Promise<{
    instanceName: string | null
    status: string | null
    instanceId: string | null
    connectedAt: string | null
  } | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, admin_profile_id, instancia_whatsapp, whatsapp_status, whatsapp_instance_id, whatsapp_connected_at')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Perfil não encontrado')

    const adminId = profile.admin_profile_id || profile.id

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('instancia_whatsapp, whatsapp_status, whatsapp_instance_id, whatsapp_connected_at')
      .eq('id', adminId)
      .single()

    // Se não há instância configurada, retornar null
    if (!adminProfile?.instancia_whatsapp) {
      return null
    }

    return {
      instanceName: adminProfile.instancia_whatsapp,
      status: adminProfile.whatsapp_status || null,
      instanceId: adminProfile.whatsapp_instance_id || null,
      connectedAt: adminProfile.whatsapp_connected_at || null
    }
  }

  // Limpar dados da instância do perfil
  async clearInstanceFromProfile(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, admin_profile_id')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Perfil não encontrado')

    const adminId = profile.admin_profile_id || profile.id

    const { error } = await supabase
      .from('profiles')
      .update({
        instancia_whatsapp: null,
        whatsapp_status: 'disconnected',
        whatsapp_instance_id: null,
        whatsapp_connected_at: null
      })
      .eq('id', adminId)

    if (error) throw error
  }
}

export const whatsappService = new WhatsAppService()
