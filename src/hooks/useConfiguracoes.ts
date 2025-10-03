import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getConfiguracoes, 
  upsertConfiguracoes, 
  updateProfile, 
  getProfile,
  changePassword,
  verifyCurrentPassword,
  testEmailConfig,
  type Configuracoes 
} from '../services/api/configuracoes'
import { updateDetalhesEmpresa, type IAConfig } from '../services/api/ia-config'
import { useAuthStore } from '@/stores/authStore'

// Query keys
const QUERY_KEYS = {
  configuracoes: (userId: string) => ['configuracoes', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
}

// Hook para buscar configurações do usuário
export const useConfiguracoes = () => {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: QUERY_KEYS.configuracoes(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      const result = await getConfiguracoes(user.id)
      if (result.error) throw result.error
      return result.data
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook para buscar perfil do usuário
export const useProfile = () => {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: QUERY_KEYS.profile(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      const result = await getProfile(user.id)
      if (result.error) throw result.error
      return result.data
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook para atualizar configurações
export const useUpdateConfiguracoes = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (configuracoes: Partial<Configuracoes>) => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      const result = await upsertConfiguracoes(user.id, configuracoes)
      if (result.error) throw result.error
      return result.data
    },
    onSuccess: (data) => {
      if (user?.id) {
        queryClient.setQueryData(QUERY_KEYS.configuracoes(user.id), data)
      }
      toast.success('Configurações atualizadas com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao atualizar configurações:', error)
      toast.error('Erro ao atualizar configurações')
    },
  })
}

// Hook para atualizar perfil
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (profileData: any) => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      const result = await updateProfile(user.id, profileData)
      if (result.error) throw result.error
      return result.data
    },
    onSuccess: (data) => {
      if (user?.id) {
        queryClient.setQueryData(QUERY_KEYS.profile(user.id), data)
      }
      toast.success('Perfil atualizado com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil')
    },
  })
}

// Hook para alterar senha
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword, email }: {
      currentPassword: string
      newPassword: string
      email: string
    }) => {
      // Primeiro verificar a senha atual
      const verifyResult = await verifyCurrentPassword(email, currentPassword)
      if (!verifyResult.isValid) {
        throw new Error('Senha atual incorreta')
      }
      
      // Se a verificação passou, alterar a senha
      const changeResult = await changePassword(newPassword)
      if (changeResult.error) throw changeResult.error
      
      return changeResult
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao alterar senha:', error)
      toast.error(error.message || 'Erro ao alterar senha')
    },
  })
}

// Hook para testar configurações de email
export const useTestEmailConfig = () => {
  return useMutation({
    mutationFn: testEmailConfig,
    onSuccess: (result: any) => {
      toast.success(result.message || 'Teste de email realizado com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao testar email:', error)
      toast.error('Erro ao testar configurações de email')
    },
  })
}

// Hook para toggle de configuração individual
export const useToggleConfig = () => {
  const updateConfiguracoes = useUpdateConfiguracoes()
  const { data: configuracoes } = useConfiguracoes()

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (!configuracoes) throw new Error('Configurações não carregadas')
      
      const newConfig = { ...configuracoes, [key]: value }
      
      // Lógica especial para tema
      if (key === 'tema') {
        const theme = value ? 'dark' : 'light'
        newConfig.tema = theme
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }
      
      return updateConfiguracoes.mutateAsync(newConfig)
    },
    onSuccess: () => {
      // Success já é tratado pelo updateConfiguracoes
    },
    onError: (error) => {
      console.error('Erro ao alterar configuração:', error)
      toast.error('Erro ao alterar configuração')
    },
  })
}

// Hook para atualizar detalhes da empresa
export const useUpdateDetalhesEmpresa = () => {
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (detalhes: Partial<IAConfig['detalhes_empresa']>) => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      const result = await updateDetalhesEmpresa(user.id, detalhes)
      if (result.error) throw result.error
      return result.data
    },
    onSuccess: () => {
      toast.success('Detalhes da empresa atualizados com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao atualizar detalhes da empresa:', error)
      toast.error('Erro ao atualizar detalhes da empresa')
    },
  })
}

// Hook combinado para facilitar o uso
export const useConfiguracoesActions = () => {
  return {
    updateConfiguracoes: useUpdateConfiguracoes(),
    updateProfile: useUpdateProfile(),
    changePassword: useChangePassword(),
    testEmailConfig: useTestEmailConfig(),
    toggleConfig: useToggleConfig(),
    updateDetalhesEmpresa: useUpdateDetalhesEmpresa(),
  }
}
