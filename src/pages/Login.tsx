import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguageNavigate } from '../hooks/useLanguage'
import LanguageLink from '../components/LanguageLink'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { parseApiErrorResponse } from '../lib/errors'

type LoginPayload = {
  email: string
  password: string
}

export default function Login() {
  const { t } = useTranslation(['auth', 'common'])
  const [form, setForm] = useState<LoginPayload>({ email: '', password: '' })
  const [attempted, setAttempted] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const languageNavigate = useLanguageNavigate()

  // Show registration success message if redirected from register
  useEffect(() => {
    if (location.state?.message) {
      setStatus(location.state.message)
      // Clear the state to prevent message from persisting on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])
  const minLen = 8
  const len = form.password.length
  const remaining = Math.max(0, minLen - len)
  const hasUpper = /[A-Z]/.test(form.password)
  const hasNumber = /\d/.test(form.password)
  const hasSpecial = /[^A-Za-z0-9]/.test(form.password)
  const passwordValid = len >= minLen && hasUpper && hasNumber && hasSpecial

  function validateEmail(email: string): { valid: boolean; message: string } {
    const value = email.trim()
    if (value.length === 0) return { valid: false, message: t('auth:validation.emailRequired', 'Enter your email.') }
    if (!value.includes('@')) return { valid: false, message: t('auth:validation.emailInvalid', 'Email must contain @') }
    const [local, domain] = value.split('@')
    if (!local) return { valid: false, message: t('auth:validation.emailNoLocal', 'Email must have characters before @') }
    if (!domain) return { valid: false, message: t('auth:validation.emailNoDomain', 'Email must have a domain after @') }
    if (domain.includes(' ')) return { valid: false, message: t('auth:validation.emailSpaces', 'Email cannot contain spaces') }
    if (!domain.includes('.')) return { valid: false, message: t('auth:validation.emailNoDot', 'Domain must contain a dot (e.g., example.com)') }
    const parts = domain.split('.')
    const tld = parts[parts.length - 1]
    if (!tld || tld.length < 2) return { valid: false, message: t('auth:validation.emailTldShort', 'Top-level domain must be at least 2 characters') }
    return { valid: true, message: t('auth:validation.emailValid', 'Looks good.') }
  }
  const emailCheck = validateEmail(form.email)
  const emailValid = emailCheck.valid
  const emailMessage = emailCheck.message
  const emailHintColor = emailValid ? '#16a34a' : attempted ? '#b91c1c' : 'inherit'

  const reqColor = (ok: boolean) => (ok ? '#16a34a' : attempted ? '#b91c1c' : 'inherit')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const isValid = emailValid && passwordValid
    if (!isValid) {
      setAttempted(true)
      return
    }
    setIsSubmitting(true)
    setStatus(null)
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
        skipAuth: true,
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(await parseApiErrorResponse(response))
      }
      const data = (await response.json()) as { accessToken: string }
      if (data?.accessToken) {
        auth.login(data.accessToken)
        languageNavigate('/company')
        return
      }
      setStatus('Unexpected response')
    } catch (err) {
      setStatus((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container container-narrow">
      <div className="mt-8 mb-6 text-center">
        <h2>{t('login.title', 'Log in')}</h2>
        <p className="text-secondary mt-2">{t('login.subtitle', 'Welcome back to Veche.')}</p>
      </div>
      <form className="form card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">{t('common:forms.email.label', 'Email')}</label>
          <input 
            id="email" 
            className="text-input" 
            type="email" 
            required 
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t('common:forms.email.placeholder', 'Enter your email')}
          />
          <div style={{ color: emailHintColor, fontSize: 'var(--text-xs)' }}>{emailMessage}</div>
        </div>
        <div className="field">
          <label htmlFor="password">{t('common:forms.password.label', 'Password')}</label>
          <input 
            id="password" 
            className="text-input" 
            type="password" 
            required 
            value={form.password} 
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={t('common:forms.password.placeholder', 'Enter your password')}
          />
          <div style={{ display: 'grid', gap: 'var(--space-xs)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-sm)' }}>
            <div style={{ color: reqColor(len >= minLen) }}>
              {t('common:forms.password.minLength', `At least ${minLen} characters`, { count: minLen })}{len < minLen ? t('auth:validation.passwordSymbols', ` — ${remaining} more symbols`, { count: remaining }) : ''}
            </div>
            <div style={{ color: reqColor(hasUpper) }}>{t('common:forms.password.requiresUpper', 'At least 1 uppercase letter')}</div>
            <div style={{ color: reqColor(hasNumber) }}>{t('common:forms.password.requiresNumber', 'At least 1 number')}</div>
            <div style={{ color: reqColor(hasSpecial) }}>{t('common:forms.password.requiresSpecial', 'At least 1 special character')}</div>
          </div>
        </div>
        <div className="mt-2">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('login.submitting', 'Signing in...') : t('login.button', 'Sign in')}
          </button>
        </div>
      </form>
      {status && (
        <p className="mt-4 text-secondary">{status}</p>
      )}
      <p className="mt-4 text-secondary text-center">
        {t('login.newUser', 'New to Veche?')} <LanguageLink to="/register" className="link">{t('login.createAccount', 'Create an account')}</LanguageLink>
      </p>
    </div>
  )
}


