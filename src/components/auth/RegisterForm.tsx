import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './register-form.css'

const RegisterForm: React.FC = () => {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register({ name, email, password })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Registration failed')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form" aria-label="Register form">
        <div className="form-row">
          <label htmlFor="name">Name</label>
          <input id="name" aria-label="Full name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" aria-label="Email address" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" aria-label="Password" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="msg-error">{error}</div>}
        {success && <div className="msg-success">Account created. You are signed in.</div>}
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
        </div>
      </form>
    </div>
  )
}

export default RegisterForm
