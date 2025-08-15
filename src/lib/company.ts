import { apiFetch } from './api'

export type Party = { id: string; name: string }
export type User = {
  id: string
  name: string
  email: string
  bio: string
  parties: Party[]
  isAbleToPostDiscussions: boolean
  isAbleToManageSessions: boolean
  isAbleToManageUsers: boolean
}

export type Company = {
  id: string
  name: string
  users: User[]
  parties: Party[]
}

export async function fetchMyCompany(): Promise<Company | null> {
  const res = await apiFetch('/api/company/my-company')
  if (!res.ok) return null
  return (await res.json()) as Company
}


