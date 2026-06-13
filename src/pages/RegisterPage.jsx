import { useState } from 'react'
import { register } from '../api/auth'

export default function RegisterPage({ onRegister }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(email, password, name)
      if (onRegister) onRegister()
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 bg-surface-card border border-surface-border rounded-btn text-[15px] text-text-primary placeholder:text-text-dim outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all'
  const labelClass = 'block text-[13px] font-medium text-text-secondary mb-1.5'

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-text-primary">Create Account</h1>
          <p className="text-sm text-text-muted mt-1">Register to track your orders and submit proof.</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-btn text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent-600 text-white rounded-btn text-[15px] font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
            Sign In
          </a>
        </p>
      </div>
    </div>
  )
}
