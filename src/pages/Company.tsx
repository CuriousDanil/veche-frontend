import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import type { Company } from '../types'
import { Skeleton, SkeletonText } from '../components/Skeleton'

export default function CompanyPage() {
  const { data: company, error, isLoading } = useSWR<Company>('/api/company/my-company', swrJsonFetcher, { refreshInterval: 15000 })

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
          <div className="mt-6 mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2>{company.name}</h2>
            <Link to="/company/parties/new" className="primary-button">Create party</Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-lg)',
            marginTop: 'var(--space-lg)',
            gridAutoFlow: 'dense',
          }}>
            {Object.entries(usersByParty).map(([pid, group]) => {
              const size = group.users.length
              const spanCols = size > 8 ? 2 : 1
              return (
                <div key={pid} className="card" style={{ gridColumn: `span ${spanCols}` }}>
                  <div className="field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                      <h3 className="font-semibold">{group.name}</h3>
                      <div className="button-group">
                        <button className="secondary-button" type="button">Add user</button>
                        <button className="secondary-button" type="button">Edit party</button>
                      </div>
                    </div>
                    <div className="text-tertiary mb-3" style={{ fontSize: 'var(--text-sm)' }}>
                      {group.users.length} member{group.users.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ display: 'grid', gap: 'var(--space-xs)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      {group.users.map((u, idx) => (
                        <div key={idx} className="text-secondary" style={{ 
                          padding: 'var(--space-xs) var(--space-sm)',
                          background: 'var(--border-light)',
                          borderRadius: 'var(--radius)',
                          fontSize: 'var(--text-sm)'
                        }}>
                          {u}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


