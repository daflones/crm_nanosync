-- Migration: Create cron job to automatically expire plans
-- This cron job will run daily at midnight to check for expired plans

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to expire plans
CREATE OR REPLACE FUNCTION expire_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update profiles where plan has expired (plano_expira_em <= current date/time)
  UPDATE profiles 
  SET 
    plano_ativo = false,
    updated_at = NOW()
  WHERE 
    plano_ativo = true 
    AND plano_expira_em IS NOT NULL 
    AND plano_expira_em <= NOW();
    
  -- Log the number of plans expired
  RAISE NOTICE 'Plan expiration job completed. Expired % plans.', 
    (SELECT COUNT(*) FROM profiles WHERE plano_ativo = false AND plano_expira_em <= NOW());
END;
$$;

-- Schedule the cron job to run every minute
SELECT cron.schedule(
  'expire-plans-every-minute',
  '* * * * *',  -- Every minute
  'SELECT expire_plans();'
);

-- Create a manual function to check plan expiration immediately (for testing)
CREATE OR REPLACE FUNCTION check_plan_expiration()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  plano_expira_em TIMESTAMPTZ,
  expired BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.plano_expira_em,
    (p.plano_expira_em <= NOW()) as expired
  FROM profiles p
  WHERE 
    p.plano_ativo = true 
    AND p.plano_expira_em IS NOT NULL
  ORDER BY p.plano_expira_em ASC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION expire_plans() TO service_role;
GRANT EXECUTE ON FUNCTION check_plan_expiration() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION expire_plans() IS 'Automatically expires user plans when plano_expira_em date/time is reached';
COMMENT ON FUNCTION check_plan_expiration() IS 'Returns list of active plans and their expiration status for monitoring';
