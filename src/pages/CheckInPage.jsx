import { useState } from 'react'

export default function CheckInPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleCheckIn(e) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unique_code: code.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setResult(data.transaction)
        setCode('')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-4 bg-white border border-surface-border rounded-btn text-2xl text-text-primary placeholder:text-text-dim/70 placeholder:tracking-normal placeholder:font-sans outline-hidden focus:border-accent-500 focus:ring-2 focus:ring-accent-500/40 transition-all text-center tracking-[0.3em] font-mono uppercase'

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface-base px-4 py-8 flex items-start sm:items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-accent-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Check-in</h1>
          <p className="text-sm text-text-muted mt-1.5">Enter the unique code to confirm attendance.</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-btn text-sm text-center font-medium">{error}</div>
        )}

        {result ? (
          <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 text-center shadow-card animate-[fadeIn_0.3s_ease-out]">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Checked in
            </span>
            <h2 className="text-xl font-bold text-text-primary leading-tight">{result.buyer_name}</h2>
            <p className="text-sm text-text-muted mt-1 mb-5">{result.ticket}</p>

            <div className="bg-surface-card rounded-xl divide-y divide-surface-border/60 text-left mb-5">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-xs text-text-muted shrink-0">Transaction</span>
                <span className="font-medium text-text-secondary font-mono text-xs truncate">{result.transaction_id}</span>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-xs text-text-muted shrink-0">Email</span>
                <span className="text-sm text-text-secondary truncate">{result.buyer_email}</span>
              </div>
              {result.checked_in_at && (
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-xs text-text-muted shrink-0">Time</span>
                  <span className="text-sm text-text-secondary">
                    {new Date(result.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full py-4 bg-accent-600 text-white rounded-btn text-[15px] font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all"
            >
              Check In Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckIn} className="bg-surface-elevated border border-surface-border rounded-2xl p-5 shadow-card">
            <div className="mb-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                aria-label="Unique check-in code"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-4 bg-accent-600 text-white rounded-btn text-base font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? 'Checking...' : 'Check In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
