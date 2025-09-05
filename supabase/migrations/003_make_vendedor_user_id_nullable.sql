-- Make user_id nullable in vendedores table to allow creating vendedores without auth users
ALTER TABLE vendedores ALTER COLUMN user_id DROP NOT NULL;
