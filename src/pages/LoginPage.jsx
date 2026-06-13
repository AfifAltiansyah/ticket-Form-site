import { useState } from 'react'
import { login } from '../api/auth'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      if (onLogin) onLogin()
    } catch (err) {
      setError(err.message || 'Login failed')
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-text-primary">Welcome Back</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to view your orders.</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-btn text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent-600 text-white rounded-btn text-[15px] font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Don't have an account?{' '}
          <a href="/register" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
            Register
          </a>
        </p>
      </div>
    </div>
  )
}
