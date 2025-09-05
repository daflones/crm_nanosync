-- Temporarily disable the agendamento trigger to allow creation
-- This will allow agendamentos to be created while we fix the notification issue

-- Drop the trigger temporarily
DROP TRIGGER IF EXISTS trigger_agendamento_insert ON agendamentos;

-- We can re-enable it later once the notification constraint is properly fixed
