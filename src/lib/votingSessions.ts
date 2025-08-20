import { apiFetch } from './api'
import { parseApiErrorResponse } from './errors'

export type CreateVotingSessionPayload = {
  name: string
  partyId: string
  discussionIds: string[]
  firstRoundStartsAt: string | null
  secondRoundStartsAt: string | null
  endsAt: string | null
}

export type UpdateVotingSessionPayload = {
  name: string
  partyId: string
  discussionIds: string[]
  firstRoundStart: string | null
  secondRoundStart: string | null
  endTime: string | null
}

export async function createVotingSession(payload: CreateVotingSessionPayload): Promise<void> {
  const res = await apiFetch('/api/voting-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseApiErrorResponse(res))
}

export async function updateVotingSession(
  sessionId: string, 
  payload: UpdateVotingSessionPayload
): Promise<void> {
  const res = await apiFetch(`/api/voting-sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseApiErrorResponse(res))
}
