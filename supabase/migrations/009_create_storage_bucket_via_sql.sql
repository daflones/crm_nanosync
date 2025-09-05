-- Create storage bucket for product images (only bucket creation)
-- Note: RLS policies must be configured via Supabase Dashboard due to permission restrictions

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- IMPORTANT: Configure these RLS policies manually in Supabase Dashboard:
-- Go to Storage > Buckets > product-images > Policies

-- Policy 1 (INSERT): 
-- Target roles: authenticated
-- Policy definition: bucket_id = 'product-images'

-- Policy 2 (SELECT):
-- Target roles: public  
-- Policy definition: bucket_id = 'product-images'

-- Policy 3 (UPDATE):
-- Target roles: authenticated
-- Policy definition: bucket_id = 'product-images'

-- Policy 4 (DELETE):
-- Target roles: authenticated
-- Policy definition: bucket_id = 'product-images'
