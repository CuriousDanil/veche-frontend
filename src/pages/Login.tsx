import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { parseApiErrorResponse } from '../lib/errors'

type LoginPayload = {
  email: string
  password: string
}

export default function Login() {
  const [form, setForm] = useState<LoginPayload>({ email: '', password: '' })
  const [attempted, setAttempted] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()
  const minLen = 8
  const len = form.password.length
  const remaining = Math.max(0, minLen - len)
  const hasUpper = /[A-Z]/.test(form.password)
  const hasNumber = /\d/.test(form.password)
  const hasSpecial = /[^A-Za-z0-9]/.test(form.password)
  const passwordValid = len >= minLen && hasUpper && hasNumber && hasSpecial

  function validateEmail(email: string): { valid: boolean; message: string } {
    const value = email.trim()
    if (value.length === 0) return { valid: false, message: 'Enter your email.' }
    if (!value.includes('@')) return { valid: false, message: 'Email must contain @' }
    const [local, domain] = value.split('@')
    if (!local) return { valid: false, message: 'Email must have characters before @' }
    if (!domain) return { valid: false, message: 'Email must have a domain after @' }
    if (domain.includes(' ')) return { valid: false, message: 'Email cannot contain spaces' }
    if (!domain.includes('.')) return { valid: false, message: 'Domain must contain a dot (e.g., example.com)' }
    const parts = domain.split('.')
    const tld = parts[parts.length - 1]
    if (!tld || tld.length < 2) return { valid: false, message: 'Top-level domain must be at least 2 characters' }
    return { valid: true, message: 'Looks good.' }
  }
  const emailCheck = validateEmail(form.email)
  const emailValid = emailCheck.valid
  const emailMessage = emailValid ? 'Looks good.' : emailCheck.message
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
        navigate('/')
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
      <div style={{ paddingTop: 48, paddingBottom: 24 }}>
        <h2 style={{ fontSize: 32, margin: 0 }}>Log in</h2>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Welcome back to Veche.</p>
      </div>
      <form className="form card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="text-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div style={{ color: emailHintColor, fontSize: 12 }}>{emailMessage}</div>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="text-input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div style={{ display: 'grid', gap: 4, fontSize: 12, marginTop: 6 }}>
            <div style={{ color: reqColor(len >= minLen) }}>
              At least {minLen} characters{len < minLen ? ` — ${remaining} more symbols` : ''}
            </div>
            <div style={{ color: reqColor(hasUpper) }}>At least 1 uppercase letter</div>
            <div style={{ color: reqColor(hasNumber) }}>At least 1 number</div>
            <div style={{ color: reqColor(hasSpecial) }}>At least 1 special character</div>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
      {status && (
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>{status}</p>
      )}
      <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>
        New to Veche? <Link to="/register" className="link">Create an account</Link>
      </p>
    </div>
  )
}


