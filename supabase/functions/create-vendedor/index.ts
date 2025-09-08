import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge Function `create-vendedor` iniciada.');
    const { vendedorData, adminId } = await req.json();
    console.log('Payload recebido:', { vendedorData, adminId });

    if (!vendedorData || !adminId) {
      throw new Error('Dados do vendedor e ID do admin são obrigatórios.')
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: vendedorData.email,
      password: vendedorData.senha,
      email_confirm: true,
      user_metadata: {
        full_name: vendedorData.nome,
        role: 'vendedor',
      },
    })

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      throw authError;
    }
    const userId = authData.user.id;
    console.log('Usuário criado no Auth com sucesso. ID:', userId);

    // Step 2: Get admin's plan expiration date
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('plano_ativo, plano_expira_em')
      .eq('id', adminId)
      .single()

    if (adminError) {
      console.error('Erro ao buscar dados do admin:', adminError);
      throw adminError;
    }

    console.log('Dados do admin encontrados:', { 
      plano_ativo: adminProfile?.plano_ativo, 
      plano_expira_em: adminProfile?.plano_expira_em 
    });

    // Step 3: Update the profile that was auto-created by the trigger
    const profileUpdateData = {
      role: 'vendedor',
      status: 'ativo',
      admin_profile_id: adminId,
      plano_ativo: true, // Vendedores sempre têm plano ativo
      plano_expira_em: adminProfile?.plano_expira_em || null, // Herda a expiração do admin
    };

    console.log('Atualizando profile com dados:', profileUpdateData);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', userId)

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      throw profileError;
    }
    console.log('Perfil criado com sucesso com plano herdado do admin.');

    // Step 4: Create the vendedor record
    const { data: vendedorResult, error: vendedorError } = await supabaseAdmin
      .from('vendedores')
      .insert({
        ...vendedorData,
        user_id: userId,
        profile: adminId, // Company filter
        senha: undefined, // Do not store password in the table
      })
      .select()
      .single()

    if (vendedorError) {
      console.error('Erro ao inserir na tabela de vendedores:', vendedorError);
      throw vendedorError;
    }
    console.log('Registro de vendedor criado com sucesso.');

    // Step 5: Update the profile with the new vendedor_id
    const { error: updateProfileError } = await supabaseAdmin.from('profiles').update({ vendedor_id: vendedorResult.id }).eq('id', userId);
    if (updateProfileError) {
      // Log as a warning, as this is not a critical failure
      console.warn('Aviso: falha ao atualizar o perfil com o vendedor_id:', updateProfileError);
    } else {
      console.log('Perfil atualizado com vendedor_id.');
    }

    return new Response(JSON.stringify({ 
      message: 'Vendedor criado com sucesso',
      vendedor: vendedorResult 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro fatal na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
