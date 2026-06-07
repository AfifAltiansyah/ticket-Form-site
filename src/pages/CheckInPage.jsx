import { useState, useEffect } from 'react'

export default function CheckInPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [checkedIn, setCheckedIn] = useState([])

  async function loadCheckedIn() {
    try {
      const res = await fetch('/api/transactions')
      if (!res.ok) return
      const data = await res.json()
      const list = (data.data || []).filter((t) => t.status === 'checked_in')
      list.sort((a, b) => new Date(b.checked_in_at || b.updated_at) - new Date(a.checked_in_at || a.updated_at))
      setCheckedIn(list)
    } catch {}
  }

  useEffect(() => { loadCheckedIn() }, [])
  useEffect(() => { if (result) loadCheckedIn() }, [result])

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

  const inputClass = 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-btn text-[17px] text-white placeholder:text-white/30 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all text-center tracking-[0.1em] font-mono'
  const labelClass = 'block text-[13px] font-medium text-text-secondary mb-1.5'

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      {/* Check-in form */}
      <div className="flex-1 flex items-start justify-center px-4 pt-20 lg:pt-24">
        <div className="w-full max-w-sm">
          <div className="text-center mb-7">
            <div className="w-16 h-16 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-[28px] font-bold text-text-primary">Check-in</h1>
            <p className="text-sm text-text-muted mt-0.5">Enter the unique code to confirm attendance.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-btn text-sm text-center">{error}</div>
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">checked in</span>
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
                className="w-full py-3.5 bg-accent-600 text-white rounded-btn text-[15px] font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? 'Checking...' : 'Check In'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Checked-in list */}
      <div className="px-4 pb-16 pt-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-semibold text-text-primary">Checked In</h2>
            <span className="text-xs text-text-dim bg-surface-card px-2 py-0.5 rounded-full">{checkedIn.length}</span>
          </div>

          {checkedIn.length === 0 ? (
            <p className="text-sm text-text-dim">No attendees checked in yet.</p>
          ) : (
            <div className="space-y-2">
              {checkedIn.map((tx) => (
                <div
                  key={tx.transaction_id}
                  className="flex items-center gap-4 bg-surface-card border border-surface-border rounded-btn px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{tx.buyer_name}</p>
                    <p className="text-xs text-text-muted">{tx.buyer_email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-secondary font-mono">{tx.transaction_id?.split('-').pop()}</p>
                    {tx.checked_in_at && (
                      <p className="text-[11px] text-text-dim">
                        {new Date(tx.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
