import { apiFetch } from './api'
import type { Company } from '../types'

export async function fetchMyCompany(): Promise<Company | null> {
  const res = await apiFetch('/api/company/my-company')
  if (!res.ok) return null
  return (await res.json()) as Company
}


