import { useEffect, useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguageNavigate } from '../hooks/useLanguage'
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
  const { t } = useTranslation('discussions')
  const languageNavigate = useLanguageNavigate()
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
  const [actionType, setActionType] = useState<'NONE' | 'RENAME_PARTY' | 'RENAME_COMPANY' | 'EVICT_USER_FROM_PARTY' | 'DELETE_PARTY'>('NONE')
  const [actionName, setActionName] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const { data: parties, error: partiesError, isLoading: loadingParties } = useSWR<Party[]>('/api/parties', swrJsonFetcher, { refreshInterval: 60000 })
  const { data: company } = useSWR<any>('/api/company/my-company', swrJsonFetcher, { refreshInterval: 60000 })

  const myPartyIds = user?.partyIds ?? []
  const myParties = (parties || []).filter((p) => myPartyIds.includes(p.id))
  
  // Get users for selected party (for evict action)
  const selectedPartyUsers = useMemo(() => {
    if (!company || !form.partyId) return []
    return company.users.filter((u: any) => 
      u.parties.some((p: any) => p.id === form.partyId)
    )
  }, [company, form.partyId])

  useEffect(() => {
    // Set party from URL parameter first
    const partyIdFromUrl = searchParams.get('partyId')
    if (partyIdFromUrl && myPartyIds.includes(partyIdFromUrl) && !form.partyId) {
      setForm((f) => ({ ...f, partyId: partyIdFromUrl }))
    } else if (!form.partyId && myParties.length === 1) {
      setForm((f) => ({ ...f, partyId: myParties[0].id }))
    }
    
    // Set action from URL parameters
    const actionTypeFromUrl = searchParams.get('actionType') as 'NONE' | 'RENAME_PARTY' | 'RENAME_COMPANY' | 'EVICT_USER_FROM_PARTY' | 'DELETE_PARTY' | null
    const actionNameFromUrl = searchParams.get('actionName')
    const userIdFromUrl = searchParams.get('userId')
    const subjectFromUrl = searchParams.get('subject')
    
    if (actionTypeFromUrl && ['RENAME_PARTY', 'RENAME_COMPANY', 'EVICT_USER_FROM_PARTY', 'DELETE_PARTY'].includes(actionTypeFromUrl)) {
      setActionType(actionTypeFromUrl)
      if (actionNameFromUrl) {
        setActionName(actionNameFromUrl)
      }
      if (userIdFromUrl) {
        setSelectedUserId(userIdFromUrl)
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
        let payload: any
        
        switch (actionType) {
          case 'RENAME_PARTY':
            payload = { type: 'RENAME_PARTY', partyId: form.partyId, newName: actionName }
            break
          case 'RENAME_COMPANY':
            payload = { type: 'RENAME_COMPANY', companyId, newName: actionName }
            break
          case 'EVICT_USER_FROM_PARTY':
            payload = { type: 'EVICT_USER_FROM_PARTY', partyId: form.partyId, userId: selectedUserId }
            break
          case 'DELETE_PARTY':
            payload = { type: 'DELETE_PARTY', partyId: form.partyId }
            break
        }
        
        const aRes = await apiFetch(`/api/discussions/${createdId}/action`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        if (!aRes.ok) throw new Error(await parseApiErrorResponse(aRes))
      }
      languageNavigate('/discussions')
    } catch (err) {
      setStatus((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container container-narrow">
      <div className="mt-8 mb-6 text-center">
        <h2>{t('create.title', 'Create discussion')}</h2>
        <p className="text-secondary mt-2">{t('create.subtitle', 'Choose a party and define the subject and content.')}</p>
      </div>
      <form className="form card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="subject">{t('create.subject.label', 'Subject')}</label>
          <input 
            id="subject" 
            className="text-input" 
            type="text" 
            required 
            value={form.subject} 
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder={t('create.subject.placeholder', 'Enter discussion subject')}
          />
        </div>
        <div className="field">
          <label htmlFor="content">{t('create.content.label', 'Content')}</label>
          <textarea 
            id="content" 
            className="text-input" 
            rows={5} 
            value={form.content} 
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder={t('create.content.placeholder', 'Enter discussion content')}
          />
        </div>
        <div className="field">
          <label>{t('create.selectParty', 'Select party')}</label>
          {loadingParties && <SkeletonText lines={2} />}
          {partiesError && <p className="text-secondary">{String(partiesError)}</p>}
          {!loadingParties && !partiesError && myParties.length === 0 && (
            <p className="text-secondary">{t('create.noParties', 'No parties found for your account.')}</p>
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
          <label>{t('create.actions.label', 'Add action (optional)')}</label>
          <select className="select-input" value={actionType} onChange={(e) => setActionType(e.target.value as any)}>
            <option value="NONE">{t('create.actions.select', 'Select an action…')}</option>
            <option value="RENAME_PARTY">{t('create.actions.renameParty', 'Rename party')}</option>
            <option value="RENAME_COMPANY">{t('create.actions.renameCompany', 'Rename company')}</option>
            <option value="EVICT_USER_FROM_PARTY">{t('create.actions.evictUser', 'Evict user from party')}</option>
            <option value="DELETE_PARTY">{t('create.actions.deleteParty', 'Delete party')}</option>
          </select>
          {(actionType === 'RENAME_PARTY' || actionType === 'RENAME_COMPANY') && (
            <div className="mt-3">
              <input
                className="text-input"
                placeholder={t('create.actions.newNamePlaceholder', 'Enter new name')}
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
              />
            </div>
          )}
          {actionType === 'EVICT_USER_FROM_PARTY' && (
            <div className="mt-3">
              <label>{t('create.actions.selectUser', 'Select user to evict')}</label>
              {!form.partyId && (
                <p className="text-secondary">{t('create.selectParty', 'Select party first')}</p>
              )}
              {form.partyId && selectedPartyUsers.length === 0 && (
                <p className="text-secondary">{t('create.actions.noUsers', 'No users available in selected party')}</p>
              )}
              {form.partyId && selectedPartyUsers.length > 0 && (
                <div className="radio-group mt-2">
                  {selectedPartyUsers.map((u: any) => (
                    <label 
                      key={u.id} 
                      className={`radio-option ${selectedUserId === u.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="user"
                        value={u.id}
                        checked={selectedUserId === u.id}
                        onChange={() => setSelectedUserId(u.id)}
                      />
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-tertiary" style={{ fontSize: 'var(--text-xs)' }}>
                          {u.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-2">
          <button 
            className="primary-button" 
            type="submit" 
            disabled={
              isSubmitting || 
              !form.partyId || 
              !form.subject ||
              (actionType === 'EVICT_USER_FROM_PARTY' && !selectedUserId)
            }
          >
            {isSubmitting ? t('create.submitting', 'Creating…') : t('create.button', 'Create discussion')}
          </button>
        </div>
        {status && <p className="mt-3 text-secondary">{status}</p>}
      </form>
    </div>
  )
}


