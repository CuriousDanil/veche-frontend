import { useMemo, useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguageNavigate } from '../hooks/useLanguage'
import { useAuth } from '../context/AuthContext'
import { createVotingSession } from '../lib/votingSessions'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import { Skeleton, SkeletonText } from '../components/Skeleton'

type Party = { id: string; name: string }
type Discussion = { id: string; subject: string; status: 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'; party: Party }

export default function CreateVotingSession() {
  const { t } = useTranslation('sessions')
  const languageNavigate = useLanguageNavigate()
  const [searchParams] = useSearchParams()
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

  const { data: parties, isLoading: pLoad } = useSWR<Party[]>('/api/parties', swrJsonFetcher, { refreshInterval: 60000 })
  const { data: discussions, isLoading: dLoad } = useSWR<Discussion[]>('/api/discussions', swrJsonFetcher, { refreshInterval: 5000 })
  useEffect(() => {
    // Set party from URL parameter first
    const partyIdFromUrl = searchParams.get('partyId')
    if (partyIdFromUrl && myPartyIds.includes(partyIdFromUrl) && !partyId) {
      setPartyId(partyIdFromUrl)
    } else if (!partyId && parties && myPartyIds.length > 0) {
      const firstMyParty = parties.find((pp) => myPartyIds.includes(pp.id))
      if (firstMyParty) setPartyId(firstMyParty.id)
    }
  }, [parties?.length, myPartyIds.join(','), searchParams])

  const myParties = useMemo(() => (parties || []).filter((p) => myPartyIds.includes(p.id)), [parties, myPartyIds.join(',')])
  const waitingDiscussions = useMemo(
    () => (discussions || []).filter((d) => d.status === 'WAITING' && (!partyId || d.party.id === partyId)),
    [discussions, partyId],
  )

  function toggleDiscussion(id: string) {
    setDiscussionIds((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]))
  }

  function toInstantOrNull(value: string): string | null {
    if (!value) return null
    // value like 2025-08-14T12:30 -> convert to Z
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

  async function submit(e: FormEvent) {
    e.preventDefault()
    const isValid = name.trim().length > 0 && partyId && discussionIds.length > 0
    if (!isValid) {
      setStatus(t('create.validation.fillRequired', 'Please fill name, choose a party, and select at least one discussion.'))
      return
    }
    setIsSubmitting(true)
    setStatus(null)
    try {
      await createVotingSession({
        name,
        partyId,
        discussionIds,
        firstRoundStartsAt: toInstantOrNull(firstRoundStartsAt),
        secondRoundStartsAt: toInstantOrNull(secondRoundStartsAt),
        endsAt: toInstantOrNull(endsAt),
      })
      languageNavigate('/voting-sessions')
    } catch (err) {
      setStatus((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container container-narrow">
      <div className="mt-8 mb-6 text-center">
        <h2>{t('create.title', 'Create voting session')}</h2>
        <p className="text-secondary mt-2">{t('create.subtitle', 'Organize discussions into a structured voting session with time-based rounds.')}</p>
      </div>
      <form className="form card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">{t('create.name.label', 'Name')}</label>
          <input 
            id="name" 
            className="text-input" 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder={t('create.name.placeholder', 'Enter session name')}
          />
        </div>
        <div className="field">
          <label>{t('create.selectParty', 'Select party')}</label>
          {(pLoad || dLoad) && <SkeletonText lines={2} />}
          {!pLoad && myParties.length === 0 && (
            <p className="text-secondary">{t('create.noParties', 'No parties available.')}</p>
          )}
          {!pLoad && myParties.length > 0 && (
            <div className="radio-group">
              {myParties.map((p) => (
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
        <div className="field">
          <label>{t('create.selectDiscussions', 'Select discussions (WAITING status)')}</label>
          {!dLoad && waitingDiscussions.length === 0 && (
            <p className="text-secondary">{t('create.noDiscussions', 'No WAITING discussions available in this party.')}</p>
          )}
          {!dLoad && waitingDiscussions.length > 0 && (
            <div className="checkbox-group">
              {waitingDiscussions.map((d) => (
                <label 
                  key={d.id} 
                  className={`checkbox-option ${discussionIds.includes(d.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    value={d.id}
                    checked={discussionIds.includes(d.id)}
                    onChange={() => toggleDiscussion(d.id)}
                  />
                  <span className="font-medium">{d.subject}</span>
                </label>
              ))}
            </div>
          )}
          {dLoad && (
            <div className="checkbox-group">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="checkbox-option">
                  <Skeleton style={{ height: 12, width: 220 }} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="field">
          <label htmlFor="firstRoundStartsAt">{t('create.timeFields.firstRound', 'First round starts at')}</label>
          <input 
            id="firstRoundStartsAt"
            className="text-input" 
            type="datetime-local" 
            value={firstRoundStartsAt} 
            onChange={(e) => setFirstRoundStartsAt(e.target.value)} 
          />
          <div className="text-tertiary mt-2" style={{ fontSize: 'var(--text-xs)' }}>
            {t('create.timeFields.utcNote', 'All times are in UTC. Participants will see times in their local timezone.')}
          </div>
        </div>
        <div className="field">
          <label htmlFor="secondRoundStartsAt">{t('create.timeFields.secondRound', 'Second round starts at')}</label>
          <input 
            id="secondRoundStartsAt"
            className="text-input" 
            type="datetime-local" 
            value={secondRoundStartsAt} 
            onChange={(e) => setSecondRoundStartsAt(e.target.value)} 
          />
        </div>
        <div className="field">
          <label htmlFor="endsAt">{t('create.timeFields.endsAt', 'Session ends at')}</label>
          <input 
            id="endsAt"
            className="text-input" 
            type="datetime-local" 
            value={endsAt} 
            onChange={(e) => setEndsAt(e.target.value)} 
          />
        </div>
        <div className="button-group mt-6">
          <button 
            className="primary-button" 
            type="submit" 
            disabled={isSubmitting || !name.trim() || !partyId || discussionIds.length === 0}
          >
            {isSubmitting ? t('create.submitting', 'Creating…') : t('create.button', 'Create session')}
          </button>
          <button 
            type="button" 
            className="secondary-button" 
            onClick={() => languageNavigate('/voting-sessions')}
          >
            {t('common:buttons.cancel', 'Cancel')}
          </button>
        </div>
        {status && <p className="mt-4 text-secondary">{status}</p>}
      </form>
    </div>
  )
}


