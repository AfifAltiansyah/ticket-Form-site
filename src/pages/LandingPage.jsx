import { useState } from 'react'
import { login, register } from '../api/auth'

export default function LandingPage({ onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'register') {
        await register(email, password, name)
      } else {
        await login(email, password)
      }
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col lg:flex-row">
      {/* Left — Hero Section */}
      <div className="lg:w-1/2 xl:w-[55%] relative overflow-hidden flex items-center justify-center p-8 lg:p-16 min-h-[40vh] lg:min-h-screen">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600/20 via-surface-base to-surface-base" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-accent-700/10 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 max-w-md">
          {/* Logo/Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-500/10 border border-accent-500/20 rounded-full mb-8">
            <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-accent-400 tracking-wide uppercase">Live Event</span>
          </div>

          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary leading-[1.1] mb-6">
            Zero To
            <span className="block bg-gradient-to-r from-accent-400 to-accent-300 bg-clip-text text-transparent">
              AI Workshop
            </span>
          </h1>

          <p className="text-lg text-text-secondary leading-relaxed mb-8">
            Level Up Your AI Skills: Intro to Hermes Agent. Hands-on workshop at Work Usual Jakarta.
          </p>

          {/* Event Details */}
          <div className="space-y-4">
            {[
              { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'June 13, 2026 · 15:00 WIB' },
              { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', label: 'Work Usual Jakarta' },
              { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Rp 70,000 per ticket' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-surface-card rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                  </svg>
                </div>
                <span className="text-sm text-text-secondary">{label}</span>
              </div>
            ))}
          </div>

          {/* Decorative dots */}
          <div className="hidden lg:flex items-center gap-1.5 mt-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-accent-400' : 'bg-surface-border'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="lg:w-1/2 xl:w-[45%] flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-2xl font-bold text-text-primary">Zero To AI</h2>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-surface-card rounded-xl p-1 mb-8">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === tab
                    ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/20'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-1">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-sm text-text-muted">
              {mode === 'login'
                ? 'Sign in to view your orders and submit proof.'
                : 'Create an account to register for events.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-xl text-[15px] text-text-primary placeholder:text-text-dim outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-xl text-[15px] text-text-primary placeholder:text-text-dim outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-xl text-[15px] text-text-primary placeholder:text-text-dim outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-accent-600 text-white rounded-xl text-[15px] font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
            >
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-sm text-text-muted mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchMode}
              className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          {/* Skip to browse */}
          <div className="text-center mt-4">
            <a href="/events" className="text-xs text-text-dim hover:text-text-muted transition-colors">
              or browse events without an account →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
