import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { whatsappService } from '@/services/api/whatsapp'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useWhatsAppInstance() {
  return useQuery({
    queryKey: ['whatsapp', 'instance'],
    queryFn: whatsappService.getInstanceFromProfile,
    staleTime: 5000, // 5 segundos para detectar mudanças mais rápido
    refetchInterval: 10000, // Refetch a cada 10 segundos
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
    refetchOnMount: true, // Sempre refetch ao montar
  })
}

export function useCreateWhatsAppInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ instanceName, number }: { instanceName: string; number: string }) => {
      // Verificar se já existe instância
      const existingInstance = await whatsappService.getInstanceFromProfile()
      if (existingInstance?.instanceName) {
        throw new Error('Já existe uma instância WhatsApp configurada para esta empresa')
      }

      // 1. Criar instância na Evolution API
      const response = await whatsappService.createInstance(instanceName, number)
      
      // 2. Salvar no Supabase imediatamente
      await whatsappService.saveInstanceToProfile({
        instanceName: response.instance.instanceName,
        instanceId: response.instance.instanceId,
        status: 'connecting' // Status inicial
      })
      
      return response
    },
    onSuccess: async () => {
      // Invalidar queries para refletir mudanças
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] })
      toast.success('Instância WhatsApp criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar instância: ${error.message}`)
    }
  })
}

export function useWhatsAppStatus(instanceName?: string, shouldPoll: boolean = false) {
  return useQuery({
    queryKey: ['whatsapp', 'status', instanceName],
    queryFn: async () => {
      if (!instanceName) return null
      
      // Primeiro, verificar status no Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, admin_profile_id')
          .eq('id', user.id)
          .single()

        if (profile) {
          const adminId = profile.admin_profile_id || profile.id
          
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('whatsapp_status')
            .eq('id', adminId)
            .single()
          
          // Se já está conectado no Supabase, não precisa fazer fetch da Evolution
          if (adminProfile?.whatsapp_status === 'open') {
            return {
              instanceName,
              status: 'open',
              owner: null, // Será obtido da Evolution API se necessário
              profileName: null // Será obtido da Evolution API se necessário
            }
          }
        }
      }
      
      // Só fazer fetch da Evolution se shouldPoll for true (quando criando instância)
      if (!shouldPoll) {
        return {
          instanceName,
          status: 'connecting',
          owner: null,
          profileName: null
        }
      }
      
      try {
        const instance = await whatsappService.getInstanceByName(instanceName)
        
        // Se detectou que conectou (status = 'open'), atualizar Supabase
        if (instance && instance.status === 'open' && instance.owner) {
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, admin_profile_id')
              .eq('id', user.id)
              .single()

            if (profile) {
              const adminId = profile.admin_profile_id || profile.id
              
              const updateData = {
                whatsapp_status: 'open',
                whatsapp_connected_at: new Date().toISOString()
              }
              
              const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', adminId)
              
              if (!error) {
                // Recarregar página após conectar
                setTimeout(() => {
                  window.location.reload()
                }, 1000)
              }
            }
          }
        }
        
        return instance
      } catch (error) {
        return null
      }
    },
    enabled: !!instanceName,
    refetchInterval: shouldPoll ? (data: any) => {
      // Parar polling quando conectado
      if (data?.status === 'open') {
        return false // Para o polling
      }
      return 5000 // 5 segundos (reduzido de 2s)
    } : false, // Não fazer polling se shouldPoll for false
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  })
}

export function useWhatsAppQRCode(instanceName?: string, status?: string) {
  return useQuery({
    queryKey: ['whatsapp', 'qrcode', instanceName],
    queryFn: async () => {
      if (!instanceName) return null
      return await whatsappService.getQRCode(instanceName)
    },
    enabled: !!instanceName && status !== 'open', // Não buscar QR code se já estiver conectado
    refetchInterval: () => {
      // Se conectado, parar de fazer refetch
      return status === 'open' ? false : 30000
    },
    retry: 1, // Reduzir tentativas
    staleTime: 10000 // Cache por 10 segundos
  })
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient()
  const { refreshAfterMutation } = useAutoRefresh()

  return useMutation({
    mutationFn: async (instanceName: string) => {
      // Fazer logout da instância
      await whatsappService.logoutInstance(instanceName)
      
      // Limpar dados do perfil
      await whatsappService.clearInstanceFromProfile()
    },
    onSuccess: async () => {
      await refreshAfterMutation('whatsapp', 'delete')
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] })
      toast.success('WhatsApp desconectado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desconectar: ${error.message}`)
    }
  })
}

export function useDeleteWhatsAppInstance() {
  return useMutation({
    mutationFn: async (instanceName: string) => {
      console.log('Iniciando processo de remoção da instância:', instanceName)
      
      // 1. Deletar registro do Supabase primeiro
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, admin_profile_id')
          .eq('id', user.id)
          .single()

        if (profile) {
          const adminId = profile.admin_profile_id || profile.id
          
          const { error } = await supabase
            .from('profiles')
            .update({
              instancia_whatsapp: null,
              whatsapp_status: null,
              whatsapp_instance_id: null,
              whatsapp_connected_at: null
            })
            .eq('id', adminId)
            
          if (error) throw new Error('Erro ao limpar dados do Supabase')
          console.log('✅ Dados removidos do Supabase')
        }
      }
      
      // 2. Deletar instância da Evolution API
      await whatsappService.deleteInstance(instanceName)
      console.log('✅ Instância removida da Evolution API')
      
      // 3. Verificar se foi realmente deletada
      const instance = await whatsappService.getInstanceByName(instanceName)
      if (instance) {
        throw new Error('Instância não foi deletada corretamente')
      }
      
      return true
    },
    onSuccess: async () => {
      toast.success('Instância WhatsApp removida com sucesso!')
      console.log('🔄 Recarregando página...')
      
      // Recarregar página após deletar
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover instância: ${error.message}`)
    }
  })
}
