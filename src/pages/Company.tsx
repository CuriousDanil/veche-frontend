import { useEffect, useMemo, useState } from 'react'
import { fetchMyCompany, type Company } from '../lib/company'

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const c = await fetchMyCompany()
        setCompany(c)
        if (c) {
          const exp: Record<string, boolean> = {}
          for (const p of c.parties) exp[p.id] = true
          setExpanded(exp)
        }
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

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
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--text-secondary)' }}>{error}</p>}
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


