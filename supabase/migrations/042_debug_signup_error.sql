-- Verificar e temporariamente desabilitar triggers que podem estar causando erro 500 no signup

-- 1. Listar todos os triggers na tabela profiles
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'profiles'
    LOOP
        RAISE NOTICE 'Trigger encontrado: % - Evento: % - Ação: %', 
            trigger_record.trigger_name, 
            trigger_record.event_manipulation, 
            trigger_record.action_statement;
    END LOOP;
END $$;

-- 2. Temporariamente desabilitar trigger de handle_new_user se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Criar função simples para handle_new_user que não falha
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Função vazia temporariamente para evitar erros
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verificar se existem políticas RLS muito restritivas
DO $$
BEGIN
    -- Temporariamente permitir INSERT para usuários autenticados
    DROP POLICY IF EXISTS "Users can create profiles" ON profiles;
    
    CREATE POLICY "Users can create profiles" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
        
    RAISE NOTICE 'Política de INSERT atualizada para profiles';
END $$;

-- 5. Verificar constraints que podem estar falhando
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' AND constraint_type IN ('CHECK', 'FOREIGN KEY')
    LOOP
        RAISE NOTICE 'Constraint encontrada: % - Tipo: %', 
            constraint_record.constraint_name, 
            constraint_record.constraint_type;
    END LOOP;
END $$;
