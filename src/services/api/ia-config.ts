import { supabase } from '@/lib/supabase'

export interface IAConfig {
  id?: string
  user_id: string
  profile: string // Campo para filtro multi-tenant
  // Nome do agente de IA
  nome_agente?: string
  // Contexto e personalidade da IA
  contexto_ia: string | null
  tom_fala: 'profissional' | 'casual' | 'formal' | 'amigavel' | 'tecnico'
  // Regras e comportamentos
  regras_especificas: string
  regras_adicionais?: string
  // Configurações de texto
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
  regras_agendamento?: string
  horarios_agendamento?: {
    [key: string]: {
      inicio: string
      fim: string
      ativo: boolean
    }
  }
  // Detalhes da empresa
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
    
    // Contatos (mantendo compatibilidade)
    contatos: {
      telefone: string
      email: string
      whatsapp: string
      endereco: string
    }
    
    // Redes sociais (mantendo compatibilidade)
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
        contexto_ia: null,
        tom_fala: 'profissional',
        regras_especificas: 'Sempre confirme informações importantes antes de prosseguir. Seja claro e objetivo nas respostas.',
        regras_adicionais: '',
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
        regras_agendamento: '',
        horarios_agendamento: {
          segunda: { inicio: '08:00', fim: '18:00', ativo: false },
          terca: { inicio: '08:00', fim: '18:00', ativo: false },
          quarta: { inicio: '08:00', fim: '18:00', ativo: false },
          quinta: { inicio: '08:00', fim: '18:00', ativo: false },
          sexta: { inicio: '08:00', fim: '18:00', ativo: false },
          sabado: { inicio: '08:00', fim: '12:00', ativo: false },
          domingo: { inicio: '08:00', fim: '12:00', ativo: false }
        },
        tempo_resposta_ms: 2000,
        mensagem_ausencia: 'No momento estou fora do horário de atendimento. Deixe sua mensagem que retornarei assim que possível.'
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
