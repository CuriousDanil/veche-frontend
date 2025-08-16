import './App.css'
import { Link } from 'react-router-dom'

function App() {
  return (
    <div className="container">
      <section className="hero">
        <span className="eyebrow">Participatory governance</span>
        <h1 className="title">Veche — the home of participatory democracy</h1>
        <p className="subtitle">Shape decisions together. Join as a founder to start your organization and build consensus through structured discussions.</p>
        <div className="cta">
          <Link to="/register" className="register-button">Get Started</Link>
          <Link to="/login" className="secondary-button">Sign In</Link>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">💬</div>
          <h3>Structured Discussions</h3>
          <p>Create focused discussions with clear objectives and transparent voting processes for better decision-making.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🗳️</div>
          <h3>Democratic Voting</h3>
          <p>Multi-round voting sessions ensure every voice is heard and decisions reflect the true consensus of your organization.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🏢</div>
          <h3>Organization Management</h3>
          <p>Manage parties, users, and organizational structure with intuitive tools designed for collaborative governance.</p>
        </div>
      </section>
    </div>
  )
}

export default App
