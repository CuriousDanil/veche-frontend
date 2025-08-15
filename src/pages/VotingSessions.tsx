import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Party = { id: string; name: string }
type VotingSession = {
  id: string
  name: string
  party: Party
  status: 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'
}

const STATUS_ORDER: VotingSession['status'][] = ['WAITING', 'VOTING', 'FINAL_VOTING', 'RESOLVED', 'ARCHIVED']
const DEFAULT_EXPANDED_STATUSES = new Set(['WAITING', 'VOTING', 'FINAL_VOTING'])

export default function VotingSessions() {
  const { user } = useAuth()
  const myPartyIds = user?.partyIds ?? []
  const [items, setItems] = useState<VotingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expandedParties, setExpandedParties] = useState<Record<string, boolean>>({})
  const [expandedByStatus, setExpandedByStatus] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiFetch('/api/voting-sessions')
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = (await res.json()) as VotingSession[]
        setItems(data)
        // default expansions: my parties expanded, and waiting/voting/final_voting inside each
        const partyDefaults: Record<string, boolean> = {}
        const statusDefaults: Record<string, Record<string, boolean>> = {}
        for (const s of data) {
          if (myPartyIds.includes(s.party.id)) partyDefaults[s.party.id] = true
          if (!statusDefaults[s.party.id]) statusDefaults[s.party.id] = {}
          if (DEFAULT_EXPANDED_STATUSES.has(s.status)) statusDefaults[s.party.id][s.status] = true
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
    const byParty: Record<string, { party: Party; byStatus: Record<string, VotingSession[]> }> = {}
    for (const s of items) {
      if (!byParty[s.party.id]) byParty[s.party.id] = { party: s.party, byStatus: {} }
      if (!byParty[s.party.id].byStatus[s.status]) byParty[s.party.id].byStatus[s.status] = []
      byParty[s.party.id].byStatus[s.status].push(s)
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
        <h2 style={{ margin: 0 }}>Voting sessions</h2>
        <Link to="/voting-sessions/new" className="primary-button">New session</Link>
      </div>
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--text-secondary)' }}>{error}</p>}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: 16 }}>
          {Object.values(grouped).map(({ party, byStatus }) => {
            const totalInParty = Object.values(byStatus).reduce((acc, arr) => acc + arr.length, 0)
            const isPartyOpen = !!expandedParties[party.id]
            return (
              <div key={party.id} className="card" style={{ padding: 16 }}>
                <button className="link" onClick={() => toggleParty(party.id)} style={{ fontWeight: 600 }}>
                  {isPartyOpen ? '▼' : '►'} {party.name} ({totalInParty})
                </button>
                {isPartyOpen && (
                  <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                    {STATUS_ORDER.map((st) => {
                      const list = byStatus[st] || []
                      if (list.length === 0) return null
                      const stOpen = !!(expandedByStatus[party.id]?.[st])
                      return (
                        <div key={st}>
                          <button className="link" onClick={() => toggleStatus(party.id, st)} style={{ fontWeight: 500 }}>
                            {stOpen ? '▼' : '►'} {st} ({list.length})
                          </button>
                          {stOpen && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                              gap: 12,
                              marginTop: 8,
                            }}>
                              {list.map((s) => (
                                <Link to={`/voting-sessions/${s.id}`} key={s.id} style={{ textDecoration: 'none' }}>
                                  <div className="card" style={{ padding: 12 }}>
                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
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


