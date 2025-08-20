import { useMemo, useState } from 'react'
import LanguageLink from '../components/LanguageLink'
import { useTranslation } from 'react-i18next'
import { useLanguageNavigate } from '../hooks/useLanguage'
import useSWR from 'swr'
import { swrJsonFetcher } from '../lib/swr'
import type { Company } from '../types'
import { Skeleton, SkeletonText } from '../components/Skeleton'
import Modal from '../components/Modal'
import { useFormatter } from '../hooks/useFormatter'

export default function CompanyPage() {
  const { t } = useTranslation('company')
  const { formatMemberCount } = useFormatter()
  const languageNavigate = useLanguageNavigate()
  const { data: company, error, isLoading } = useSWR<Company>('/api/company/my-company', swrJsonFetcher, { refreshInterval: 15000 })
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<{ id: string; name: string } | null>(null)
  const [newPartyName, setNewPartyName] = useState('')

  const usersByParty = useMemo(() => {
    const map: Record<string, { name: string; users: string[] }> = {}
    if (!company) return map
    for (const p of company.parties) map[p.id] = { name: p.name, users: [] }
    for (const u of company.users) {
      for (const p of u.parties) {
        if (!map[p.id]) map[p.id] = { name: p.name, users: [] }
        map[p.id].users.push(`${u.name} (${u.email})`)
      }
    }
    return map
  }, [company])

  const handleEditParty = (partyId: string, partyName: string) => {
    setEditingParty({ id: partyId, name: partyName })
    setNewPartyName(partyName)
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setEditingParty(null)
    setNewPartyName('')
  }

  const handleConfirmEdit = () => {
    if (!editingParty || !newPartyName.trim()) return
    
    // Navigate to CreateDiscussion with pre-filled action
    const params = new URLSearchParams({
      partyId: editingParty.id,
      actionType: 'RENAME_PARTY',
      actionName: newPartyName.trim(),
      subject: `Rename party to "${newPartyName.trim()}"`
    })
    languageNavigate(`/discussions/new?${params.toString()}`)
  }

  return (
    <div className="container">
      {isLoading && (
        <div className="card" style={{ padding: 16 }}>
          <Skeleton style={{ height: 24, width: 280, marginBottom: 12 }} />
          <SkeletonText lines={3} />
        </div>
      )}
      {error && <p style={{ color: 'var(--text-secondary)' }}>{String(error)}</p>}
      {company && (
        <div>
          <div className="mt-6 mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2>{company.name}</h2>
            <LanguageLink to="/company/parties/new" className="primary-button">{t('createParty')}</LanguageLink>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-lg)',
            marginTop: 'var(--space-lg)',
            gridAutoFlow: 'dense',
          }}>
            {Object.entries(usersByParty).map(([pid, group]) => {
              const size = group.users.length
              const spanCols = size > 8 ? 2 : 1
              return (
                <div key={pid} className="card" style={{ gridColumn: `span ${spanCols}` }}>
                  <div className="field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                      <h3 className="font-semibold">{group.name}</h3>
                      <div className="button-group">
                        <button className="secondary-button" type="button" title={t('party.featureComingSoon')}>{t('party.addUser')}</button>
                        <button 
                          className="secondary-button" 
                          type="button" 
                          onClick={() => handleEditParty(pid, group.name)}
                        >
                          {t('party.editParty')}
                        </button>
                      </div>
                    </div>
                    <div className="text-tertiary mb-3" style={{ fontSize: 'var(--text-sm)' }}>
                      {formatMemberCount(group.users.length)}
                    </div>
                    <div style={{ display: 'grid', gap: 'var(--space-xs)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      {group.users.map((u, idx) => (
                        <div key={idx} className="text-secondary" style={{ 
                          padding: 'var(--space-xs) var(--space-sm)',
                          background: 'var(--border-light)',
                          borderRadius: 'var(--radius)',
                          fontSize: 'var(--text-sm)'
                        }}>
                          {u}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseModal} 
        title={t('editParty.modalTitle')}
      >
        <div className="form">
          <div className="field">
            <label htmlFor="newPartyName">{t('editParty.newNameLabel')}</label>
            <input
              id="newPartyName"
              className="text-input"
              type="text"
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              placeholder={t('editParty.newNamePlaceholder')}
              autoFocus
            />
            {editingParty && (
              <div className="text-tertiary mt-2" style={{ fontSize: 'var(--text-xs)' }}>
                {t('editParty.currentName', { name: editingParty.name })}
              </div>
            )}
          </div>
          <div className="button-group mt-4">
            <button 
              className="primary-button" 
              onClick={handleConfirmEdit}
              disabled={!newPartyName.trim() || newPartyName.trim() === editingParty?.name}
            >
              {t('editParty.createDiscussion')}
            </button>
            <button 
              className="secondary-button" 
              onClick={handleCloseModal}
            >
              {t('editParty.cancel')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


