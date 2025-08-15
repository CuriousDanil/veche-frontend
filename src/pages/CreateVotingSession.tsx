import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Party = { id: string; name: string }
type Discussion = { id: string; subject: string; status: 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'; party: Party }

export default function CreateVotingSession() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const myPartyIds = user?.partyIds ?? []

  const [name, setName] = useState('')
  const [partyId, setPartyId] = useState('')
  const [discussionIds, setDiscussionIds] = useState<string[]>([])
  const [firstRoundStartsAt, setFirstRoundStartsAt] = useState('')
  const [secondRoundStartsAt, setSecondRoundStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [parties, setParties] = useState<Party[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          apiFetch('/api/parties'),
          apiFetch('/api/discussions'),
        ])
        if (!pRes.ok) throw new Error(`Parties failed: ${pRes.status}`)
        if (!dRes.ok) throw new Error(`Discussions failed: ${dRes.status}`)
        const p = (await pRes.json()) as Party[]
        const d = (await dRes.json()) as Discussion[]
        setParties(p)
        setDiscussions(d)
        if (!partyId) {
          const firstMyParty = p.find((pp) => myPartyIds.includes(pp.id))
          if (firstMyParty) setPartyId(firstMyParty.id)
        }
      } catch (e) {
        setStatus((e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const myParties = useMemo(() => parties.filter((p) => myPartyIds.includes(p.id)), [parties, myPartyIds.join(',')])
  const waitingDiscussions = useMemo(
    () => discussions.filter((d) => d.status === 'WAITING' && (!partyId || d.party.id === partyId)),
    [discussions, partyId],
  )

  function toggleDiscussion(id: string) {
    setDiscussionIds((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]))
  }

  function toInstantOrNull(value: string): string | null {
    if (!value) return null
    // value like 2025-08-14T12:30 -> convert to Z
    const asIso = value.endsWith('Z') ? value : `${value}:00Z`.replace(' ', 'T')
    return asIso
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const isValid = name.trim().length > 0 && partyId && discussionIds.length > 0
    if (!isValid) {
      setStatus('Please fill name, choose a party, and select at least one discussion.')
      return
    }
    setIsSubmitting(true)
    setStatus(null)
    try {
      const payload = {
        name,
        partyId,
        discussionIds,
        firstRoundStartsAt: toInstantOrNull(firstRoundStartsAt),
        secondRoundStartsAt: toInstantOrNull(secondRoundStartsAt),
        endsAt: toInstantOrNull(endsAt),
      }
      const res = await apiFetch('/api/voting-sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      navigate('/voting-sessions')
    } catch (err) {
      setStatus((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container container-narrow">
      <div style={{ paddingTop: 32, paddingBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Create voting session</h2>
      </div>
      <form className="form card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="text-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Party</label>
          {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
          {!loading && myParties.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No parties available.</p>
          )}
          {!loading && myParties.map((p) => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="radio" name="party" value={p.id} checked={partyId === p.id} onChange={() => setPartyId(p.id)} />
              {p.name}
            </label>
          ))}
        </div>
        <div className="field">
          <label>Discussions (WAITING)</label>
          {waitingDiscussions.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No WAITING discussions in this party.</p>
          )}
          <div style={{ display: 'grid', gap: 6 }}>
            {waitingDiscussions.map((d) => (
              <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  value={d.id}
                  checked={discussionIds.includes(d.id)}
                  onChange={() => toggleDiscussion(d.id)}
                />
                {d.subject}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>First round starts at (UTC)</label>
          <input type="datetime-local" className="text-input" value={firstRoundStartsAt} onChange={(e) => setFirstRoundStartsAt(e.target.value)} />
        </div>
        <div className="field">
          <label>Second round starts at (UTC)</label>
          <input type="datetime-local" className="text-input" value={secondRoundStartsAt} onChange={(e) => setSecondRoundStartsAt(e.target.value)} />
        </div>
        <div className="field">
          <label>Ends at (UTC)</label>
          <input type="datetime-local" className="text-input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create session'}
          </button>
        </div>
        {status && <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>{status}</p>}
      </form>
    </div>
  )
}


