import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { formatEuFromIso, formatEuFromInput, timeLeftDhM } from '../lib/datetime'
import { Skeleton, SkeletonText } from '../components/Skeleton'

type Party = { id: string; name: string }
type Discussion = { id: string; subject: string; status: string; party: Party }
type VotingSession = {
  id: string
  name: string
  party: Party
  status: 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'
  discussions: Discussion[]
  firstRoundStart?: string | null
  secondRoundStart?: string | null
  endTime?: string | null
}

function toInputValue(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

function toInstantOrNull(value: string): string | null {
  if (!value) return null
  // Browser provides local-like string `YYYY-MM-DDTHH:mm`; send as ISO with seconds and Z
  return `${value}:00Z`
}

export default function VotingSessionDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const canEdit = !!user?.canManageSessions

  const [session, setSession] = useState<VotingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allDiscussions, setAllDiscussions] = useState<Discussion[]>([])
  const [parties, setParties] = useState<Party[]>([])

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [partyId, setPartyId] = useState('')
  const [selectedDiscussionIds, setSelectedDiscussionIds] = useState<string[]>([])
  const [firstRound, setFirstRound] = useState('')
  const [secondRound, setSecondRound] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const { data: sData, error: sErr, isLoading: sLoad } = useSWR<VotingSession>(id ? `/api/voting-sessions/${id}` : null, swrJsonFetcher, { refreshInterval: 5000 })
  const { data: dData, error: dErr, isLoading: dLoad } = useSWR<Discussion[]>('/api/discussions', swrJsonFetcher, { refreshInterval: 5000 })
  const { data: pData, error: pErr, isLoading: pLoad } = useSWR<Party[]>('/api/parties', swrJsonFetcher, { refreshInterval: 60000 })
  useEffect(() => {
    try {
      if (!sData || !dData || !pData) return
      setSession(sData)
      setAllDiscussions(dData)
      setParties(pData)
      setName(sData.name)
      setPartyId(sData.party.id)
      setSelectedDiscussionIds((sData.discussions || []).map((d) => d.id))
      setFirstRound(toInputValue(sData.firstRoundStart))
      setSecondRound(toInputValue(sData.secondRoundStart))
      setEndsAt(toInputValue(sData.endTime))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [sData, dData, pData])

  const myPartyIds = user?.partyIds ?? []
  const editableParties = useMemo(() => parties.filter((p) => myPartyIds.includes(p.id)), [parties, myPartyIds.join(',')])
  const poolDiscussions = useMemo(() => allDiscussions.filter((d) => d.party.id === partyId), [allDiscussions, partyId])

  function toggleDiscussion(id: string) {
    setSelectedDiscussionIds((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]))
  }

  function startEdit() {
    setIsEditing(true)
  }

  function cancelEdit() {
    if (!session) return
    setIsEditing(false)
    setName(session.name)
    setPartyId(session.party.id)
    setSelectedDiscussionIds(session.discussions.map((d) => d.id))
    setFirstRound(toInputValue(session.firstRoundStart))
    setSecondRound(toInputValue(session.secondRoundStart))
    setEndsAt(toInputValue(session.endTime))
    setStatusMsg(null)
  }

  async function saveEdit() {
    if (!name.trim() || !partyId || selectedDiscussionIds.length === 0) {
      setStatusMsg('Please provide name, party, and at least one discussion.')
      return
    }
    try {
      setStatusMsg(null)
      const payload = {
        name,
        partyId,
        discussionIds: selectedDiscussionIds,
        firstRoundStart: toInstantOrNull(firstRound),
        secondRoundStart: toInstantOrNull(secondRound),
        endTime: toInstantOrNull(endsAt),
      }
      const res = await apiFetch(`/api/voting-sessions/${id}` , {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`)
      // refetch fresh session
      const fresh = await apiFetch(`/api/voting-sessions/${id}`)
      if (!fresh.ok) throw new Error(`Failed to reload: ${fresh.status}`)
      const s = (await fresh.json()) as VotingSession
      setSession(s)
      setIsEditing(false)
      setStatusMsg('Saved')
    } catch (e) {
      setStatusMsg((e as Error).message)
    }
  }

  return (
    <div className="container container-narrow">
      {(sLoad || dLoad || pLoad) && (
        <div className="card" style={{ padding: 24 }}>
          <Skeleton style={{ height: 28, width: '60%', marginBottom: 16 }} />
          <Skeleton style={{ height: 20, width: '40%', marginBottom: 12 }} />
          <Skeleton style={{ height: 180, width: '100%', borderRadius: 12 }} />
        </div>
      )}
      {(sErr || dErr || pErr || error) && <p style={{ color: 'var(--text-secondary)' }}>{String(sErr || dErr || pErr || error)}</p>}
      {session && (
        <div className="card" style={{ padding: 24 }}>
          {/* Header and edit action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {isEditing ? (
              <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} />
            ) : (
              <h2 style={{ margin: 0 }}>{session.name}</h2>
            )}
            {canEdit && (
              <div style={{ display: 'flex', gap: 8 }}>
                {!isEditing ? (
                  <button className="primary-button" onClick={startEdit}>Edit</button>
                ) : (
                  <>
                    <button className="primary-button" onClick={saveEdit}>Save</button>
                    <button className="primary-button" onClick={cancelEdit}>Cancel</button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Party */}
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Party</label>
            {!isEditing ? (
              <div>{session.party.name}</div>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {editableParties.map((p) => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="radio" name="party" value={p.id} checked={partyId === p.id} onChange={() => setPartyId(p.id)} />
                    {p.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>First round starts at (UTC)</label>
              {!isEditing ? (
                <div>
                  {formatEuFromIso(session.firstRoundStart)}
                  {session.firstRoundStart && (
                    <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>({timeLeftDhM(session.firstRoundStart)} left)</span>
                  )}
                </div>
              ) : (
                <>
                  <input type="datetime-local" className="text-input" value={firstRound} onChange={(e) => setFirstRound(e.target.value)} />
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>{formatEuFromInput(firstRound)}</div>
                </>
              )}
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Second round starts at (UTC)</label>
              {!isEditing ? (
                <div>
                  {formatEuFromIso(session.secondRoundStart)}
                  {session.secondRoundStart && (
                    <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>({timeLeftDhM(session.secondRoundStart)} left)</span>
                  )}
                </div>
              ) : (
                <>
                  <input type="datetime-local" className="text-input" value={secondRound} onChange={(e) => setSecondRound(e.target.value)} />
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>{formatEuFromInput(secondRound)}</div>
                </>
              )}
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Ends at (UTC)</label>
              {!isEditing ? (
                <div>
                  {formatEuFromIso(session.endTime)}
                  {session.endTime && (
                    <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>({timeLeftDhM(session.endTime)} left)</span>
                  )}
                </div>
              ) : (
                <>
                  <input type="datetime-local" className="text-input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>{formatEuFromInput(endsAt)}</div>
                </>
              )}
            </div>
          </div>

          {/* Discussions */}
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 6 }}>Discussions</label>
            {!isEditing ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}>
                {session.discussions.map((d) => (
                  <Link key={d.id} to={`/discussions/${d.id}`} className="card" style={{ padding: 12, textDecoration: 'none' }}>
                    <div style={{ fontWeight: 600 }}>{d.subject}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {poolDiscussions.map((d) => (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      value={d.id}
                      checked={selectedDiscussionIds.includes(d.id)}
                      onChange={() => toggleDiscussion(d.id)}
                    />
                    <span>{d.subject}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>({d.status})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {statusMsg && <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>{statusMsg}</p>}
        </div>
      )}
    </div>
  )
}


