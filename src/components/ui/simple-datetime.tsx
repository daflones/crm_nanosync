import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarIcon, Clock } from 'lucide-react'

interface SimpleDateTimeProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  required?: boolean
  popoverDirection?: 'left' | 'right'
  showTime?: boolean
}

export function SimpleDateTime({ value, onChange, label, required, popoverDirection = 'left', showTime: showTimeField = true }: SimpleDateTimeProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [showTime, setShowTime] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)

  // Fechar popovers ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
      if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
        setShowTime(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Extrair data e hora do valor
  const dateValue = value ? value.split('T')[0] : ''
  const timeValue = value ? (value.split('T')[1] || '09:00').slice(0, 5) : '09:00'
  

  const updateDateTime = (newDate: string, newTime: string) => {
    if (newDate && newTime && onChange) {
      // Salvar no formato completo para o Supabase, mas garantir que seja HH:MM:00
      const formattedTime = newTime.slice(0, 5) + ':00'
      const finalDateTime = `${newDate}T${formattedTime}`
      onChange(finalDateTime)
    }
  }

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1)
    const startingDayOfWeek = firstDay.getDay()
    
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    const days = []
    
    // Adicionar dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Adicionar todos os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(month + 1).padStart(2, '0')
      const dayStr = String(day).padStart(2, '0')
      const dateString = `${year}-${monthStr}-${dayStr}`
      
      days.push({
        dateString: dateString,
        day: day,
        month: month,
        year: year,
        displayDay: day
      })
    }
    
    return days
  }, [currentDate])

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className={showTimeField ? "flex gap-2" : "w-full"}>
        {/* Campo de Data */}
        <div className={showTimeField ? "flex-1 relative" : "w-full relative"}>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={dateValue ? (() => {
                const [year, month, day] = dateValue.split('-')
                return `${day}/${month}/${year}`
              })() : ''}
              placeholder="dd/mm/aaaa"
              className="pl-10 cursor-pointer w-32"
              readOnly
              onClick={() => setShowCalendar(!showCalendar)}
            />
          </div>
          <Label className="text-xs text-gray-500">Data</Label>

          {/* Calendário Popup */}
          {showCalendar && (
            <div 
              ref={calendarRef}
              className={`absolute z-50 mt-1 bg-white border rounded-lg shadow-lg p-4 w-80 ${
                popoverDirection === 'right' ? 'right-0' : 'left-0'
              }`}
            >
              {/* Header com navegação */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setMonth(newDate.getMonth() - 1)
                    setCurrentDate(newDate)
                  }}
                  className="h-8 w-8 p-0"
                >
                  ←
                </Button>
                <div className="font-medium">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setMonth(newDate.getMonth() + 1)
                    setCurrentDate(newDate)
                  }}
                  className="h-8 w-8 p-0"
                >
                  →
                </Button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-sm font-medium p-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dayData, index) => {
                  if (!dayData) {
                    return <div key={index} className="h-8 w-8"></div>
                  }

                  const isSelected = dateValue === dayData.dateString
                  const today = new Date()
                  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                  const isToday = dayData.dateString === todayString

                  return (
                    <button
                      key={index}
                      type="button"
                      className={`h-8 w-8 text-sm rounded hover:bg-blue-100 ${
                        isSelected ? 'bg-blue-500 text-white' : ''
                      } ${isToday ? 'ring-2 ring-blue-300' : ''}`}
                      onClick={() => {
                        updateDateTime(dayData.dateString, timeValue)
                        setShowCalendar(false)
                      }}
                    >
                      {dayData.displayDay}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalendar(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    updateDateTime(formatDate(today), timeValue)
                    setShowCalendar(false)
                  }}
                  className="flex-1"
                >
                  Hoje
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Campo de Hora */}
        {showTimeField && (
        <div className="flex-1 relative">
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={timeValue}
              placeholder="hh:mm"
              className="pl-10 cursor-pointer"
              readOnly
              onClick={() => setShowTime(!showTime)}
            />
          </div>
          <Label className="text-xs text-gray-500">Hora</Label>

          {/* Seletor de Hora Popup */}
          {showTime && (
            <div 
              ref={timeRef}
              className={`absolute z-50 mt-1 bg-white border rounded-lg shadow-lg p-4 w-64 ${
                popoverDirection === 'right' ? 'right-0' : 'left-0'
              }`}
            >
              <div className="text-center font-medium mb-4">Selecionar Hora</div>
              
              {/* Horários rápidos */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((hora) => (
                  <Button
                    key={hora}
                    type="button"
                    variant={timeValue === hora ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      updateDateTime(dateValue, hora)
                      setShowTime(false)
                    }}
                  >
                    {hora}
                  </Button>
                ))}
              </div>

              {/* Input manual */}
              <div className="flex gap-2 items-center mb-4">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={timeValue.split(':')[0]}
                  onChange={(e) => {
                    const hours = String(parseInt(e.target.value) || 0).padStart(2, '0')
                    const minutes = timeValue.split(':')[1] || '00'
                    updateDateTime(dateValue, `${hours}:${minutes}`)
                  }}
                  className="w-16"
                />
                <span>:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={timeValue.split(':')[1]}
                  onChange={(e) => {
                    const hours = timeValue.split(':')[0] || '09'
                    const minutes = String(parseInt(e.target.value) || 0).padStart(2, '0')
                    updateDateTime(dateValue, `${hours}:${minutes}`)
                  }}
                  className="w-16"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTime(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
