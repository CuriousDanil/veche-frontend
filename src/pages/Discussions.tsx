import { useMemo, useState } from 'react'
import LanguageLink from '../components/LanguageLink'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/Skeleton'
import SEOHead from '../components/SEOHead'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import NetworkError from '../components/NetworkError'
import { useApiError } from '../hooks/useApiError'

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
  const { t } = useTranslation(['discussions', 'common'])
  const { translateError } = useApiError()
  const { user } = useAuth()
  const myPartyIds = user?.partyIds ?? []
  const [gridCols, setGridCols] = useState(3)
  const { data, error, isLoading, mutate } = useSWR<Discussion[]>('/api/discussions', swrJsonFetcher, { refreshInterval: 5000 })

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
      <SEOHead page="discussions" />
      <div className="mt-8 mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>{t('list.title', 'Discussions')}</h2>
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

      {error && (
        <NetworkError 
          message={translateError(error)}
          onRetry={() => mutate()}
          inline
        />
      )}

      {!isLoading && !error && Object.entries(groupedByParty).map(([partyId, { party, discussions }]) => (
        <div key={partyId} className="party-section">
          <div className="party-header">
            <h2 className="party-title">{party.name}</h2>
            <div className="party-controls">
              <LanguageLink 
                to={`/discussions/new${party.id !== 'unknown' ? `?partyId=${party.id}` : ''}`} 
                className="primary-button"
              >
                {t('list.newDiscussion', 'New discussion')}
              </LanguageLink>
            </div>
          </div>
          
          {discussions.length === 0 ? (
            <EmptyState
              icon="💬"
              title={t('list.noDiscussionsInParty', 'No discussions yet in this party.')}
              size="small"
            />
          ) : (
            <div className={`content-grid cols-${gridCols}`}>
              {discussions.map((discussion) => (
                <LanguageLink 
                  key={discussion.id} 
                  to={`/discussions/${discussion.id}`} 
                  className="content-card"
                >
                  <h3 className="content-card-title">{discussion.subject}</h3>
                  <p className="content-card-body">{discussion.content}</p>
                  <div className="content-card-footer">
                    <span className="content-card-creator">{t('list.createdBy', 'By {{name}}', { name: discussion.creatorName })}</span>
                    <span className={`status-badge ${discussion.status.toLowerCase().replace('_', '-')}`}>
                      {t(`common:status.${discussion.status.toLowerCase().replace('_', '')}`, discussion.status.replace('_', ' '))}
                    </span>
                  </div>
                </LanguageLink>
              ))}
            </div>
          )}
        </div>
      ))}

      {!isLoading && !error && Object.keys(groupedByParty).length === 0 && (
        <EmptyState
          icon="💬"
          title={t('empty.title', 'No discussions yet')}
          description={t('empty.description', 'Start a discussion to engage your party members')}
          primaryAction={{
            label: t('empty.action', 'Create first discussion'),
            href: '/discussions/new'
          }}
          size="large"
        />
      )}
    </div>
  )
}


