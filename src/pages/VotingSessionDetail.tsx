import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { updateVotingSession } from '../lib/votingSessions'
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
  let asIso = value.replace(' ', 'T')
  if (!asIso.endsWith('Z')) {
    // Add seconds if not present
    if (asIso.match(/T\d{2}:\d{2}$/)) {
      asIso += ':00'
    }
    asIso += 'Z'
  }
  return asIso
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
      await updateVotingSession(id!, {
        name,
        partyId,
        discussionIds: selectedDiscussionIds,
        firstRoundStart: toInstantOrNull(firstRound),
        secondRoundStart: toInstantOrNull(secondRound),
        endTime: toInstantOrNull(endsAt),
      })
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
        <div className="card">
          <Skeleton style={{ height: 28, width: '60%', marginBottom: 16 }} />
          <Skeleton style={{ height: 20, width: '40%', marginBottom: 12 }} />
          <Skeleton style={{ height: 180, width: '100%', borderRadius: 12 }} />
        </div>
      )}
      {(sErr || dErr || pErr || error) && <p className="text-secondary">{String(sErr || dErr || pErr || error)}</p>}
      {session && (
        <div className="mt-8">
          {/* Header and edit action */}
          <div className="mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
            {isEditing ? (
              <input 
                className="text-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={{ fontSize: 'var(--text-2xl)', fontWeight: 600 }}
              />
            ) : (
              <div>
                <h2>{session.name}</h2>
                <div className="mt-1">
                  <span className={`status-badge ${session.status.toLowerCase().replace('_', '-')}`}>
                    {session.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}
            {canEdit && (
              <div className="button-group">
                {!isEditing ? (
                  <button className="secondary-button" onClick={startEdit}>Edit</button>
                ) : (
                  <>
                    <button className="primary-button" onClick={saveEdit}>Save</button>
                    <button className="secondary-button" onClick={cancelEdit}>Cancel</button>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="card">
            <div className="form">{/* This will wrap all the form fields */}

            {/* Party */}
            <div className="field">
              <label>Party</label>
              {!isEditing ? (
                <div className="font-medium">{session.party.name}</div>
              ) : (
                <div className="radio-group">
                  {editableParties.map((p) => (
                    <label key={p.id} className={`radio-option ${partyId === p.id ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="party" 
                        value={p.id} 
                        checked={partyId === p.id} 
                        onChange={() => setPartyId(p.id)} 
                      />
                      <span className="font-medium">{p.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="field">
              <label>First round starts at</label>
              {!isEditing ? (
                <div>
                  <div className="font-medium">{formatEuFromIso(session.firstRoundStart)}</div>
                  {session.firstRoundStart && (
                    <div className="text-tertiary mt-1" style={{ fontSize: 'var(--text-xs)' }}>
                      {timeLeftDhM(session.firstRoundStart)} remaining
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input 
                    className="text-input" 
                    type="datetime-local" 
                    value={firstRound} 
                    onChange={(e) => setFirstRound(e.target.value)} 
                  />
                  <div className="text-tertiary mt-2" style={{ fontSize: 'var(--text-xs)' }}>
                    Preview: {formatEuFromInput(firstRound)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="field">
              <label>Second round starts at</label>
              {!isEditing ? (
                <div>
                  <div className="font-medium">{formatEuFromIso(session.secondRoundStart)}</div>
                  {session.secondRoundStart && (
                    <div className="text-tertiary mt-1" style={{ fontSize: 'var(--text-xs)' }}>
                      {timeLeftDhM(session.secondRoundStart)} remaining
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input 
                    className="text-input" 
                    type="datetime-local" 
                    value={secondRound} 
                    onChange={(e) => setSecondRound(e.target.value)} 
                  />
                  <div className="text-tertiary mt-2" style={{ fontSize: 'var(--text-xs)' }}>
                    Preview: {formatEuFromInput(secondRound)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="field">
              <label>Session ends at</label>
              {!isEditing ? (
                <div>
                  <div className="font-medium">{formatEuFromIso(session.endTime)}</div>
                  {session.endTime && (
                    <div className="text-tertiary mt-1" style={{ fontSize: 'var(--text-xs)' }}>
                      {timeLeftDhM(session.endTime)} remaining
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input 
                    className="text-input" 
                    type="datetime-local" 
                    value={endsAt} 
                    onChange={(e) => setEndsAt(e.target.value)} 
                  />
                  <div className="text-tertiary mt-2" style={{ fontSize: 'var(--text-xs)' }}>
                    Preview: {formatEuFromInput(endsAt)}
                  </div>
                </div>
              )}
            </div>

            {/* Discussions */}
            <div className="field">
              <label>Discussions ({session.discussions.length})</label>
              {!isEditing ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 'var(--space-md)',
                }}>
                  {session.discussions.map((d) => (
                    <Link 
                      key={d.id} 
                      to={`/discussions/${d.id}`} 
                      className="card" 
                      style={{ 
                        padding: 'var(--space-md)', 
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-xs)'
                      }}
                    >
                      <div className="font-semibold">{d.subject}</div>
                      <span className={`status-badge ${d.status.toLowerCase().replace('_', '-')}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="checkbox-group">
                  {poolDiscussions.map((d) => (
                    <label 
                      key={d.id} 
                      className={`checkbox-option ${selectedDiscussionIds.includes(d.id) ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        value={d.id}
                        checked={selectedDiscussionIds.includes(d.id)}
                        onChange={() => toggleDiscussion(d.id)}
                      />
                      <div>
                        <div className="font-medium">{d.subject}</div>
                        <div className="text-tertiary" style={{ fontSize: 'var(--text-xs)' }}>
                          Status: {d.status}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            </div> {/* End form */}
            {statusMsg && <p className="mt-4 text-secondary">{statusMsg}</p>}
          </div> {/* End card */}
        </div>
      )}
    </div>
  )
}


