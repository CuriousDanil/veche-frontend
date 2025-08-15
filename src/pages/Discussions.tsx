import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Party = { id: string; name: string }
type Discussion = {
  id: string
  subject: string
  content: string
  createdAt: string
  party?: Party
  partyId?: string
  creatorName: string
  status: 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'
}

const STATUS_ORDER: Discussion['status'][] = ['WAITING', 'VOTING', 'FINAL_VOTING', 'RESOLVED', 'ARCHIVED']
const DEFAULT_EXPANDED_STATUSES = new Set(['WAITING', 'VOTING', 'FINAL_VOTING'])

export default function Discussions() {
  const { user } = useAuth()
  const myPartyIds = user?.partyIds ?? []
  const [items, setItems] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expandedParties, setExpandedParties] = useState<Record<string, boolean>>({})
  const [expandedByStatus, setExpandedByStatus] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiFetch('/api/discussions')
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = (await res.json()) as Discussion[]
        setItems(data)
        const partyDefaults: Record<string, boolean> = {}
        const statusDefaults: Record<string, Record<string, boolean>> = {}
        for (const d of data) {
          const pid = d.party?.id || d.partyId || 'unknown'
          if (myPartyIds.includes(pid)) partyDefaults[pid] = true
          if (!statusDefaults[pid]) statusDefaults[pid] = {}
          if (DEFAULT_EXPANDED_STATUSES.has(d.status)) statusDefaults[pid][d.status] = true
        }
        setExpandedParties((prev) => ({ ...partyDefaults, ...prev }))
        setExpandedByStatus((prev) => ({ ...statusDefaults, ...prev }))
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [myPartyIds.join(',')])

  const grouped = useMemo(() => {
    const byParty: Record<string, { partyName: string; byStatus: Record<string, Discussion[]> }> = {}
    for (const d of items) {
      const pid = d.party?.id || d.partyId || 'unknown'
      const pname = d.party?.name || pid
      if (!byParty[pid]) byParty[pid] = { partyName: pname, byStatus: {} }
      if (!byParty[pid].byStatus[d.status]) byParty[pid].byStatus[d.status] = []
      byParty[pid].byStatus[d.status].push(d)
    }
    return byParty
  }, [items])

  function toggleParty(partyId: string) {
    setExpandedParties((m) => ({ ...m, [partyId]: !m[partyId] }))
  }
  function toggleStatus(partyId: string, status: string) {
    setExpandedByStatus((m) => ({ ...m, [partyId]: { ...(m[partyId] || {}), [status]: !(m[partyId]?.[status]) } }))
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32, paddingBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Discussions</h2>
        <Link to="/discussions/new" className="primary-button">New discussion</Link>
      </div>
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--text-secondary)' }}>{error}</p>}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: 16 }}>
          {Object.entries(grouped).map(([pid, { partyName, byStatus }]) => {
            const total = Object.values(byStatus).reduce((acc, arr) => acc + arr.length, 0)
            const open = !!expandedParties[pid]
            return (
              <div key={pid} className="card" style={{ padding: 16 }}>
                <button className="link" onClick={() => toggleParty(pid)} style={{ fontWeight: 600 }}>
                  {open ? '▼' : '►'} {partyName} ({total})
                </button>
                {open && (
                  <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                    {STATUS_ORDER.map((st) => {
                      const list = byStatus[st] || []
                      if (list.length === 0) return null
                      const stOpen = !!(expandedByStatus[pid]?.[st])
                      return (
                        <div key={st}>
                          <button className="link" onClick={() => toggleStatus(pid, st)} style={{ fontWeight: 500 }}>
                            {stOpen ? '▼' : '►'} {st} ({list.length})
                          </button>
                          {stOpen && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                              gap: 12,
                              marginTop: 8,
                            }}>
                              {list.map((d) => (
                                <Link to={`/discussions/${d.id}`} key={d.id} style={{ textDecoration: 'none' }}>
                                  <div className="card" style={{ padding: 12 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 8 }}>{d.subject}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>By {d.creatorName}</div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


