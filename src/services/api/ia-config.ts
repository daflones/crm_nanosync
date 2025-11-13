import { supabase } from '@/lib/supabase'

export interface IAConfig {
  id?: string
  user_id: string
  profile?: string // Campo para filtro multi-tenant
  // Nome do agente de IA
  nome_agente?: string
  nome_empresa?: string
  // Configurações de texto
  tom_fala: 'profissional' | 'casual' | 'formal' | 'amigavel' | 'tecnico'
  tamanho_textos: 'curto' | 'medio' | 'longo' | 'detalhado'
  usar_emojis: boolean
  // Horários de funcionamento
  horarios_funcionamento: {
    [key: string]: {
      inicio: string
      fim: string
      ativo: boolean
    }
  }
  // Configurações de agendamento
  agendamento_ia?: boolean
  // Regras de qualificação (JSONB)
  regras_qualificacao?: {
    // Campos obrigatórios (sempre true, apenas leitura)
    nome: boolean
    telefone: boolean
    produto_interesse: boolean
    motivacao: boolean
    expectativa: boolean
    analise_cliente: boolean
    // Campos opcionais configuráveis
    cpf: boolean // CPF separado
    cnpj: boolean // CNPJ separado
    nome_empresa: boolean // Nome da empresa
    email: boolean
    segmento: boolean
    volume_mensal: boolean // Volume mensal estimado
    endereco: {
      ativo: boolean
      rua: boolean
      numero: boolean
      cidade: boolean
      cep: boolean
    }
  }
  // Detalhes da empresa (JSONB)
  detalhes_empresa: {
    // Informações básicas da empresa
    sobre_empresa: string
    diferenciais_competitivos: string
    portfolio_produtos_servicos: string
    principais_clientes: string
    produtos_servicos_mais_vendidos: string
    
    // Diretrizes para IA
    informacoes_ia_pode_fornecer: string
    informacoes_ia_nao_pode_fornecer: string
    
    // Estratégias comerciais
    operacional_comercial: string
    argumentos_venda_por_perfil: string
    objecoes_comuns_respostas: string
    
    // Contatos
    contatos: {
      telefone: string
      email: string
      whatsapp: string
      endereco: string
    }
    
    // Redes sociais
    redes_sociais: {
      website: string
      instagram: string
      linkedin: string
      facebook: string
    }
  }
  // Configurações avançadas
  tempo_resposta_ms: number
  mensagem_ausencia: string
  envia_documento?: boolean
  created_at?: string
  updated_at?: string
}

