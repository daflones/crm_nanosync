import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      throw new Error('O ID do usuário é obrigatório.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // A lógica de deletar o registro da tabela 'vendedores' e 'profiles' 
    // deve ser mantida no frontend ou movida para cá, mas a exclusão do 
    // usuário de autenticação é a operação crítica que precisa de privilégios de admin.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      // Não lançar erro se o usuário já foi deletado, por exemplo.
      console.warn(`Aviso ao deletar usuário do auth: ${authError.message}`)
    }

    return new Response(JSON.stringify({ message: 'Usuário de autenticação deletado com sucesso ou já não existia.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
