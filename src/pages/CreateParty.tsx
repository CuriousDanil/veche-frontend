import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { parseApiErrorResponse } from '../lib/errors'

export default function CreateParty() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setStatus('Enter party name')
      return
    }
    setIsSubmitting(true)
    setStatus(null)
    try {
      const res = await apiFetch('/api/parties', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error(await parseApiErrorResponse(res))
      navigate('/company')
    } catch (e) {
      setStatus((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container container-narrow">
      <div className="mt-8 mb-6 text-center">
        <h2>Create party</h2>
        <p className="text-secondary mt-2">Add a new party to your organization for structured discussions and voting.</p>
      </div>
      <form className="form card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Party name</label>
          <input 
            id="name" 
            className="text-input" 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for this party"
            autoFocus
          />
        </div>
        <div className="button-group mt-6">
          <button className="primary-button" type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? 'Creating…' : 'Create party'}
          </button>
          <button 
            type="button" 
            className="secondary-button" 
            onClick={() => navigate('/company')}
          >
            Cancel
          </button>
        </div>
        {status && <p className="mt-4 text-secondary">{status}</p>}
      </form>
    </div>
  )
}


