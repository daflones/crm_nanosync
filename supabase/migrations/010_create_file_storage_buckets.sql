-- Create storage buckets for different document categories
-- This migration creates separate buckets for better organization

-- Create buckets for different document categories
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('propostas', 'propostas', true, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif']),
  ('contratos', 'contratos', true, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('marketing', 'marketing', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov', 'application/pdf']),
  ('produtos', 'produtos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4']),
  ('relatorios', 'relatorios', true, 52428800, ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']),
  ('sistema', 'sistema', false, 524288000, ARRAY['application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip']),
  ('juridico', 'juridico', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('vendas', 'vendas', true, 52428800, ARRAY['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for each bucket

-- Propostas bucket policies
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Allow authenticated users to upload to propostas', 'propostas', 
   'bucket_id = ''propostas'' AND auth.role() = ''authenticated'''),
  ('Allow public read access to propostas', 'propostas', 
   'bucket_id = ''propostas''')
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Contratos bucket policies
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Allow authenticated users to upload to contratos', 'contratos', 
   'bucket_id = ''contratos'' AND auth.role() = ''authenticated'''),
  ('Allow public read access to contratos', 'contratos', 
   'bucket_id = ''contratos''')
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Marketing bucket policies
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Allow authenticated users to upload to marketing', 'marketing', 
   'bucket_id = ''marketing'' AND auth.role() = ''authenticated'''),
  ('Allow public read access to marketing', 'marketing', 
   'bucket_id = ''marketing''')
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Produtos bucket policies
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Allow authenticated users to upload to produtos', 'produtos', 
   'bucket_id = ''produtos'' AND auth.role() = ''authenticated'''),
  ('Allow public read access to produtos', 'produtos', 
   'bucket_id = ''produtos''')
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Relatorios bucket policies
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Allow authenticated users to upload to relatorios', 'relatorios', 
   'bucket_id = ''relatorios'' AND auth.role() = ''authenticated'''),
  ('Allow public read access to relatorios', 'relatorios', 
   'bucket_id = ''relatorios''')
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Sistema bucket policies (private)
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Allow admin users to upload to sistema', 'sistema', 
   'bucket_id = ''sistema'' AND auth.role() = ''authenticated'' AND auth.jwt() ->> ''role'' = ''admin'''),
  ('Allow admin users to read from sistema', 'sistema', 
   'bucket_id = ''sistema'' AND auth.role() = ''authenticated'' AND auth.jwt() ->> ''role'' = ''admin''')
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Juridico bucket policies (private)
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Allow authenticated users to upload to juridico', 'juridico', 
   'bucket_id = ''juridico'' AND auth.role() = ''authenticated'''),
  ('Allow authenticated users to read from juridico', 'juridico', 
   'bucket_id = ''juridico'' AND auth.role() = ''authenticated''')
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Vendas bucket policies
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Allow authenticated users to upload to vendas', 'vendas', 
   'bucket_id = ''vendas'' AND auth.role() = ''authenticated'''),
  ('Allow public read access to vendas', 'vendas', 
   'bucket_id = ''vendas''')
ON CONFLICT (name, bucket_id) DO NOTHING;
