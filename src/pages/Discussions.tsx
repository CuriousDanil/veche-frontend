import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/Skeleton'

type Party = { id: string; name: string }
type Discussion = {
  id: string
  subject: string
  content: string
  createdAt: string
  party?: Party
  partyId?: string
  creatorName: string
  status: 'WAITING' | 'VOTING' | 'FINAL_VOTING' | 'RESOLVED' | 'ARCHIVED'
}

export default function Discussions() {
  const { user } = useAuth()
  const myPartyIds = user?.partyIds ?? []
  const [gridCols, setGridCols] = useState(3)
  const { data, error, isLoading } = useSWR<Discussion[]>('/api/discussions', swrJsonFetcher, { refreshInterval: 5000 })

  const groupedByParty = useMemo(() => {
    if (!data) return {}
    const byParty: Record<string, { party: Party; discussions: Discussion[] }> = {}
    
    for (const discussion of data) {
      const partyId = discussion.party?.id || discussion.partyId || 'unknown'
      const party = discussion.party || { id: partyId, name: partyId }
      
      if (!byParty[partyId]) {
        byParty[partyId] = { party, discussions: [] }
      }
      byParty[partyId].discussions.push(discussion)
    }
    
    return byParty
  }, [data])

  return (
    <div className="container">
      <div className="mt-8 mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Discussions</h2>
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

      {!isLoading && !error && Object.entries(groupedByParty).map(([partyId, { party, discussions }]) => (
        <div key={partyId} className="party-section">
          <div className="party-header">
            <h2 className="party-title">{party.name}</h2>
            <div className="party-controls">
              <Link 
                to={`/discussions/new${party.id !== 'unknown' ? `?partyId=${party.id}` : ''}`} 
                className="primary-button"
              >
                New discussion
              </Link>
            </div>
          </div>
          
          {discussions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary">No discussions yet in this party.</p>
            </div>
          ) : (
            <div className={`content-grid cols-${gridCols}`}>
              {discussions.map((discussion) => (
                <Link 
                  key={discussion.id} 
                  to={`/discussions/${discussion.id}`} 
                  className="content-card"
                >
                  <h3 className="content-card-title">{discussion.subject}</h3>
                  <p className="content-card-body">{discussion.content}</p>
                  <div className="content-card-footer">
                    <span className="content-card-creator">By {discussion.creatorName}</span>
                    <span className={`status-badge ${discussion.status.toLowerCase().replace('_', '-')}`}>
                      {discussion.status.replace('_', ' ')}
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
          <h3 className="text-secondary mb-4">No discussions yet</h3>
          <Link to="/discussions/new" className="primary-button">
            Create your first discussion
          </Link>
        </div>
      )}
    </div>
  )
}


