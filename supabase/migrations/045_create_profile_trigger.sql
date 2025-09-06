-- Trigger para criar perfil automaticamente após confirmação de email
-- Este trigger será executado quando o usuário confirmar o email

-- Função para criar perfil após confirmação de email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Só criar perfil se o email foi confirmado
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      status,
      admin_profile_id,
      preferences,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'admin',
      'ativo',
      NULL, -- Admin não tem admin_profile_id
      jsonb_build_object(
        'theme', 'light',
        'notifications', jsonb_build_object(
          'email', true,
          'push', true,
          'sound', true
        ),
        'dashboard', jsonb_build_object(
          'layout', 'default',
          'widgets', '[]'::jsonb
        ),
        'sounds', jsonb_build_object(
          'enabled', true,
          'volume', 0.5
        )
      ),
      NOW(),
      NOW()
    );
    
    -- Depois atualizar admin_profile_id para o próprio ID
    UPDATE public.profiles 
    SET admin_profile_id = NEW.id,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Garantir que a função pode ser executada
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
