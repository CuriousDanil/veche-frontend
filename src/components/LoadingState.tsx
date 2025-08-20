import { useTranslation } from 'react-i18next'
import { Skeleton, SkeletonText } from './Skeleton'

type LoadingStateProps = {
  type?: 'default' | 'company' | 'discussions' | 'sessions' | 'parties' | 'comments' | 'saving' | 'creating' | 'updating' | 'deleting' | 'authenticating' | 'processing'
  message?: string
  showSkeleton?: boolean
  skeletonType?: 'text' | 'card' | 'list' | 'grid'
  size?: 'small' | 'medium' | 'large'
}

export default function LoadingState({ 
  type = 'default', 
  message, 
  showSkeleton = true, 
  skeletonType = 'card',
  size = 'medium'
}: LoadingStateProps) {
  const { t } = useTranslation('errors')

  const loadingMessage = message || t(`loading.${type}`, t('loading.default', 'Loading...'))

  const getSkeleton = () => {
    const sizeMap = {
      small: { height: 60, width: '80%' },
      medium: { height: 120, width: '100%' },
      large: { height: 200, width: '100%' }
    }

    const dimensions = sizeMap[size]

    switch (skeletonType) {
      case 'text':
        return <SkeletonText lines={size === 'small' ? 2 : size === 'large' ? 5 : 3} />
      
      case 'list':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {Array.from({ length: size === 'small' ? 3 : size === 'large' ? 8 : 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <Skeleton style={{ height: 40, width: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ height: 16, width: '70%', marginBottom: 'var(--space-xs)' }} />
                  <Skeleton style={{ height: 12, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        )
      
      case 'grid':
        const gridCols = size === 'small' ? 2 : size === 'large' ? 4 : 3
        return (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`, 
            gap: 'var(--space-md)' 
          }}>
            {Array.from({ length: gridCols * 2 }).map((_, i) => (
              <Skeleton key={i} style={{ height: dimensions.height, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        )
      
      case 'card':
      default:
        return <Skeleton style={dimensions} />
    }
  }

  return (
    <div className="text-center" style={{ padding: 'var(--space-lg)' }}>
      {showSkeleton && (
        <div className="mb-4">
          {getSkeleton()}
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 'var(--space-sm)',
        color: 'var(--text-secondary)',
        fontSize: 'var(--text-sm)'
      }}>
        <div 
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid var(--border)',
            borderTop: '2px solid var(--accent-blue)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <span>{loadingMessage}</span>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
