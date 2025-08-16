import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import type { Company } from '../types'
import { Skeleton, SkeletonText } from '../components/Skeleton'

export default function CompanyPage() {
  const { data: company, error, isLoading } = useSWR<Company>('/api/company/my-company', swrJsonFetcher, { refreshInterval: 15000 })
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // default expand all parties once data arrives
  useMemo(() => {
    if (!company) return
    const exp: Record<string, boolean> = {}
    for (const p of company.parties) exp[p.id] = true
    setExpanded(exp)
  }, [company?.id])

  const usersByParty = useMemo(() => {
    const map: Record<string, { name: string; users: string[] }> = {}
    if (!company) return map
    for (const p of company.parties) map[p.id] = { name: p.name, users: [] }
    for (const u of company.users) {
      for (const p of u.parties) {
        if (!map[p.id]) map[p.id] = { name: p.name, users: [] }
        map[p.id].users.push(`${u.name} (${u.email})`)
      }
    }
    return map
  }, [company])

  function toggle(pid: string) {
    setExpanded((e) => ({ ...e, [pid]: !e[pid] }))
  }

  return (
    <div className="container">
      {isLoading && (
        <div className="card" style={{ padding: 16 }}>
          <Skeleton style={{ height: 24, width: 280, marginBottom: 12 }} />
          <SkeletonText lines={3} />
        </div>
      )}
      {error && <p style={{ color: 'var(--text-secondary)' }}>{String(error)}</p>}
      {company && (
        <div>
          <h2 style={{ marginTop: 24 }}>{company.name}</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {Object.entries(usersByParty).map(([pid, group]) => (
              <div key={pid} className="card" style={{ padding: 12 }}>
                <button className="link" onClick={() => toggle(pid)} style={{ fontWeight: 600 }}>
                  {expanded[pid] ? '▼' : '►'} {group.name} ({group.users.length})
                </button>
                {expanded[pid] && (
                  <ul style={{ marginTop: 8 }}>
                    {group.users.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


