import './App.css'
import { Link } from 'react-router-dom'

function App() {
  return (
    <div className="container">
      <section className="hero">
        <span className="eyebrow">Participatory governance</span>
        <h1 className="title">Veche — the home of participatory democracy</h1>
        <p className="subtitle">Shape decisions together. Join as a founder to start your organization.</p>
        <div className="cta">
          <Link to="/register" className="register-button">Register</Link>
        </div>
      </section>
    </div>
  )
}

export default App
