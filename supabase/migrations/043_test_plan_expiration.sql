-- Test script for plan expiration functionality
-- This script helps test the plan expiration cron job

-- Function to manually trigger plan expiration (for testing)
CREATE OR REPLACE FUNCTION test_expire_plans()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
  result_text TEXT;
BEGIN
  -- Count plans that will be expired
  SELECT COUNT(*) INTO expired_count
  FROM profiles 
  WHERE plano_ativo = true 
    AND plano_expira_em IS NOT NULL 
    AND plano_expira_em <= NOW();
  
  -- Execute the expiration function
  PERFORM expire_plans();
  
  -- Build result message
  result_text := 'Plan expiration test completed. Expired ' || expired_count || ' plans.';
  
  RETURN result_text;
END;
$$;

-- Function to create a test user with expired plan (for testing purposes)
CREATE OR REPLACE FUNCTION create_test_expired_user()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Generate a test user ID
  test_user_id := gen_random_uuid();
  
  -- Insert test user with expired plan
  INSERT INTO profiles (
    id,
    email,
    nome,
    plano_ativo,
    plano_id,
    plano_expira_em,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    'test-expired-' || extract(epoch from now()) || '@example.com',
    'Test User - Expired Plan',
    true,
    'pro',
    NOW() - INTERVAL '1 day', -- Expired 1 day ago
    NOW(),
    NOW()
  );
  
  RETURN 'Created test user with expired plan: ' || test_user_id::TEXT;
END;
$$;

-- Function to clean up test users
CREATE OR REPLACE FUNCTION cleanup_test_users()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete test users
  DELETE FROM profiles 
  WHERE email LIKE 'test-expired-%@example.com';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN 'Cleaned up ' || deleted_count || ' test users.';
END;
$$;

-- Grant permissions for testing functions
GRANT EXECUTE ON FUNCTION test_expire_plans() TO authenticated;
GRANT EXECUTE ON FUNCTION create_test_expired_user() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_test_users() TO authenticated;

-- Add comments
COMMENT ON FUNCTION test_expire_plans() IS 'Manually trigger plan expiration for testing';
COMMENT ON FUNCTION create_test_expired_user() IS 'Create a test user with expired plan for testing';
COMMENT ON FUNCTION cleanup_test_users() IS 'Clean up test users created for testing';
