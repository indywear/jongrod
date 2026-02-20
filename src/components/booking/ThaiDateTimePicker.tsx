"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThaiDateTimePickerProps {
  value: string
  timeValue: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  minDate?: string
  minAdvanceHours?: number
  placeholder?: string
  className?: string
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

const THAI_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00"
]

export function ThaiDateTimePicker({
  value,
  timeValue,
  onDateChange,
  onTimeChange,
  minDate,
  minAdvanceHours = 4,
  placeholder = "เลือกวันที่",
  className,
}: ThaiDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (value) {
      const newDate = new Date(value)
      if (
        newDate.getMonth() !== currentMonth.getMonth() ||
        newDate.getFullYear() !== currentMonth.getFullYear()
      ) {
        setCurrentMonth(newDate)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const toThaiYear = (year: number) => year + 543

  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = THAI_MONTHS[date.getMonth()]
    const year = toThaiYear(date.getFullYear())
    return `${day} ${month} ${year}`
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const isDateDisabled = (day: number) => {
    if (!minDate) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    return date < min
  }

  const handleDateSelect = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const year = selected.getFullYear()
    const month = String(selected.getMonth() + 1).padStart(2, "0")
    const dayStr = String(selected.getDate()).padStart(2, "0")
    const dateStr = `${year}-${month}-${dayStr}`
    onDateChange(dateStr)
    setIsOpen(false)
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const isSelected = (day: number) => {
    if (!value) return false
    const selectedDate = new Date(value)
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isTimeDisabled = (time: string) => {
    if (!value) return false
    const now = new Date()
    const [hours, minutes] = time.split(":").map(Number)
    const selectedDate = new Date(value)
    selectedDate.setHours(hours, minutes, 0, 0)

    const minAllowed = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)
    return selectedDate < minAllowed
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {value ? formatThaiDate(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-medium">
                {THAI_MONTHS[currentMonth.getMonth()]} {toThaiYear(currentMonth.getFullYear())}
              </div>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {THAI_DAYS.map((day) => (
                <div
                  key={day}
                  className="h-8 w-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div key={index} className="h-8 w-8">
                  {day !== null && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 p-0 font-normal",
                        isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary",
                        isToday(day) && !isSelected(day) && "border border-primary",
                        isDateDisabled(day) && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => !isDateDisabled(day) && handleDateSelect(day)}
                      disabled={isDateDisabled(day)}
                    >
                      {day}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Select value={timeValue} onValueChange={(t) => {
        if (!isTimeDisabled(t)) onTimeChange(t)
      }}>
        <SelectTrigger className="w-[110px]">
          <Clock className="mr-2 h-4 w-4" />
          <SelectValue placeholder="เวลา" />
        </SelectTrigger>
        <SelectContent>
          {TIME_SLOTS.map((time) => {
            const disabled = isTimeDisabled(time)
            return (
              <SelectItem
                key={time}
                value={time}
                disabled={disabled}
                className={disabled ? "opacity-40 cursor-not-allowed" : ""}
              >
                {time} น.
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
