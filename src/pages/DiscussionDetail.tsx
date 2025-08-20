import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../lib/api'
import { postComment, patchComment } from '../lib/comments'
import { patchDiscussion } from '../lib/discussions'
import type { Comment } from '../types'
import { useAuth } from '../context/AuthContext'
import { getAccessPayload } from '../lib/auth'
import { parseApiErrorResponse, parseUnknownError } from '../lib/errors'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import { Skeleton } from '../components/Skeleton'

type Party = { id: string; name: string }
type Vote = { id: string; authorId: string; voteValue: 'AGREE' | 'DISAGREE' }
type ActionItem = { id: string; actionType: string; payload: string }
type Discussion = {
  id: string
  subject: string
  content: string
  party: Party
  creatorName: string
  status: 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'
  votes: Vote[]
  actions?: ActionItem[]
}

export default function DiscussionDetail() {
  const { t } = useTranslation(['discussions', 'common'])
  const { id } = useParams()
  const { user } = useAuth()
  const [item, setItem] = useState<Discussion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDisagree, setShowDisagree] = useState(false)
  const [comment, setComment] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [isCastingVote, setIsCastingVote] = useState(false)
  // Actions (rename party/company)
  const [actionType, setActionType] = useState<'NONE' | 'RENAME_PARTY' | 'RENAME_COMPANY'>('NONE')
  const [actionName, setActionName] = useState('')

  const isAuthor = useMemo(() => {
    // if token contains sub and matches some author id (not provided), we fall back to permitting edit by capability
    return !!user?.canManageSessions || !!user?.canManageUsers // approximate until author id is known
  }, [user])

  const minCommentLen = 10
  const trimmedLen = comment.trim().length
  const isCommentValid = trimmedLen >= minCommentLen

  const reload = useCallback(async () => {
    try {
      // Prefer single fetch endpoint if available
      let d: Discussion | null = null
      const single = await apiFetch(`/api/discussions/${id}`)
      if (single.ok) {
        d = (await single.json()) as Discussion
      } else {
        const res = await apiFetch(`/api/discussions`)
        if (res.ok) {
          const data = (await res.json()) as Discussion[]
          d = data.find((x) => x.id === id) ?? null
        }
      }
      if (!d) throw new Error('Discussion not found')
      setItem(d)
      setEditTitle(d.subject)
      setEditBody(d.content)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  const saveDiscussion = useCallback(async () => {
    if (!id) return
    setIsSaving(true)
    try {
      await patchDiscussion(id, {
        subject: editTitle.trim(),
        content: editBody.trim()
      })
      // Reload the discussion to get the updated data
      await reload()
      setIsEditing(false)
      setStatusMsg('Discussion updated successfully')
      setTimeout(() => setStatusMsg(null), 3000)
    } catch (e) {
      setStatusMsg(`Failed to save: ${(e as Error).message}`)
      setTimeout(() => setStatusMsg(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }, [id, editTitle, editBody, reload])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function castVote(vote: 'AGREE' | 'DISAGREE') {
    if (!id) return
    try {
      setIsCastingVote(true)
      setStatusMsg(null)
      const res = await apiFetch(`/api/discussions/${id}/vote?vote=${vote}`, { method: 'POST' })
      if (!res.ok) {
        setStatusMsg(await parseApiErrorResponse(res))
        return
      }
      await reload()
    } catch (e) {
      setStatusMsg(parseUnknownError(e))
    } finally {
      setIsCastingVote(false)
    }
  }

  const { data: commentsData, error: commentsErr, isLoading: commentsLoad, mutate: mutateComments } = useSWR<Comment[]>(
    id ? `/api/discussions/${id}/comments` : null,
    swrJsonFetcher,
    { refreshInterval: 5000 },
  )
  useEffect(() => {
    if (commentsErr) setCommentsError(String(commentsErr))
    setCommentsLoading(Boolean(commentsLoad))
    if (commentsData) setComments(commentsData)
  }, [commentsData, commentsErr, commentsLoad])

  return (
    <div className="container container-narrow">
      {loading && (
        <div className="card" style={{ padding: 24 }}>
          <Skeleton style={{ height: 28, width: '70%', marginBottom: 12 }} />
          <Skeleton style={{ height: 12, width: '50%', marginBottom: 8 }} />
          <Skeleton style={{ height: 200, width: '100%', borderRadius: 12 }} />
        </div>
      )}
      {error && <p style={{ color: 'var(--text-secondary)' }}>{error}</p>}
      {item && (
        <div className="mt-8">
          {/* Header Section */}
          <div className="mb-6" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-lg)' }}>
            <div style={{ flex: 1 }}>
              {!isEditing ? (
                <div>
                  <h2 className="mb-2">{item.subject}</h2>
                  <div className="mb-3">
                    <span className={`status-badge ${item.status.toLowerCase().replace('_', '-')}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-secondary">
                    by {item.creatorName} • {item.party.name}
                  </div>
                </div>
              ) : (
                <div>
                  <input 
                    className="text-input mb-3" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ fontSize: 'var(--text-2xl)', fontWeight: 600 }}
                  />
                </div>
              )}
            </div>
            {isAuthor && (
              <div className="button-group">
                {!isEditing ? (
                  <button className="secondary-button" onClick={() => setIsEditing(true)}>{t('detail.edit', 'Edit')}</button>
                ) : (
                  <>
                    <button className="primary-button" onClick={saveDiscussion} disabled={isSaving}>
                      {isSaving ? t('detail.saving', 'Saving...') : t('detail.save', 'Save')}
                    </button>
                    <button className="secondary-button" onClick={() => { setIsEditing(false); setEditTitle(item.subject); setEditBody(item.content); }}>{t('detail.cancel', 'Cancel')}</button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className="card">
            <div className="field">
              <label>{t('detail.content', 'Discussion content')}</label>
              {!isEditing ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{item.content}</div>
              ) : (
                <textarea 
                  className="text-input" 
                  rows={6} 
                  value={editBody} 
                  onChange={(e) => setEditBody(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                />
              )}
            </div>
          </div>

          {/* Add action menu */}
          {isAuthor && (
            <div className="card mt-6">
              <div className="field">
                <label>{t('detail.actions.addAction', 'Add action')}</label>
                <select className="select-input" value={actionType} onChange={(e) => setActionType(e.target.value as any)}>
                  <option value="NONE">{t('create.actions.select', 'Select an action…')}</option>
                  <option value="RENAME_PARTY">{t('create.actions.renameParty', 'Rename party')}</option>
                  <option value="RENAME_COMPANY">{t('create.actions.renameCompany', 'Rename company')}</option>
                </select>
                {(actionType === 'RENAME_PARTY' || actionType === 'RENAME_COMPANY') && (
                  <div className="mt-3">
                    <input 
                      className="text-input" 
                      placeholder={t('create.actions.newNamePlaceholder', 'Enter new name')} 
                      value={actionName} 
                      onChange={(e) => setActionName(e.target.value)} 
                    />
                    <button
                      className="primary-button mt-3"
                      onClick={async () => {
                        if (!id) return
                        if (!actionName.trim()) { setStatusMsg('Enter new name'); return }
                        try {
                          setStatusMsg(null)
                          const companyId = getAccessPayload()?.companyId
                          const payload = actionType === 'RENAME_PARTY'
                            ? { type: 'RENAME_PARTY', partyId: item.party.id, newName: actionName }
                            : { type: 'RENAME_COMPANY', companyId, newName: actionName }
                          const res = await apiFetch(`/api/discussions/${id}/action`, {
                            method: 'POST',
                            body: JSON.stringify(payload),
                          })
                          if (!res.ok) {
                            setStatusMsg(await parseApiErrorResponse(res))
                            return
                          }
                          setStatusMsg('Action added')
                          setActionType('NONE')
                          setActionName('')
                        } catch (e) {
                          setStatusMsg(parseUnknownError(e))
                        }
                      }}
                    >Add action</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Existing actions */}
          {item.actions && item.actions.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3>Actions</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {item.actions.map((a) => {
                  let friendly = a.actionType
                  try {
                    const p = JSON.parse(a.payload || '{}') as any
                    switch (a.actionType) {
                      case 'RENAME_PARTY':
                        friendly = `Rename party to "${p?.newName ?? ''}"`
                        break
                      case 'RENAME_COMPANY':
                        friendly = `Rename company to "${p?.newName ?? ''}"`
                        break
                      case 'EVICT_USER_FROM_PARTY':
                        friendly = `Evict user ${p?.userId ?? ''} from party ${p?.partyId ?? ''}`
                        break
                      case 'ADD_USER_TO_PARTY':
                        friendly = `Add user ${p?.userId ?? ''} to party ${p?.partyId ?? ''}`
                        break
                      default:
                        friendly = `${a.actionType}`
                    }
                  } catch {
                    friendly = `${a.actionType}`
                  }
                  return (
                    <div key={a.id} className="card" style={{ padding: 12 }}>
                      {friendly}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status control */}
          {isAuthor && (
            <div className="card mt-6">
              <div className="field">
                <label>Change status</label>
                <div className="button-group stacked">
                  <button className="secondary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/wait`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to WAITING'); } finally { setIsUpdatingStatus(false) } }}>Set WAITING</button>
                  <button className="secondary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/voting`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to VOTING'); } finally { setIsUpdatingStatus(false) } }}>Set VOTING</button>
                  <button className="secondary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/final-voting`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to FINAL_VOTING'); } finally { setIsUpdatingStatus(false) } }}>Set FINAL VOTING</button>
                  <button className="secondary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/resolve`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to RESOLVED'); } finally { setIsUpdatingStatus(false) } }}>Set RESOLVED</button>
                  <button className="secondary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/archive`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to ARCHIVED'); } finally { setIsUpdatingStatus(false) } }}>Set ARCHIVED</button>
                </div>
              </div>
            </div>
          )}
          {statusMsg && <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{statusMsg}</p>}
          {/* UI changes per status */}
          {(item.status === 'WAITING' || item.status === 'RESOLVED') && (
            <div style={{ marginTop: 16 }}>
              <label htmlFor="comment" style={{ display: 'block', marginBottom: 8 }}>Comment (optional)</label>
              <textarea id="comment" className="text-input" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave your comment" />
              <div style={{ marginTop: 12 }}>
                <button className="primary-button" onClick={async () => { if (!id) return; try { setStatusMsg(null); await postComment(id, comment); setComment(''); await mutateComments() } catch (e) { setStatusMsg((e as Error).message) } }}>Send</button>
              </div>
            </div>
          )}

          {item.status === 'VOTING' && (() => {
            const currentUserId = getAccessPayload()?.sub
            const myVote = item.votes.find((v) => v.authorId === currentUserId)
            const agreed = myVote?.voteValue === 'AGREE'
            const disagreed = myVote?.voteValue === 'DISAGREE'
            const myArgument = comments.find((c) => (c as any).creator?.id === currentUserId)
            return (
              <>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button disabled={isCastingVote} className={agreed ? 'btn btn-green' : 'btn btn-outline-green'} onClick={() => { void castVote('AGREE') }}>Agree</button>
                  <button disabled={isCastingVote} className={disagreed ? 'btn btn-red' : 'btn btn-outline-red'} onClick={() => setShowDisagree((v) => !v)}>
                    {showDisagree ? 'Cancel' : 'Disagree'}
                  </button>
                </div>
                {showDisagree ? (
                  <div style={{ marginTop: 16 }}>
                    <label htmlFor="comment" style={{ display: 'block', marginBottom: 8 }}>Your argument</label>
                    <textarea id="comment" className="text-input" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Please explain your disagreement" />
                    <div style={{ marginTop: 8 }}>
                      {isCommentValid ? 'Looks good.' : `${minCommentLen - trimmedLen} more characters needed.`}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button className="primary-button" disabled={!isCommentValid || isCastingVote} onClick={async () => { if (!id) return; try { setStatusMsg(null); await castVote('DISAGREE'); await postComment(id, comment); setComment(''); await mutateComments(); setShowDisagree(false) } catch (e) { setStatusMsg(parseUnknownError(e)) } }}>Send</button>
                    </div>
                  </div>
                ) : (
                  myArgument ? (
                    <div style={{ marginTop: 16 }}>
                      <h3 style={{ margin: '8px 0' }}>Your argument</h3>
                      <div className="card" style={{ padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ color: 'var(--text-secondary)' }}>{(myArgument as any).creator?.name}</div>
                          <button className="link" onClick={() => { setEditingCommentId(myArgument.id); setEditingContent(myArgument.content) }}>Edit</button>
                        </div>
                        {editingCommentId === myArgument.id ? (
                          <div style={{ marginTop: 8 }}>
                            <textarea className="text-input" rows={3} value={editingContent} onChange={(e) => setEditingContent(e.target.value)} />
                            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                              <button className="primary-button" onClick={async () => { try { setEditError(null); await patchComment(myArgument.id, editingContent); setEditingCommentId(null); setEditingContent(''); await mutateComments() } catch (e) { setEditError((e as Error).message) } }}>Save</button>
                              <button className="primary-button" onClick={() => { setEditingCommentId(null); setEditingContent(''); setEditError(null) }}>Cancel</button>
                            </div>
                            {editError && <div style={{ marginTop: 6, color: '#b91c1c', fontSize: 12 }}>{editError}</div>}
                          </div>
                        ) : (
                          <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{myArgument.content}</div>
                        )}
                      </div>
                    </div>
                  ) : null
                )}
              </>
            )
          })()}

          {item.status === 'FINAL_VOTING' && (() => {
            const currentUserId = getAccessPayload()?.sub
            const myVote = item.votes.find((v) => v.authorId === currentUserId)
            const agreed = myVote?.voteValue === 'AGREE'
            const disagreed = myVote?.voteValue === 'DISAGREE'
            return (
            <div style={{ marginTop: 16 }}>
              <div className="card" style={{ padding: 12, marginBottom: 12 }}>
                {/* TODO: Fetch and display final voting summary text */}
                <strong>Final voting summary:</strong> Example: This proposal consolidates prior agreements and requests final approval.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={isCastingVote} className={agreed ? 'btn btn-green' : 'btn btn-outline-green'} onClick={() => { void castVote('AGREE') }}>Agree</button>
                <button disabled={isCastingVote} className={disagreed ? 'btn btn-red' : 'btn btn-outline-red'} onClick={() => { void castVote('DISAGREE') }}>Disagree</button>
              </div>
            </div>
            )
          })()}

          {/* Comments list for WAITING, RESOLVED, ARCHIVED (not VOTING) */}
          {['WAITING','RESOLVED','ARCHIVED'].includes(item.status) && (
            <div style={{ marginTop: 24 }}>
              <h3>Comments</h3>
              {commentsLoading && <p style={{ color: 'var(--text-secondary)' }}>Loading comments…</p>}
              {commentsError && <p style={{ color: 'var(--text-secondary)' }}>{commentsError}</p>}
              {!commentsLoading && !commentsError && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {comments.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No comments yet</div>}
                  {comments.map((c) => (
                    <div key={c.id} className="card" style={{ padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600 }}>{c.creator.name} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({c.creator.email})</span></div>
                        {['WAITING','VOTING','RESOLVED'].includes(item.status) && (
                          <button className="link" onClick={() => { setEditingCommentId(c.id); setEditingContent(c.content) }}>Edit</button>
                        )}
                      </div>
                      {editingCommentId === c.id ? (
                        <div style={{ marginTop: 8 }}>
                          <textarea className="text-input" rows={3} value={editingContent} onChange={(e) => setEditingContent(e.target.value)} />
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <button className="primary-button" onClick={async () => { try { setEditError(null); await patchComment(c.id, editingContent); setEditingCommentId(null); setEditingContent(''); await mutateComments() } catch (e) { setEditError((e as Error).message) } }}>Save</button>
                            <button className="primary-button" onClick={() => { setEditingCommentId(null); setEditingContent(''); setEditError(null) }}>Cancel</button>
                          </div>
                          {editError && <div style={{ marginTop: 6, color: '#b91c1c', fontSize: 12 }}>{editError}</div>}
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {item.status === 'ARCHIVED' && (
            <div style={{ marginTop: 16 }}>
              <h3>Votes</h3>
              <div style={{ display: 'grid', gap: 6 }}>
                {item.votes && item.votes.length > 0 ? item.votes.map((v) => (
                  <div key={v.id} className="card" style={{ padding: 8 }}>
                    {v.voteValue}
                  </div>
                )) : <div style={{ color: 'var(--text-secondary)' }}>No votes</div>}
              </div>
              <h3 style={{ marginTop: 16 }}>Comments</h3>
              {/* TODO: Fetch and render comments list */}
              <div className="card" style={{ padding: 8 }}>
                {/* Example comment entry */}
                Example comment…
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


