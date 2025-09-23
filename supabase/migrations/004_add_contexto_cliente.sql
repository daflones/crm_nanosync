-- Add contexto_cliente column to clientes table
ALTER TABLE clientes ADD COLUMN contexto_cliente TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clientes.contexto_cliente IS 'Campo para armazenar o resumo/contexto completo do cliente';
