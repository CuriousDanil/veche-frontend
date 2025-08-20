import { apiFetch } from './api'
import { parseApiErrorResponse } from './errors'

export type UpdateDiscussionPayload = {
  subject?: string
  content?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

export async function patchDiscussion(
  discussionId: string, 
  updates: UpdateDiscussionPayload
): Promise<void> {
  const res = await apiFetch(`/api/discussions/${discussionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(await parseApiErrorResponse(res))
}
