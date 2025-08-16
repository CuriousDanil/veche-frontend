import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/Skeleton'

type Party = { id: string; name: string }
type VotingSession = {
  id: string
  name: string
  party: Party
  status: 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'
  firstRoundStart?: string | null
  secondRoundStart?: string | null
  endTime?: string | null
}

export default function VotingSessions() {
  const { user } = useAuth()
  const myPartyIds = user?.partyIds ?? []
  const [gridCols, setGridCols] = useState(3)
  const { data, error, isLoading } = useSWR<VotingSession[]>('/api/voting-sessions', swrJsonFetcher, { refreshInterval: 5000 })

  const groupedByParty = useMemo(() => {
    if (!data) return {}
    const byParty: Record<string, { party: Party; sessions: VotingSession[] }> = {}
    
    for (const session of data) {
      const partyId = session.party.id
      
      if (!byParty[partyId]) {
        byParty[partyId] = { party: session.party, sessions: [] }
      }
      byParty[partyId].sessions.push(session)
    }
    
    return byParty
  }, [data])

  const formatTimeInfo = (session: VotingSession) => {
    if (session.status === 'WAITING' && session.firstRoundStart) {
      const date = new Date(session.firstRoundStart)
      return `Starts ${date.toLocaleDateString()}`
    }
    if (session.endTime) {
      const date = new Date(session.endTime)
      return `Ends ${date.toLocaleDateString()}`
    }
    return null
  }

  return (
    <div className="container">
      <div className="mt-8 mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Voting sessions</h2>
        <div className="grid-controls">
          {[1, 2, 3, 4].map(cols => (
            <button
              key={cols}
              className={`grid-control-button ${gridCols === cols ? 'active' : ''}`}
              onClick={() => setGridCols(cols)}
            >
              {cols}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="party-section">
          <div className="party-header">
            <Skeleton style={{ height: 32, width: 200 }} />
            <Skeleton style={{ height: 44, width: 120 }} />
          </div>
          <div className={`content-grid cols-${gridCols}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="content-card">
                <Skeleton style={{ height: 120 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-secondary">{String(error)}</p>}

      {!isLoading && !error && Object.entries(groupedByParty).map(([partyId, { party, sessions }]) => (
        <div key={partyId} className="party-section">
          <div className="party-header">
            <h2 className="party-title">{party.name}</h2>
            <div className="party-controls">
              <Link 
                to={`/voting-sessions/new${party.id !== 'unknown' ? `?partyId=${party.id}` : ''}`} 
                className="primary-button"
              >
                New session
              </Link>
            </div>
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary">No voting sessions yet in this party.</p>
            </div>
          ) : (
            <div className={`content-grid cols-${gridCols}`}>
              {sessions.map((session) => (
                <Link 
                  key={session.id} 
                  to={`/voting-sessions/${session.id}`} 
                  className="content-card"
                >
                  <h3 className="content-card-title">{session.name}</h3>
                  <div className="content-card-body">
                    {formatTimeInfo(session) && (
                      <div className="text-secondary mb-2">
                        {formatTimeInfo(session)}
                      </div>
                    )}
                    <div className="text-tertiary">
                      Click to view details and manage this voting session
                    </div>
                  </div>
                  <div className="content-card-footer">
                    <span className="content-card-creator">{party.name}</span>
                    <span className={`status-badge ${session.status.toLowerCase().replace('_', '-')}`}>
                      {session.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      {!isLoading && !error && Object.keys(groupedByParty).length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-secondary mb-4">No voting sessions yet</h3>
          <Link to="/voting-sessions/new" className="primary-button">
            Create your first session
          </Link>
        </div>
      )}
    </div>
  )
}


