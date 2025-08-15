function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function formatEuDate(d: Date): string {
  const dd = pad2(d.getDate())
  const mm = pad2(d.getMonth() + 1)
  const yyyy = d.getFullYear()
  const hh = pad2(d.getHours())
  const min = pad2(d.getMinutes())
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export function formatEuFromIso(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return formatEuDate(d)
}

export function formatEuFromInput(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return formatEuDate(d)
}

export function timeLeftDhM(iso?: string | null): string {
  if (!iso) return '—'
  const target = new Date(iso).getTime()
  if (isNaN(target)) return '—'
  const now = Date.now()
  let diffMs = target - now
  if (diffMs <= 0) return '0d 00h 00m'
  const totalMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60)
  const minutes = totalMinutes % 60
  return `${days}d ${pad2(hours)}h ${pad2(minutes)}m`
}


