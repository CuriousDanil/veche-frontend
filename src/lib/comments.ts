import { apiFetch } from './api'
import { parseApiErrorResponse } from './errors'
import type { Comment } from '../types'

export async function fetchComments(discussionId: string): Promise<Comment[]> {
  const res = await apiFetch(`/api/discussions/${discussionId}/comments`)
  if (!res.ok) throw new Error(`Failed to load comments: ${res.status}`)
  return (await res.json()) as Comment[]
}

export async function postComment(discussionId: string, content: string): Promise<void> {
  const res = await apiFetch(`/api/discussions/${discussionId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(await parseApiErrorResponse(res))
}

export async function patchComment(commentId: string, content: string): Promise<void> {
  const res = await apiFetch(`/api/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(await parseApiErrorResponse(res))
}


