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
  
  // User modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; bio: string; partyId: string } | null>(null)

  const usersByParty = useMemo(() => {
    const map: Record<string, { name: string; users: Array<{ id: string; name: string; email: string; bio: string }> }> = {}
    if (!company) return map
    for (const p of company.parties) map[p.id] = { name: p.name, users: [] }
    for (const u of company.users) {
      for (const p of u.parties) {
        if (!map[p.id]) map[p.id] = { name: p.name, users: [] }
        map[p.id].users.push({
          id: u.id,
          name: u.name,
          email: u.email,
          bio: u.bio
        })
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

  const handleRenameParty = () => {
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

  const handleDeleteParty = () => {
    if (!editingParty) return
    
    const confirmMessage = t('editParty.confirmDelete', 'Are you sure you want to delete this party? This action cannot be undone.')
    if (window.confirm(confirmMessage)) {
      // Navigate to CreateDiscussion with delete party action
      const params = new URLSearchParams({
        partyId: editingParty.id,
        actionType: 'DELETE_PARTY',
        subject: `Delete party "${editingParty.name}"`
      })
      languageNavigate(`/discussions/new?${params.toString()}`)
    }
  }

  const handleUserClick = (user: { id: string; name: string; email: string; bio: string }, partyId: string) => {
    setSelectedUser({ ...user, partyId })
    setIsUserModalOpen(true)
  }

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false)
    setSelectedUser(null)
  }

  const handleEvictUser = () => {
    if (!selectedUser) return
    
    // Navigate to CreateDiscussion with evict user action
    const params = new URLSearchParams({
      partyId: selectedUser.partyId,
      actionType: 'EVICT_USER_FROM_PARTY',
      userId: selectedUser.id,
      subject: `Evict ${selectedUser.name} from party`
    })
    languageNavigate(`/discussions/new?${params.toString()}`)
    setIsUserModalOpen(false)
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
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-lg)',
            marginTop: 'var(--space-lg)',
          }}>
            {Object.entries(usersByParty).map(([pid, group]) => {
              return (
                <div key={pid} className="card">
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
                      {group.users.map((u) => (
                        <button 
                          key={u.id} 
                          className="text-secondary" 
                          onClick={() => handleUserClick(u, pid)}
                          style={{ 
                            padding: 'var(--space-xs) var(--space-sm)',
                            background: 'var(--border-light)',
                            borderRadius: 'var(--radius)',
                            fontSize: 'var(--text-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-blue)'
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--border-light)'
                            e.currentTarget.style.color = 'var(--text-secondary)'
                          }}
                        >
                          {u.name} ({u.email})
                        </button>
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
              onClick={handleRenameParty}
              disabled={!newPartyName.trim() || newPartyName.trim() === editingParty?.name}
            >
              {t('editParty.renameButton', 'Rename Party')}
            </button>
            <button 
              className="secondary-button" 
              onClick={handleDeleteParty}
              style={{ 
                background: 'var(--red)', 
                color: 'white',
                borderColor: 'var(--red)'
              }}
            >
              {t('editParty.deleteButton', 'Delete Party')}
            </button>
            <button 
              className="secondary-button" 
              onClick={handleCloseModal}
            >
              {t('editParty.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* User Information Modal */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={handleCloseUserModal} 
        title={t('userModal.title', 'User Information')}
      >
        {selectedUser && (
          <div className="form">
            <div className="field">
              <div className="text-primary mb-3" style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                {selectedUser.name}
              </div>
              <div className="mb-2">
                <strong>{t('userModal.email', 'Email: {{email}}', { email: selectedUser.email })}</strong>
              </div>
              <div className="mb-4">
                <div className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                  {selectedUser.bio ? 
                    t('userModal.bio', 'Bio: {{bio}}', { bio: selectedUser.bio }) : 
                    t('userModal.noBio', 'No bio provided')
                  }
                </div>
              </div>
            </div>
            <div className="button-group mt-4">
              <button 
                className="primary-button" 
                onClick={handleEvictUser}
                style={{ 
                  background: 'var(--red)', 
                  color: 'white',
                  borderColor: 'var(--red)'
                }}
              >
                {t('userModal.evictButton', 'Evict from party')}
              </button>
              <button 
                className="secondary-button" 
                onClick={handleCloseUserModal}
              >
                {t('userModal.close', 'Close')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}


