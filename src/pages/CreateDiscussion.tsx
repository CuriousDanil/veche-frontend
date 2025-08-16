import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { SkeletonText } from '../components/Skeleton'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'

type CreateDiscussionPayload = {
  subject: string
  content: string
  partyId: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

type Party = { id: string; name: string }

export default function CreateDiscussion() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState<CreateDiscussionPayload>({
    subject: '',
    content: '',
    partyId: '',
    fileUrl: '',
    fileName: '',
    fileSize: 0,
  })
  const [status, setStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: parties, error: partiesError, isLoading: loadingParties } = useSWR<Party[]>('/api/parties', swrJsonFetcher, { refreshInterval: 60000 })

  const myPartyIds = user?.partyIds ?? []
  const myParties = (parties || []).filter((p) => myPartyIds.includes(p.id))

  useEffect(() => {
    if (!form.partyId && myParties.length === 1) {
      setForm((f) => ({ ...f, partyId: myParties[0].id }))
    }
  }, [parties?.length])

  useEffect(() => {
    if (!form.partyId && myParties.length === 1) {
      setForm((f) => ({ ...f, partyId: myParties[0].id }))
    }
  }, [myParties.length])

  function toggleExpanded() {
    setExpanded((v) => !v)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus(null)
    try {
      const res = await apiFetch('/api/discussions', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      navigate('/discussions')
    } catch (err) {
      setStatus((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container container-narrow">
      <div style={{ paddingTop: 32, paddingBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Create discussion</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Choose a party and define the subject and content.</p>
      </div>
      <form className="form card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input id="subject" className="text-input" type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="content">Content</label>
          <textarea id="content" className="text-input" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
        <div className="field">
          <label>Party</label>
          <button type="button" className="primary-button" onClick={toggleExpanded}>
            {expanded ? 'Hide parties' : 'Choose party'}
          </button>
          {expanded && (
            <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
              {loadingParties && <SkeletonText lines={2} />}
              {partiesError && <p style={{ color: 'var(--text-secondary)' }}>{String(partiesError)}</p>}
              {!loadingParties && !partiesError && myParties.length === 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>No parties found for your account.</p>
              )}
              {!loadingParties && !partiesError && myParties.map((p) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="radio"
                    name="party"
                    value={p.id}
                    checked={form.partyId === p.id}
                    onChange={() => setForm({ ...form, partyId: p.id })}
                  />
                  <span>{p.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    ({p.id})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="primary-button" type="submit" disabled={isSubmitting || !form.partyId || !form.subject}>
            {isSubmitting ? 'Creating…' : 'Create discussion'}
          </button>
        </div>
        {status && <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>{status}</p>}
      </form>
    </div>
  )
}


