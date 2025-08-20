import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, useParams, Outlet } from 'react-router-dom'
import { isSupportedLanguage } from './lib/i18n'
import { LanguageProvider } from './context/LanguageContext'
import Header from './components/Header'

// Pages
import App from './App'
import Register from './pages/Register'
import Login from './pages/Login'
import Discussions from './pages/Discussions'
import CreateDiscussion from './pages/CreateDiscussion'
import DiscussionDetail from './pages/DiscussionDetail'
import VotingSessions from './pages/VotingSessions'
import CreateVotingSession from './pages/CreateVotingSession'
import VotingSessionDetail from './pages/VotingSessionDetail'
import CompanyPage from './pages/Company'
import CreateParty from './pages/CreateParty'
import NotFound from './pages/NotFound'
import ServerError from './pages/ServerError'
import Forbidden from './pages/Forbidden'

function withLayout(children: ReactNode) {
  return (
    <LanguageProvider>
      <Header />
      {children}
    </LanguageProvider>
  )
}

// Language redirect component - simple default to English
function LanguageRedirect() {
  return <Navigate to="/en/" replace />
}

// Language route wrapper
function LanguageRoutes() {
  const { lang } = useParams()
  
  // Validate language parameter
  if (!lang || !isSupportedLanguage(lang)) {
    return <LanguageRedirect />
  }
  
  return <Outlet />
}

export const router = createBrowserRouter([
  // Basic routes without language prefixes (for now, to get things working)
  { path: '/', element: withLayout(<App />) },
  { path: '/register', element: withLayout(<Register />) },
  { path: '/login', element: withLayout(<Login />) },
  { path: '/discussions', element: withLayout(<Discussions />) },
  { path: '/discussions/new', element: withLayout(<CreateDiscussion />) },
  { path: '/discussions/:id', element: withLayout(<DiscussionDetail />) },
  { path: '/voting-sessions', element: withLayout(<VotingSessions />) },
  { path: '/voting-sessions/new', element: withLayout(<CreateVotingSession />) },
  { path: '/voting-sessions/:id', element: withLayout(<VotingSessionDetail />) },
  { path: '/company', element: withLayout(<CompanyPage />) },
  { path: '/company/parties/new', element: withLayout(<CreateParty />) },
  
  // Error pages
  { path: '/403', element: withLayout(<Forbidden />) },
  { path: '/500', element: withLayout(<ServerError />) },
  { path: '*', element: withLayout(<NotFound />) },
  
  // Language-prefixed routes for i18n
  {
    path: '/:lang',
    element: <LanguageRoutes />,
    children: [
      { path: '', element: withLayout(<App />) },
      { path: 'register', element: withLayout(<Register />) },
      { path: 'login', element: withLayout(<Login />) },
      { path: 'discussions', element: withLayout(<Discussions />) },
      { path: 'discussions/new', element: withLayout(<CreateDiscussion />) },
      { path: 'discussions/:id', element: withLayout(<DiscussionDetail />) },
      { path: 'voting-sessions', element: withLayout(<VotingSessions />) },
      { path: 'voting-sessions/new', element: withLayout(<CreateVotingSession />) },
      { path: 'voting-sessions/:id', element: withLayout(<VotingSessionDetail />) },
      { path: 'company', element: withLayout(<CompanyPage />) },
      { path: 'company/parties/new', element: withLayout(<CreateParty />) },
      
      // Error pages
      { path: '403', element: withLayout(<Forbidden />) },
      { path: '500', element: withLayout(<ServerError />) },
      { path: '*', element: withLayout(<NotFound />) }
    ]
  }
])
