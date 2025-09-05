-- CRITICAL: Apply this SQL script to your Supabase database to fix agendamento creation
-- Go to: https://rpydvmgnquvmwnowcmpp.supabase.co -> SQL Editor -> Paste and Execute

-- 1. Add user_id column to agendamentos table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agendamentos' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE agendamentos ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Drop and recreate all triggers that might reference data_agendamento
DROP TRIGGER IF EXISTS trigger_agendamento_mudanca ON agendamentos;
DROP FUNCTION IF EXISTS trigger_agendamento_mudanca();

-- 3. Create correct trigger function using data_inicio
CREATE OR REPLACE FUNCTION trigger_agendamento_mudanca()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            NEW.user_id,
            'agendamento_criado',
            'agendamento',
            'Novo Agendamento',
            'Agendamento criado: ' || NEW.titulo || ' - ' || NEW.data_inicio::date,
            NEW.id,
            'agendamento',
            'media',
            json_build_object(
                'titulo', NEW.titulo,
                'data_inicio', NEW.data_inicio,
                'cliente_id', NEW.cliente_id
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            NEW.user_id,
            'agendamento_atualizado',
            'agendamento',
            'Agendamento Atualizado',
            'Agendamento atualizado: ' || NEW.titulo || ' - ' || NEW.data_inicio::date,
            NEW.id,
            'agendamento',
            'media',
            json_build_object(
                'titulo', NEW.titulo,
                'data_inicio', NEW.data_inicio,
                'cliente_id', NEW.cliente_id
            )
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger
CREATE TRIGGER trigger_agendamento_mudanca
    AFTER INSERT OR UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION trigger_agendamento_mudanca();

-- 5. Drop existing RLS policies on agendamentos
DROP POLICY IF EXISTS "Admins can do everything on agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Vendedores can view own agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Vendedores can create agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Vendedores can update own agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Vendedores can delete own agendamentos" ON agendamentos;

-- 6. Create correct RLS policies
CREATE POLICY "Admins can do everything on agendamentos" ON agendamentos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Vendedores can view own agendamentos" ON agendamentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'vendedor' 
      AND (agendamentos.vendedor_id = p.vendedor_id OR agendamentos.user_id = auth.uid())
    )
  );

CREATE POLICY "Vendedores can create agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'vendedor'
    )
  );

CREATE POLICY "Vendedores can update own agendamentos" ON agendamentos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'vendedor' 
      AND (agendamentos.vendedor_id = p.vendedor_id OR agendamentos.user_id = auth.uid())
    )
  );

CREATE POLICY "Vendedores can delete own agendamentos" ON agendamentos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'vendedor' 
      AND (agendamentos.vendedor_id = p.vendedor_id OR agendamentos.user_id = auth.uid())
    )
  );

-- 7. Update cron job functions to use correct column names
CREATE OR REPLACE FUNCTION verificar_agendamentos_expirados()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT a.id, a.titulo, a.data_inicio, a.user_id, c.nome as cliente_nome, a.tipo
        FROM agendamentos a
        JOIN clientes c ON a.cliente_id = c.id
        WHERE a.data_inicio::date < CURRENT_DATE 
        AND a.status = 'agendado'
    LOOP
        UPDATE agendamentos 
        SET status = 'expirado', updated_at = NOW()
        WHERE id = rec.id;
        
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            rec.user_id,
            'agendamento_expirado',
            'agendamento',
            'Agendamento Expirado',
            'Agendamento com ' || rec.cliente_nome || ' expirou em ' || rec.data_inicio::date,
            rec.id,
            'agendamento',
            'alta',
            json_build_object(
                'cliente_nome', rec.cliente_nome,
                'data_inicio', rec.data_inicio,
                'tipo_agendamento', rec.tipo
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verificar_agendamentos_hoje()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT a.id, a.titulo, a.data_inicio, a.user_id, c.nome as cliente_nome
        FROM agendamentos a
        JOIN clientes c ON a.cliente_id = c.id
        WHERE a.data_inicio::date = CURRENT_DATE 
        AND a.status IN ('agendado', 'confirmado')
        AND NOT EXISTS (
            SELECT 1 FROM notificacoes n 
            WHERE n.referencia_id = a.id 
            AND n.tipo = 'agendamento_hoje'
            AND n.created_at::date = CURRENT_DATE
        )
    LOOP
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            rec.user_id,
            'agendamento_hoje',
            'agendamento',
            'Agendamento Hoje',
            'Agendamento com ' || rec.cliente_nome || ' hoje às ' || EXTRACT(HOUR FROM rec.data_inicio) || ':' || LPAD(EXTRACT(MINUTE FROM rec.data_inicio)::text, 2, '0'),
            rec.id,
            'agendamento',
            'alta',
            json_build_object(
                'cliente_nome', rec.cliente_nome,
                'data_inicio', rec.data_inicio,
                'hora_agendamento', EXTRACT(HOUR FROM rec.data_inicio) || ':' || LPAD(EXTRACT(MINUTE FROM rec.data_inicio)::text, 2, '0')
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
