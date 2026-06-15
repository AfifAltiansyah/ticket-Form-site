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

  const inputClass = 'w-full px-4 py-3 bg-white border border-surface-border rounded-btn text-[17px] text-text-primary placeholder:text-text-dim outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all text-center tracking-[0.1em] font-mono'
  const labelClass = 'block text-[13px] font-medium text-text-secondary mb-1.5'

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-accent-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-text-primary">Check-in</h1>
          <p className="text-sm text-text-muted mt-0.5">Enter the unique code to confirm attendance.</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50/80 border border-red-200 text-red-600 rounded-btn text-sm text-center">{error}</div>
        )}

        {result ? (
          <div className="bg-surface-elevated border border-surface-border rounded-card p-6 text-center animate-[fadeIn_0.3s_ease-out]">
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">{result.buyer_name}</h2>
            <p className="text-sm text-text-muted mb-5">{result.ticket}</p>
            <div className="bg-surface-card rounded-btn p-3 space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-text-muted">Transaction ID</span>
                <span className="font-medium text-text-secondary font-mono text-xs">{result.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Email</span>
                <span className="text-text-secondary">{result.buyer_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">checked in</span>
              </div>
              {result.checked_in_at && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Checked in at</span>
                  <span className="text-text-secondary text-xs">
                    {new Date(result.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setResult(null)}
              className="w-full py-3 bg-accent-600 text-white rounded-btn text-sm font-medium hover:bg-accent-500 active:scale-[0.98] transition-all"
            >
              Check In Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckIn}>
            <div className="mb-4">
              <label className={labelClass}>Unique Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                autoFocus
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3.5 bg-accent-600 text-white rounded-btn text-[15px] font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? 'Checking...' : 'Check In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
