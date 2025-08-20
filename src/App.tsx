import './App.css'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SEOHead from './components/SEOHead'

function App() {
  const { t } = useTranslation('landing')
  
  return (
    <div className="container">
      <SEOHead page="home" />
      <section className="hero">
        <span className="eyebrow">{t('hero.eyebrow', 'Participatory governance')}</span>
        <h1 className="title">{t('hero.title', 'Veche — the home of participatory democracy')}</h1>
        <p className="subtitle">{t('hero.subtitle', 'Shape decisions together. Join as a founder to start your organization and build consensus through structured discussions.')}</p>
        <div className="cta">
          <Link to="/register" className="register-button">{t('hero.getStarted', 'Get Started')}</Link>
          <Link to="/login" className="secondary-button">{t('hero.signIn', 'Sign In')}</Link>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">💬</div>
          <h3>{t('features.discussions.title', 'Structured Discussions')}</h3>
          <p>{t('features.discussions.description', 'Create focused discussions with clear objectives and transparent voting processes for better decision-making.')}</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🗳️</div>
          <h3>{t('features.voting.title', 'Democratic Voting')}</h3>
          <p>{t('features.voting.description', 'Multi-round voting sessions ensure every voice is heard and decisions reflect the true consensus of your organization.')}</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🏢</div>
          <h3>{t('features.management.title', 'Organization Management')}</h3>
          <p>{t('features.management.description', 'Manage parties, users, and organizational structure with intuitive tools designed for collaborative governance.')}</p>
        </div>
      </section>
    </div>
  )
}

export default App
