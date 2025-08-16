export type UUID = string

// Parties
export type Party = {
  id: UUID
  name: string
}

// Users
export type User = {
  id: UUID
  name: string
  email: string
  bio: string
  parties: Party[]
  isAbleToPostDiscussions: boolean
  isAbleToManageSessions: boolean
  isAbleToManageUsers: boolean
}

// Company
export type Company = {
  id: UUID
  name: string
  users: User[]
  parties: Party[]
}

// Discussion
export type DiscussionStatus = 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'

export type VoteValue = 'AGREE' | 'DISAGREE'

export type DiscussionVote = {
  id: UUID
  authorId: UUID
  voteValue: VoteValue
}

export type Action = {
  id: UUID
  actionType: string
  payload: string
}

export type Discussion = {
  id: UUID
  subject: string
  content: string
  createdAt: string // ISO
  party: Party
  creatorName: string
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  status: DiscussionStatus
  votes: DiscussionVote[]
  actions: Action[]
}

// Voting Sessions
export type VotingSessionStatus = 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'

export type VotingSession = {
  id: UUID
  name: string
  party: Party
  status: VotingSessionStatus
  discussions: Discussion[]
  firstRoundStart?: string | null // ISO
  secondRoundStart?: string | null // ISO
  endTime?: string | null // ISO
}

// Comments
export type CommentStatus = string
export type Comment = {
  id: UUID
  content: string
  creator: User
  status: CommentStatus
  createdAt: string // ISO
}


