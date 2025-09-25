# 🔧 Como Implementar o Seletor de Data/Hora

## Passo 1: Adicionar Import

No arquivo `src/components/agendamentos/AgendamentoForm.tsx`, adicione esta linha no topo com os outros imports:

```typescript
import { SimpleDateTime } from '@/components/ui/simple-datetime'
```

## Passo 2: Localizar a Seção de Data/Hora

Procure por esta seção no arquivo (aproximadamente linha 440):

```typescript
<Label>Data/Hora Início <span className="text-red-500">*</span></Label>
<div className="grid grid-cols-2 gap-2">
```

## Passo 3: Substituir TODA a seção de Data/Hora

Substitua desde `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">` até o `</div>` correspondente por:

```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Data/Hora Início */}
  <SimpleDateTime
    value={formData.data_inicio}
    onChange={(value) => {
      updateField('data_inicio', value)
      const duracao = formData.duracao_minutos || 0
      if (duracao > 0) {
        const novaDataFim = calcularDataFim(value, duracao)
        updateField('data_fim', novaDataFim)
      }
    }}
    label="Data/Hora Início"
    required
  />

  {/* Duração */}
  <div className="space-y-2">
    <Label htmlFor="duracao_minutos">Duração (min) <span className="text-red-500">*</span></Label>
    <div className="space-y-2">
      <Input
        id="duracao_minutos"
        type="number"
        value={formData.duracao_minutos || ''}
        onChange={(e) => {
          const duracao = parseInt(e.target.value) || 0
          updateField('duracao_minutos', duracao)
          if (formData.data_inicio && duracao > 0) {
            const novaDataFim = calcularDataFim(formData.data_inicio, duracao)
            updateField('data_fim', novaDataFim)
          }
        }}
        min="1"
        placeholder="Ex: 30, 60, 90..."
        required
      />
      <div className="flex gap-1 flex-wrap">
        {[15, 30, 45, 60, 90, 120].map((minutos) => (
          <Button
            key={minutos}
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => {
              updateField('duracao_minutos', minutos)
              if (formData.data_inicio) {
                const novaDataFim = calcularDataFim(formData.data_inicio, minutos)
                updateField('data_fim', novaDataFim)
              }
            }}
          >
            {minutos}min
          </Button>
        ))}
      </div>
      {(formData.duracao_minutos || 0) > 0 && (
        <p className="text-sm text-muted-foreground">
          ✓ Duração: {formData.duracao_minutos} minutos
        </p>
      )}
    </div>
  </div>

  {/* Data/Hora Fim */}
  <SimpleDateTime
    value={formData.data_fim}
    onChange={(value) => {
      updateField('data_fim', value)
      if (formData.data_inicio) {
        const novaDuracao = calcularDuracao(formData.data_inicio, value)
        if (novaDuracao > 0) {
          updateField('duracao_minutos', novaDuracao)
        }
      }
    }}
    label="Data/Hora Fim"
    required
  />
</div>
```

## ✅ Resultado Esperado

Após fazer essas mudanças:

1. **Campo Data**: Clique abrirá um calendário visual
2. **Campo Hora**: Clique abrirá um seletor de hora com botões rápidos
3. **Cálculo automático**: Continuará funcionando normalmente

## 🎯 Localização Exata

Se tiver dificuldade para encontrar, procure por:
- Linha que contém: `<h3 className="text-lg font-medium mb-4">Data e Hora</h3>`
- Logo abaixo estará a seção que precisa ser substituída

## 📝 Backup

Antes de fazer as mudanças, faça um backup do arquivo original!
