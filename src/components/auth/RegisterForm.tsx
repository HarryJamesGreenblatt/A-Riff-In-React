import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './register-form.css'

const RegisterForm: React.FC = () => {
  const { register } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
  await register({ firstName, lastName, phone, email })
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
          <label htmlFor="firstName">First Name</label>
          <input id="firstName" aria-label="First name" placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="lastName">Last Name</label>
          <input id="lastName" aria-label="Last name" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="phone">Phone</label>
          <input id="phone" type="tel" aria-label="Phone number" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" aria-label="Email address" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
