import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Party = { id: string; name: string }
type Vote = { id: string; authorId: string; voteValue: 'AGREE' | 'DISAGREE' }
type Discussion = {
  id: string
  subject: string
  content: string
  party: Party
  creatorName: string
  status: 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'
  votes: Vote[]
}

export default function DiscussionDetail() {
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

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div className="container container-narrow">
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--text-secondary)' }}>{error}</p>}
      {item && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {!isEditing ? (
              <h2 style={{ marginTop: 0, marginBottom: 8 }}>{item.subject}</h2>
            ) : (
              <input className="text-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            )}
            {isAuthor && (
              <div style={{ display: 'flex', gap: 8 }}>
                {!isEditing ? (
                  <button className="primary-button" onClick={() => setIsEditing(true)}>Edit</button>
                ) : (
                  <>
                    <button className="primary-button" onClick={async () => { /* TODO: save title/body via PATCH if supported */ setIsEditing(false); }}>Save</button>
                    <button className="primary-button" onClick={() => { setIsEditing(false); setEditTitle(item.subject); setEditBody(item.content); }}>Cancel</button>
                  </>
                )}
              </div>
            )}
          </div>
          {!isEditing ? (
            <p style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
          ) : (
            <textarea className="text-input" rows={6} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
          )}

          {/* Status display */}
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 4 }}>Status</label>
            <div style={{ fontWeight: 500 }}>{item.status}</div>
          </div>

          {/* Status control */}
          {isAuthor && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="primary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/wait`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to WAITING'); } finally { setIsUpdatingStatus(false) } }}>Set WAITING</button>
              <button className="primary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/voting`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to VOTING'); } finally { setIsUpdatingStatus(false) } }}>Set VOTING</button>
              <button className="primary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/final-voting`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to FINAL_VOTING'); } finally { setIsUpdatingStatus(false) } }}>Set FINAL_VOTING</button>
              <button className="primary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/resolve`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to RESOLVED'); } finally { setIsUpdatingStatus(false) } }}>Set RESOLVED</button>
              <button className="primary-button" disabled={isUpdatingStatus} onClick={async () => { try { setIsUpdatingStatus(true); await apiFetch(`/api/discussions/${id}/archive`, { method: 'POST' }); await reload(); setStatusMsg('Status changed to ARCHIVED'); } finally { setIsUpdatingStatus(false) } }}>Set ARCHIVED</button>
            </div>
          )}
          {statusMsg && <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{statusMsg}</p>}
          {/* UI changes per status */}
          {item.status === 'WAITING' && (
            <div style={{ marginTop: 16 }}>
              <label htmlFor="comment" style={{ display: 'block', marginBottom: 8 }}>Comment (optional)</label>
              <textarea id="comment" className="text-input" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave your comment" />
              <div style={{ marginTop: 12 }}>
                <button className="primary-button" onClick={() => { /* TODO: Post WAITING comment */ }}>Send</button>
              </div>
            </div>
          )}

          {item.status === 'VOTING' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="primary-button" onClick={() => {/* TODO: Agree vote post */}}>Agree</button>
              <button className="primary-button" onClick={() => setShowDisagree((v) => !v)}>
                {showDisagree ? 'Cancel' : 'Disagree'}
              </button>
              {showDisagree && (
                <div style={{ marginTop: 16, width: '100%' }}>
                  <label htmlFor="comment" style={{ display: 'block', marginBottom: 8 }}>Comment</label>
                  <textarea id="comment" className="text-input" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Please explain your disagreement" />
                  <div style={{ marginTop: 8 }}>
                    {isCommentValid ? 'Looks good.' : `${minCommentLen - trimmedLen} more characters needed.`}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button className="primary-button" disabled={!isCommentValid} onClick={() => {/* TODO: Disagree comment send */}}>Send</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {item.status === 'FINAL_VOTING' && (
            <div style={{ marginTop: 16 }}>
              <div className="card" style={{ padding: 12, marginBottom: 12 }}>
                {/* TODO: Fetch and display final voting summary text */}
                <strong>Final voting summary:</strong> Example: This proposal consolidates prior agreements and requests final approval.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="primary-button" onClick={() => {/* TODO: Agree final vote */}}>Agree</button>
                <button className="primary-button" onClick={() => {/* TODO: Disagree final vote */}}>Disagree</button>
              </div>
            </div>
          )}

          {item.status === 'RESOLVED' && (
            <div style={{ marginTop: 16 }}>
              <label htmlFor="comment" style={{ display: 'block', marginBottom: 8 }}>Comment (optional)</label>
              <textarea id="comment" className="text-input" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave your comment" />
              <div style={{ marginTop: 12 }}>
                <button className="primary-button" onClick={() => { /* TODO: Post RESOLVED comment */ }}>Send</button>
              </div>
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


