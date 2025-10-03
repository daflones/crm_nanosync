import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ptBR } from "date-fns/locale"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        caption: "flex justify-between items-center mb-4",
        caption_label: "text-base font-semibold capitalize",
        nav: "flex items-center gap-1",
        nav_button: "h-8 w-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-flex items-center justify-center",
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse mt-4",
        head_row: "flex w-full",
        head_cell: "text-gray-600 dark:text-gray-400 w-10 font-medium text-xs uppercase text-center",
        row: "flex w-full mt-1",
        cell: "h-10 w-10 text-center text-sm p-0 relative",
        day: "h-10 w-10 p-0 font-normal rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center",
        day_selected: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700",
        day_today: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 font-semibold",
        day_outside: "invisible",
        day_disabled: "text-gray-300 dark:text-gray-700 opacity-50 cursor-not-allowed",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
