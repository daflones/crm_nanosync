# Configuração de Templates de Email no Supabase

## 1. Configuração no Dashboard do Supabase

### Acesse o Dashboard:
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto InovaPet CRM
3. Navegue para **Authentication** > **Email Templates**

### URLs de Redirecionamento:
Configure as seguintes URLs no seu projeto:

**Site URL (Principal):**
```
https://crm.nanosync.com.br
```

**Redirect URLs (Adicionar todas):**
```
https://crm.nanosync.com.br/confirm
https://crm.nanosync.com.br/reset-password
https://www.crm.nanosync.com.br/confirm
https://www.crm.nanosync.com.br/reset-password
http://localhost:5173/confirm
http://localhost:5173/reset-password
```

## 2. Template de Confirmação de Conta

### Configuração:
- **Template:** Confirm signup
- **Subject:** Confirme sua conta - InovaPet CRM 🐾

### HTML Template:
Copie o conteúdo do arquivo `email-templates/account-confirmation.html` e cole na seção HTML do template.

### Redirect URL:
```
{{ .SiteURL }}/confirm?token={{ .TokenHash }}&type=signup
```

## 3. Template de Recuperação de Senha

### Configuração:
- **Template:** Reset password
- **Subject:** Redefinir senha - InovaPet CRM 🔒

### HTML Template:
Copie o conteúdo do arquivo `email-templates/password-recovery.html` e cole na seção HTML do template.

### Redirect URL:
```
{{ .SiteURL }}/reset-password?token={{ .TokenHash }}&type=recovery
```

## 4. Configurações Adicionais

### SMTP Settings (Opcional - para email customizado):
Se quiser usar um servidor SMTP próprio:
1. Vá para **Settings** > **Authentication**
2. Configure **SMTP Settings**
3. Use as credenciais do seu provedor de email

### Rate Limiting:
- **Email rate limit:** 3 emails por hora (padrão)
- **SMS rate limit:** 60 SMS por hora (padrão)

## 5. Variáveis Disponíveis nos Templates

### Para todos os templates:
- `{{ .SiteURL }}` - URL principal do site
- `{{ .ConfirmationURL }}` - URL completa de confirmação
- `{{ .Email }}` - Email do usuário
- `{{ .TokenHash }}` - Hash do token de confirmação
- `{{ .Data }}` - Dados adicionais (se enviados)

### Exemplo de uso no código:
```typescript
// Enviar email de confirmação
await supabase.auth.signUp({
  email: 'usuario@exemplo.com',
  password: 'senha123',
  options: {
    emailRedirectTo: 'https://crm.nanosync.com.br/confirm'
  }
})

// Enviar email de recuperação
await supabase.auth.resetPasswordForEmail('usuario@exemplo.com', {
  redirectTo: 'https://crm.nanosync.com.br/reset-password'
})
```

## 6. Testando os Templates

### Teste de Confirmação:
1. Registre um novo usuário
2. Verifique se o email chegou com o design correto
3. Clique no link e confirme se redireciona para `/confirm`

### Teste de Recuperação:
1. Use "Esqueci minha senha"
2. Verifique se o email chegou com o design correto
3. Clique no link e confirme se redireciona para `/reset-password`

## 7. Troubleshooting

### Links quebrados:
- Verifique se as URLs estão na lista de Redirect URLs
- Confirme se o domínio está correto
- Teste com localhost para desenvolvimento

### Emails não chegam:
- Verifique spam/lixo eletrônico
- Confirme configurações SMTP (se usando customizado)
- Verifique rate limits

### Erro de token inválido:
- Tokens expiram em 1 hora
- Cada token só pode ser usado uma vez
- Gere um novo link se necessário
