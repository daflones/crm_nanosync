import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  label: string
  required?: boolean
}

export function DateTimePicker({ value, onChange, label, required }: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : new Date())

  const formatDisplayValue = (dateTime: string) => {
    if (!dateTime) return ''
    const date = new Date(dateTime)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateCalendar = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  const handleDateSelect = (date: Date) => {
    const newDate = new Date(selectedDate)
    newDate.setFullYear(date.getFullYear())
    newDate.setMonth(date.getMonth())
    newDate.setDate(date.getDate())
    setSelectedDate(newDate)
    
    // Formatar para YYYY-MM-DDTHH:MM
    const formatted = newDate.toISOString().slice(0, 16)
    onChange(formatted)
  }

  const handleTimeChange = (hours: number, minutes: number) => {
    const newDate = new Date(selectedDate)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    setSelectedDate(newDate)
    
    const formatted = newDate.toISOString().slice(0, 16)
    onChange(formatted)
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal"
          onClick={() => setShowPicker(!showPicker)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDisplayValue(value) : 'Selecione data e hora'}
        </Button>

        {showPicker && (
          <Card className="absolute z-50 mt-1 w-80">
            <CardContent className="p-4">
              {/* Header do calendário */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    newDate.setMonth(newDate.getMonth() - 1)
                    setSelectedDate(newDate)
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    newDate.setMonth(newDate.getMonth() + 1)
                    setSelectedDate(newDate)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm font-medium p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendário */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {generateCalendar().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === selectedDate.getMonth()
                  const isSelected = date.toDateString() === selectedDate.toDateString()
                  const isToday = date.toDateString() === new Date().toDateString()

                  return (
                    <Button
                      key={index}
                      type="button"
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${!isCurrentMonth ? 'text-gray-400' : ''} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => handleDateSelect(date)}
                    >
                      {date.getDate()}
                    </Button>
                  )
                })}
              </div>

              {/* Seletor de hora */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Hora</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={selectedDate.getHours()}
                    onChange={(e) => handleTimeChange(parseInt(e.target.value) || 0, selectedDate.getMinutes())}
                    className="w-16"
                  />
                  <span className="self-center">:</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={selectedDate.getMinutes()}
                    onChange={(e) => handleTimeChange(selectedDate.getHours(), parseInt(e.target.value) || 0)}
                    className="w-16"
                  />
                </div>
                
                {/* Horários rápidos */}
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">Horários comuns:</div>
                  <div className="flex gap-1 flex-wrap">
                    {['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'].map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => {
                          const [hours, minutes] = time.split(':').map(Number)
                          handleTimeChange(hours, minutes)
                        }}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPicker(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    setSelectedDate(now)
                    onChange(now.toISOString().slice(0, 16))
                  }}
                  className="flex-1"
                >
                  Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
