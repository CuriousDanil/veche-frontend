import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import './lib/i18n' // Initialize i18n
import { loadCoreTranslations } from './lib/i18n'
import { router } from './router'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import TopLoader from './components/TopLoader'

// Preload critical translations
loadCoreTranslations('en').catch(console.error)

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
