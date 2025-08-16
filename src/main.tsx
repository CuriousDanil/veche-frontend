import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Register from './pages/Register.tsx'
import Header from './components/Header.tsx'
import Login from './pages/Login.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import Discussions from './pages/Discussions.tsx'
import CreateDiscussion from './pages/CreateDiscussion.tsx'
import DiscussionDetail from './pages/DiscussionDetail.tsx'
import VotingSessions from './pages/VotingSessions.tsx'
import CreateVotingSession from './pages/CreateVotingSession.tsx'
import VotingSessionDetail from './pages/VotingSessionDetail.tsx'
import CompanyPage from './pages/Company.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import TopLoader from './components/TopLoader.tsx'

function withLayout(children: ReactNode) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}

const router = createBrowserRouter([
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
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <TopLoader />
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
