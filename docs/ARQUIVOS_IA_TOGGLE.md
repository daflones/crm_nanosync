# Funcionalidade: Toggle de Arquivos IA

## Descrição
Esta funcionalidade permite habilitar ou desabilitar a área de Arquivos IA através de um botão toggle nas configurações do sistema.

## Como Funciona

### 1. Configuração
- Acesse **Configurações** → **Configurações IA**
- Você verá um switch chamado "Habilitar Área de Arquivos IA"
- Quando **ativado** (TRUE): A seção "Arquivos IA" aparece no menu lateral e todas as funcionalidades relacionadas ficam disponíveis
- Quando **desativado** (FALSE): A seção "Arquivos IA" é completamente ocultada do sistema

### 2. Comportamento

#### Quando Ativado (TRUE)
- ✅ Menu "Arquivos IA" visível no Sidebar
- ✅ Menu "Arquivos IA" visível no Mobile Nav
- ✅ Rota `/app/arquivos-ia` acessível
- ✅ Todas as funcionalidades de upload e gerenciamento de arquivos IA disponíveis

#### Quando Desativado (FALSE)
- ❌ Menu "Arquivos IA" oculto do Sidebar
- ❌ Menu "Arquivos IA" oculto do Mobile Nav
- ❌ Rota `/app/arquivos-ia` redireciona para dashboard
- ❌ Nenhuma funcionalidade de arquivos IA acessível

### 3. Proteções Implementadas

#### Proteção de Rota
- Componente `ArquivosIAGuard` protege a rota `/app/arquivos-ia`
- Se o usuário tentar acessar diretamente pela URL quando desabilitado, será redirecionado ao dashboard

#### Proteção de Menu
- Sidebar e MobileNav verificam o estado de `envia_documento` antes de exibir o item de menu
- Atualização em tempo real quando o toggle é alterado

## Arquivos Modificados

### Backend/Database
- `src/services/api/ia-config.ts` - Adicionado campo `envia_documento` no tipo `IAConfig`
- `migrations/add_envia_documento_column.sql` - Script SQL para adicionar a coluna no banco

### Frontend - Configurações
- `src/pages/configuracoes/ConfiguracoesPage.tsx` - Adicionada seção "Configurações IA" com toggle
- `src/hooks/useIAConfig.ts` - Hook já existente, usado para ler/atualizar configuração

### Frontend - Proteções
- `src/components/guards/ArquivosIAGuard.tsx` - Novo componente de proteção de rota
- `src/router.tsx` - Rota de Arquivos IA protegida com guard
- `src/components/layout/Sidebar.tsx` - Filtro para ocultar menu quando desabilitado
- `src/components/layout/MobileNav.tsx` - Filtro para ocultar menu quando desabilitado

### Frontend - UI
- `src/components/ui/switch.tsx` - Componente Switch já existente (Radix UI)

## Migração do Banco de Dados

Execute o script SQL para adicionar a coluna:

```sql
-- No Supabase SQL Editor ou seu cliente PostgreSQL
\i migrations/add_envia_documento_column.sql
```

Ou execute manualmente:

```sql
ALTER TABLE ia_config 
ADD COLUMN IF NOT EXISTS envia_documento BOOLEAN DEFAULT false;

UPDATE ia_config 
SET envia_documento = false 
WHERE envia_documento IS NULL;
```

## Valor Padrão
- **Padrão**: `false` (desabilitado)
- Novos registros de `ia_config` são criados com `envia_documento = false`
- Administradores devem ativar manualmente nas configurações

## Permissões
- Apenas **administradores** podem acessar a página de Configurações
- Apenas **administradores** podem alterar o toggle de Arquivos IA
- A configuração afeta todos os usuários da empresa (multi-tenant)

## Tecnologias Utilizadas
- React Query para gerenciamento de estado
- Zustand para auth store
- Radix UI Switch component
- React Router para proteção de rotas
- TypeScript para type safety
