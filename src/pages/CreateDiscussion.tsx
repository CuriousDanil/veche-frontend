import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { SkeletonText } from '../components/Skeleton'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import { getAccessPayload } from '../lib/auth'
import { parseApiErrorResponse } from '../lib/errors'

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
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

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
  const [actionType, setActionType] = useState<'NONE' | 'RENAME_PARTY' | 'RENAME_COMPANY'>('NONE')
  const [actionName, setActionName] = useState('')
  const { data: parties, error: partiesError, isLoading: loadingParties } = useSWR<Party[]>('/api/parties', swrJsonFetcher, { refreshInterval: 60000 })

  const myPartyIds = user?.partyIds ?? []
  const myParties = (parties || []).filter((p) => myPartyIds.includes(p.id))

  useEffect(() => {
    // Set party from URL parameter first
    const partyIdFromUrl = searchParams.get('partyId')
    if (partyIdFromUrl && myPartyIds.includes(partyIdFromUrl) && !form.partyId) {
      setForm((f) => ({ ...f, partyId: partyIdFromUrl }))
    } else if (!form.partyId && myParties.length === 1) {
      setForm((f) => ({ ...f, partyId: myParties[0].id }))
    }
    
    // Set action from URL parameters
    const actionTypeFromUrl = searchParams.get('actionType') as 'NONE' | 'RENAME_PARTY' | 'RENAME_COMPANY' | null
    const actionNameFromUrl = searchParams.get('actionName')
    const subjectFromUrl = searchParams.get('subject')
    
    if (actionTypeFromUrl && ['RENAME_PARTY', 'RENAME_COMPANY'].includes(actionTypeFromUrl)) {
      setActionType(actionTypeFromUrl)
      if (actionNameFromUrl) {
        setActionName(actionNameFromUrl)
      }
    }
    
    // Set subject from URL parameter if provided
    if (subjectFromUrl && !form.subject) {
      setForm((f) => ({ ...f, subject: subjectFromUrl }))
    }
  }, [parties?.length, searchParams, myPartyIds.join(','), myParties.length])



  async function submit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus(null)
    try {
      const res = await apiFetch('/api/discussions', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await parseApiErrorResponse(res))
      // attempt to read created discussion id
      let createdId: string | null = null
      try {
        const created = (await res.json()) as any
        createdId = created?.id ?? null
      } catch {
        createdId = null
      }
      // If user chose an action and we have an id, post the action
      if (actionType !== 'NONE' && createdId) {
        const companyId = getAccessPayload()?.companyId
        const payload = actionType === 'RENAME_PARTY'
          ? { type: 'RENAME_PARTY', partyId: form.partyId, newName: actionName }
          : { type: 'RENAME_COMPANY', companyId, newName: actionName }
        const aRes = await apiFetch(`/api/discussions/${createdId}/action`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        if (!aRes.ok) throw new Error(await parseApiErrorResponse(aRes))
      }
      navigate('/discussions')
    } catch (err) {
      setStatus((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container container-narrow">
      <div className="mt-8 mb-6 text-center">
        <h2>Create discussion</h2>
        <p className="text-secondary mt-2">Choose a party and define the subject and content.</p>
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
          <label>Select party</label>
          {loadingParties && <SkeletonText lines={2} />}
          {partiesError && <p className="text-secondary">{String(partiesError)}</p>}
          {!loadingParties && !partiesError && myParties.length === 0 && (
            <p className="text-secondary">No parties found for your account.</p>
          )}
          {!loadingParties && !partiesError && myParties.length > 0 && (
            <div className="radio-group">
              {myParties.map((p) => (
                <label 
                  key={p.id} 
                  className={`radio-option ${form.partyId === p.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="party"
                    value={p.id}
                    checked={form.partyId === p.id}
                    onChange={() => setForm({ ...form, partyId: p.id })}
                  />
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-tertiary" style={{ fontSize: 'var(--text-xs)' }}>
                      ID: {p.id}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        {/* Add action menu */}
        <div className="field">
          <label>Add action (optional)</label>
          <select className="select-input" value={actionType} onChange={(e) => setActionType(e.target.value as any)}>
            <option value="NONE">Select an action…</option>
            <option value="RENAME_PARTY">Rename party</option>
            <option value="RENAME_COMPANY">Rename company</option>
          </select>
          {(actionType === 'RENAME_PARTY' || actionType === 'RENAME_COMPANY') && (
            <div className="mt-3">
              <input
                className="text-input"
                placeholder="Enter new name"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="mt-2">
          <button className="primary-button" type="submit" disabled={isSubmitting || !form.partyId || !form.subject}>
            {isSubmitting ? 'Creating…' : 'Create discussion'}
          </button>
        </div>
        {status && <p className="mt-3 text-secondary">{status}</p>}
      </form>
    </div>
  )
}


