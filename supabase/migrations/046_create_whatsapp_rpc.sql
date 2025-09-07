-- Função RPC otimizada para atualizar instância WhatsApp
CREATE OR REPLACE FUNCTION update_whatsapp_instance(
  user_id UUID,
  instance_name TEXT,
  instance_id TEXT,
  status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Buscar o admin_profile_id ou usar o próprio user_id se for admin
  SELECT COALESCE(admin_profile_id, id) INTO admin_id
  FROM profiles 
  WHERE id = user_id;
  
  -- Se não encontrou o perfil, retornar erro
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado para o usuário %', user_id;
  END IF;
  
  -- Atualizar os dados da instância WhatsApp
  UPDATE profiles 
  SET 
    instancia_whatsapp = instance_name,
    whatsapp_status = status,
    whatsapp_instance_id = instance_id,
    whatsapp_connected_at = CASE 
      WHEN status = 'open' THEN NOW() 
      ELSE NULL 
    END,
    updated_at = NOW()
  WHERE id = admin_id;
  
  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Não foi possível atualizar o perfil do admin %', admin_id;
  END IF;
END;
$$;

-- Dar permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION update_whatsapp_instance(UUID, TEXT, TEXT, TEXT) TO authenticated;
