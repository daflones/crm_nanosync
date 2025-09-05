# 🗂️ Configuração do Storage para Imagens de Produtos

Como não é possível configurar as políticas RLS via SQL devido a restrições de permissão, siga estas instruções para configurar manualmente no Dashboard do Supabase.

## 📋 Passo a Passo

### 1. Execute a Migração do Bucket
```bash
npx supabase migration up --local
```

### 2. Configure as Políticas no Dashboard

Acesse: **Supabase Dashboard → Storage → Buckets → product-images → Policies**

#### Política 1: INSERT (Upload)
- **Operation**: INSERT
- **Target roles**: `authenticated`
- **Policy definition**: 
```sql
bucket_id = 'product-images'
```

#### Política 2: SELECT (Download/Visualização)
- **Operation**: SELECT  
- **Target roles**: `public`
- **Policy definition**:
```sql
bucket_id = 'product-images'
```

#### Política 3: UPDATE (Atualização)
- **Operation**: UPDATE
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'product-images'
```

#### Política 4: DELETE (Exclusão)
- **Operation**: DELETE
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'product-images'
```

## ✅ Verificação

Após configurar as políticas:
1. Teste criar um novo produto com imagem
2. Verifique se não há mais erros RLS no console
3. Confirme que as imagens são exibidas corretamente

## 🔧 Configurações do Bucket

O bucket já será criado com:
- ✅ Público: Sim
- ✅ Tamanho máximo: 5MB
- ✅ Tipos permitidos: JPG, JPEG, PNG, WebP, GIF
