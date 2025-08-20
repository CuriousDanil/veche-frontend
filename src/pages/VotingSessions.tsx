import { useMemo, useState } from 'react'
import LanguageLink from '../components/LanguageLink'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/Skeleton'
import SEOHead from '../components/SEOHead'
import EmptyState from '../components/EmptyState'
import NetworkError from '../components/NetworkError'
import { useApiError } from '../hooks/useApiError'
import { useFormatter } from '../hooks/useFormatter'

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
  const { t } = useTranslation(['sessions', 'common'])
  const { translateError } = useApiError()
  const { formatDateShort, formatTimeContext } = useFormatter()
  const [gridCols, setGridCols] = useState(3)
  const { data: sessions, error: sessionsError, isLoading: sessionsLoading, mutate: mutateSessions } = useSWR<VotingSession[]>('/api/voting-sessions', swrJsonFetcher, { refreshInterval: 5000 })
  const { data: parties, error: partiesError, isLoading: partiesLoading } = useSWR<Party[]>('/api/parties', swrJsonFetcher, { refreshInterval: 60000 })

  const groupedByParty = useMemo(() => {
    if (!parties) return {}
    const byParty: Record<string, { party: Party; sessions: VotingSession[] }> = {}
    
    // First, create entries for ALL parties
    for (const party of parties) {
      byParty[party.id] = { party, sessions: [] }
    }
    
    // Then, add sessions to their respective parties
    if (sessions) {
      for (const session of sessions) {
        const partyId = session.party.id
        
        if (byParty[partyId]) {
          byParty[partyId].sessions.push(session)
        } else {
          // Handle sessions with unknown/missing parties
          byParty[partyId] = { party: session.party, sessions: [session] }
        }
      }
    }
    
    return byParty
  }, [parties, sessions])

  const formatTimeInfo = (session: VotingSession) => {
    if (session.status === 'WAITING' && session.firstRoundStart) {
      return formatTimeContext(session.firstRoundStart, 'remaining')
    }
    if (session.endTime) {
      const now = new Date()
      const endDate = new Date(session.endTime)
      if (endDate > now) {
        return formatTimeContext(session.endTime, 'remaining')
      } else {
        return formatTimeContext(session.endTime, 'ago')
      }
    }
    return null
  }

  return (
    <div className="container">
      <SEOHead page="sessions" />
      <div className="mt-8 mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>{t('list.title', 'Voting Sessions')}</h2>
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

      {(sessionsLoading || partiesLoading) && (
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

      {(sessionsError || partiesError) && (
        <NetworkError 
          message={translateError(sessionsError || partiesError)}
          onRetry={() => {
            mutateSessions()
            // Also retry parties if there's an error
            if (partiesError) {
              // Trigger parties refetch
              window.location.reload()
            }
          }}
          inline
        />
      )}

      {!sessionsLoading && !partiesLoading && !sessionsError && !partiesError && Object.entries(groupedByParty).map(([partyId, { party, sessions }]) => (
        <div key={partyId} className="party-section">
          <div className="party-header">
            <h2 className="party-title">{party.name}</h2>
            <div className="party-controls">
              <LanguageLink 
                to={`/voting-sessions/new${party.id !== 'unknown' ? `?partyId=${party.id}` : ''}`} 
                className="primary-button"
              >
                {t('list.newSession', 'New session')}
              </LanguageLink>
            </div>
          </div>
          
          {sessions.length === 0 ? (
            <EmptyState
              icon="🗳️"
              title={t('list.noSessions', 'No sessions found in this party')}
              size="small"
            />
          ) : (
            <div className={`content-grid cols-${gridCols}`}>
              {sessions.map((session) => (
                <LanguageLink 
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
                      {t('list.clickToView', 'Click to view details and manage this voting session')}
                    </div>
                  </div>
                  <div className="content-card-footer">
                    <span className="content-card-creator">{party.name}</span>
                    <span className={`status-badge ${session.status.toLowerCase().replace('_', '-')}`}>
                      {t(`common:status.${session.status.toLowerCase().replace('_', '')}`, session.status.replace('_', ' '))}
                    </span>
                  </div>
                </LanguageLink>
              ))}
            </div>
          )}
        </div>
      ))}

      {!sessionsLoading && !partiesLoading && !sessionsError && !partiesError && Object.keys(groupedByParty).length === 0 && (
        <EmptyState
          icon="🗳️"
          title={t('empty.title', 'No voting sessions yet')}
          description={t('empty.description', 'Create a voting session to organize discussions into structured voting rounds')}
          primaryAction={{
            label: t('empty.action', 'Create your first session'),
            href: '/voting-sessions/new'
          }}
          size="large"
        />
      )}
    </div>
  )
}


