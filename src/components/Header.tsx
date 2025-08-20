import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useLanguageNavigate } from '../hooks/useLanguage'
import LanguageSwitcher from './LanguageSwitcher'
import LanguageLink from './LanguageLink'

export default function Header() {
  const { t } = useTranslation('common')
  const { user, logout } = useAuth()
  const languageNavigate = useLanguageNavigate()

  const handleLogout = () => {
    logout()
    languageNavigate('/')
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        {user ? (
          <span className="brand">Veche</span>
        ) : (
          <LanguageLink to="/" className="brand">Veche</LanguageLink>
        )}
        <nav className="nav">
          {user ? (
            <>
              <LanguageLink to="/company" className="link">{(useAuth().company?.name) ?? t('nav.company', 'Company')}</LanguageLink>
              <LanguageLink to="/discussions" className="link">{t('nav.discussions', 'Discussions')}</LanguageLink>
              <LanguageLink to="/voting-sessions" className="link">{t('nav.sessions', 'Sessions')}</LanguageLink>
              <LanguageSwitcher compact />
              <button className="primary-button" onClick={handleLogout}>{t('nav.logout', 'Log out')}</button>
            </>
          ) : (
            <>
              <LanguageSwitcher compact />
              <LanguageLink to="/login" className="link">{t('nav.login', 'Log in')}</LanguageLink>
              <LanguageLink to="/register" className="primary-button">{t('nav.register', 'Register')}</LanguageLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}


