import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DateTimePicker } from '@/components/ui/datetime-picker'

interface DateTimeSectionProps {
  formData: {
    data_inicio: string
    data_fim: string
    duracao_minutos: number
  }
  updateField: (field: string, value: any) => void
  calcularDataFim: (dataInicio: string, duracao: number) => string
  calcularDuracao: (dataInicio: string, dataFim: string) => number
}

export function DateTimeSection({ formData, updateField, calcularDataFim, calcularDuracao }: DateTimeSectionProps) {
  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-lg font-medium mb-4">Data e Hora</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Data/Hora Início */}
        <DateTimePicker
          value={formData.data_inicio}
          onChange={(value) => {
            updateField('data_inicio', value)
            // Recalcular data_fim se duração estiver definida
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
                // Calcular data_fim automaticamente se data_inicio estiver preenchida
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
        <DateTimePicker
          value={formData.data_fim}
          onChange={(value) => {
            updateField('data_fim', value)
            // Recalcular duração se data_inicio estiver preenchida
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
      {formData.data_inicio && formData.data_fim && (
        <p className="text-sm text-muted-foreground mt-2">
          ✓ Calculado automaticamente
        </p>
      )}
    </div>
  )
}