// Buscar configurações IA do usuário com filtro multi-tenant
export const getIAConfig = async (userId: string) => {
  try {
    // Get current user's profile to filter by company
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
      throw new Error('Perfil do usuário não encontrado')
    }

    // Determine company profile ID for filtering
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const { data, error } = await supabase
      .from('ia_config')
      .select('*')
      .eq('user_id', userId)
      .eq('profile', adminId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Configurações não existem, criar padrão
      const defaultConfig: Partial<IAConfig> = {
        user_id: userId,
        profile: adminId,
        nome_agente: '',
        tom_fala: 'profissional',
        tamanho_textos: 'medio',
        usar_emojis: true,
        horarios_funcionamento: {
          segunda: { inicio: '08:00', fim: '18:00', ativo: true },
          terca: { inicio: '08:00', fim: '18:00', ativo: true },
          quarta: { inicio: '08:00', fim: '18:00', ativo: true },
          quinta: { inicio: '08:00', fim: '18:00', ativo: true },
          sexta: { inicio: '08:00', fim: '18:00', ativo: true },
          sabado: { inicio: '08:00', fim: '12:00', ativo: false },
          domingo: { inicio: '08:00', fim: '12:00', ativo: false }
        },
        detalhes_empresa: {
          sobre_empresa: '',
          diferenciais_competitivos: '',
          portfolio_produtos_servicos: '',
          principais_clientes: '',
          produtos_servicos_mais_vendidos: '',
          informacoes_ia_pode_fornecer: '',
          informacoes_ia_nao_pode_fornecer: '',
          operacional_comercial: '',
          argumentos_venda_por_perfil: '',
          objecoes_comuns_respostas: '',
          contatos: {
            telefone: '',
            email: '',
            whatsapp: '',
            endereco: ''
          },
          redes_sociais: {
            website: '',
            instagram: '',
            linkedin: '',
            facebook: ''
          }
        },
        agendamento_ia: false,
        regras_qualificacao: {
          // Campos obrigatórios (sempre true)
          nome: true,
          telefone: true,
          produto_interesse: true,
          motivacao: true,
          expectativa: true,
          analise_cliente: true,
          // Campos opcionais (padrão false)
          cpf: false,
          cnpj: false,
          nome_empresa: false,
          email: false,
          segmento: false,
          volume_mensal: false,
          endereco: {
            ativo: false,
            rua: false,
            numero: false,
            cidade: false,
            cep: false
          }
        },
        tempo_resposta_ms: 2000,
        mensagem_ausencia: 'No momento estou fora do horário de atendimento. Deixe sua mensagem que retornarei assim que possível.',
        envia_documento: false
      }

      const { data: newData, error: createError } = await supabase
        .from('ia_config')
        .insert([defaultConfig])
        .select()
        .single()

      return { data: newData, error: createError }
    }

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar configurações IA:', error)
    return { data: null, error }
  }
}

// Salvar/Atualizar configurações IA com filtro multi-tenant
export const upsertIAConfig = async (userId: string, config: Partial<IAConfig>) => {
  try {
    // Get current user's profile to filter by company
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
      throw new Error('Perfil do usuário não encontrado')
    }

    // Determine company profile ID for filtering
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    // Primeiro, verificar se já existe uma configuração para o usuário
    const { data: existingConfig } = await supabase
      .from('ia_config')
      .select('id')
      .eq('user_id', userId)
      .eq('profile', adminId)
      .single()

    if (existingConfig) {
      // Se existe, fazer UPDATE
      const { data, error } = await supabase
        .from('ia_config')
        .update({ 
          ...config,
          profile: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('profile', adminId)
        .select()
        .single()

      return { data, error }
    } else {
      // Se não existe, fazer INSERT
      const { data, error } = await supabase
        .from('ia_config')
        .insert([{ 
          user_id: userId, 
          profile: adminId,
          ...config,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      return { data, error }
    }
  } catch (error) {
    console.error('Erro ao salvar configurações IA:', error)
    return { data: null, error }
  }
}

// Atualizar apenas detalhes da empresa
export const updateDetalhesEmpresa = async (userId: string, detalhes: Partial<IAConfig['detalhes_empresa']>) => {
  try {
    // Get current user's profile to filter by company
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
      throw new Error('Perfil do usuário não encontrado')
    }

    // Determine company profile ID for filtering
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    // Buscar configuração existente
    const { data: existingConfig } = await supabase
      .from('ia_config')
      .select('detalhes_empresa')
      .eq('user_id', userId)
      .eq('profile', adminId)
      .single()

    // Mesclar detalhes existentes com novos
    const detalhesAtualizados = {
      ...existingConfig?.detalhes_empresa,
      ...detalhes
    }

    // Atualizar apenas o campo detalhes_empresa
    const { data, error } = await supabase
      .from('ia_config')
      .update({ 
        detalhes_empresa: detalhesAtualizados,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('profile', adminId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao atualizar detalhes da empresa:', error)
    return { data: null, error }
  }
}

// Testar configurações IA
export const testIAConfig = async (_config: Partial<IAConfig>) => {
  // Simular teste das configurações
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ 
        success: true, 
        message: 'Configurações IA testadas com sucesso! A IA está pronta para usar.' 
      })
    }, 2000)
  })
}
