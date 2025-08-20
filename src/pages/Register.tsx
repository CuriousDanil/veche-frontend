import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguageNavigate } from '../hooks/useLanguage'
import LanguageLink from '../components/LanguageLink'
import { apiFetch } from '../lib/api'
import { parseApiErrorResponse } from '../lib/errors'

type RegisterPayload = {
  email: string
  password: string
  name: string
  companyName: string
  partyName: string
}

export default function Register() {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const languageNavigate = useLanguageNavigate()
  const [form, setForm] = useState<RegisterPayload>({
    email: '',
    password: '',
    name: '',
    companyName: '',
    partyName: '',
  })
  const [attempted, setAttempted] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const response = await apiFetch('/api/auth/register/founder', {
        method: 'POST',
        body: JSON.stringify(form),
        skipAuth: true,
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(await parseApiErrorResponse(response))
      }
      setStatus(t('register.success'))
      setTimeout(() => {
        languageNavigate('/login', { state: { message: t('register.successMessage') } })
      }, 1500)
    } catch (err) {
      setStatus((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container container-narrow">
      <div className="mt-8 mb-6 text-center">
        <h2>{t('register.title', 'Create founder account')}</h2>
        <p className="text-secondary mt-2">{t('register.subtitle', 'Start your organization and invite your community.')}</p>
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
          <div style={{ color: emailHintColor, fontSize: 'var(--text-xs)' }}>
            {emailMessage}
          </div>
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
        <div className="field">
          <label htmlFor="name">{t('common:forms.name.label', 'Name')}</label>
          <input 
            id="name" 
            className="text-input" 
            type="text" 
            required 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('common:forms.name.placeholder', 'Enter your name')}
          />
        </div>
        <div className="field">
          <label htmlFor="companyName">{t('register.companyName.label', 'Company name')}</label>
          <input 
            id="companyName" 
            className="text-input" 
            type="text" 
            required 
            value={form.companyName} 
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            placeholder={t('register.companyName.placeholder', 'Enter your company name')}
          />
        </div>
        <div className="field">
          <label htmlFor="partyName">{t('register.partyName.label', 'Party name')}</label>
          <input 
            id="partyName" 
            className="text-input" 
            type="text" 
            required 
            value={form.partyName} 
            onChange={(e) => setForm({ ...form, partyName: e.target.value })}
            placeholder={t('register.partyName.placeholder', 'Enter your party name')}
          />
        </div>
        <div className="mt-2">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('register.submitting', 'Registering...') : t('register.button', 'Register')}
          </button>
        </div>
      </form>
      {status && (
        <p className="mt-4 text-secondary">{status}</p>
      )}
      <p className="mt-4 text-secondary text-center">
        {t('register.existingUser', 'Already have an account?')} <LanguageLink to="/login" className="link">{t('register.signIn', 'Log in')}</LanguageLink>
      </p>
    </div>
  )
}


