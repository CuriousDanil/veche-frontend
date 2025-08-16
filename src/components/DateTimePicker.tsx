import { useState, useEffect } from 'react'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export default function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    if (value) {
      const dateObj = new Date(value + 'Z')
      setDate(dateObj.toISOString().slice(0, 10))
      setTime(dateObj.toISOString().slice(11, 16))
    }
  }, [value])

  useEffect(() => {
    if (date && time) {
      onChange(`${date}T${time}`)
    }
  }, [date, time, onChange])

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentDate = date ? new Date(date) : new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const currentDay = currentDate.getDate()

  const [hours, minutes] = time ? time.split(':').map(Number) : [12, 0]
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const ampm = hours >= 12 ? 'PM' : 'AM'

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i)
  const days = Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => i + 1)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="datetime-picker">
      {/* Date Picker */}
      <div className="date-picker">
        <div className="picker-label">Date</div>
        <div className="picker-wheels">
          <div className="picker-wheel">
            <select 
              value={currentMonth} 
              onChange={(e) => setDate(`${currentYear}-${String(Number(e.target.value) + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`)}
              className="wheel-select"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div className="picker-wheel">
            <select 
              value={currentDay} 
              onChange={(e) => setDate(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(e.target.value).padStart(2, '0')}`)}
              className="wheel-select"
            >
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="picker-wheel">
            <select 
              value={currentYear} 
              onChange={(e) => setDate(`${e.target.value}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`)}
              className="wheel-select"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Time Picker */}
      <div className="time-picker">
        <div className="picker-label">Time</div>
        <div className="picker-wheels">
          <div className="picker-wheel">
            <select 
              value={displayHours} 
              onChange={(e) => {
                const newHour = Number(e.target.value)
                const hour24 = ampm === 'AM' ? (newHour === 12 ? 0 : newHour) : (newHour === 12 ? 12 : newHour + 12)
                setTime(`${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
              }}
              className="wheel-select"
            >
              {hourOptions.map(hour => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
          </div>
          <div className="picker-wheel">
            <select 
              value={minutes} 
              onChange={(e) => setTime(`${String(hours).padStart(2, '0')}:${String(e.target.value).padStart(2, '0')}`)}
              className="wheel-select"
            >
              {minuteOptions.map(minute => (
                <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
          <div className="picker-wheel">
            <select 
              value={ampm} 
              onChange={(e) => {
                const newAmPm = e.target.value
                const hour24 = newAmPm === 'AM' ? (displayHours === 12 ? 0 : displayHours) : (displayHours === 12 ? 12 : displayHours + 12)
                setTime(`${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
              }}
              className="wheel-select"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
