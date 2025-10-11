-- Habilitar RLS na tabela ia_config
ALTER TABLE public.ia_config ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own ia_config" ON public.ia_config;
DROP POLICY IF EXISTS "Users can insert their own ia_config" ON public.ia_config;
DROP POLICY IF EXISTS "Users can update their own ia_config" ON public.ia_config;
DROP POLICY IF EXISTS "Users can delete their own ia_config" ON public.ia_config;

-- Política para SELECT (leitura)
CREATE POLICY "Users can view their own ia_config"
ON public.ia_config
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.admin_profile_id = ia_config.profile
  )
);

-- Política para INSERT (criação)
CREATE POLICY "Users can insert their own ia_config"
ON public.ia_config
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'superadmin')
  )
);

-- Política para UPDATE (atualização)
CREATE POLICY "Users can update their own ia_config"
ON public.ia_config
FOR UPDATE
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.admin_profile_id = ia_config.profile
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.admin_profile_id = ia_config.profile
  )
);

-- Política para DELETE (exclusão)
CREATE POLICY "Users can delete their own ia_config"
ON public.ia_config
FOR DELETE
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'superadmin')
  )
);
