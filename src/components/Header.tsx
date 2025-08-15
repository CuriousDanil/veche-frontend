import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand">Veche</Link>
        <nav className="nav">
          {user ? (
            <>
              <Link to="/company" className="link">{(useAuth().company?.name) ?? 'Company'}</Link>
              <Link to="/discussions" className="link">Discussions</Link>
              <Link to="/voting-sessions" className="link">Sessions</Link>
              <button className="primary-button" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="link">Log in</Link>
              <Link to="/register" className="primary-button">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}


