import { useState, useEffect } from 'react'
import { lookupOrders, submitProof } from '../api/crm'
import { isLoggedIn, getUser } from '../api/auth'
import { useRealtimeRefresh } from '../hooks/useSupabaseRealtime'

function formatPrice(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_STYLES = {
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  checked_in: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  available: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending
  const label = status === 'checked_in' ? 'Checked In' : status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  )
}

function compressAndEncode(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX_W = 1024
      const MAX_H = 1024
      let { width, height } = img
      if (width > MAX_W || height > MAX_H) {
        const ratio = Math.min(MAX_W / width, MAX_H / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(file)
    }
    img.src = url
  })
}

export default function TrackOrder() {
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [proofModal, setProofModal] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [proofStatus, setProofStatus] = useState('pending')
  const [proofError, setProofError] = useState('')

  const user = getUser()
  const loggedIn = isLoggedIn()

  // Auto-load orders if logged in
  useEffect(() => {
    if (loggedIn && user?.email) {
      setEmail(user.email)
      loadOrders(user.email)
    }
  }, [])

  // Real-time: refresh orders when transactions change
  useRealtimeRefresh('transactions', () => {
    if (email) loadOrders(email)
  })

  async function loadOrders(emailToLookup) {
    if (!emailToLookup) return
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const res = await lookupOrders(emailToLookup)
      const data = res.data || []
      const filtered = data.filter(o => o.status !== 'available')
      setOrders(filtered)
      if (filtered.length === 0) {
        setError('No orders found for this email.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    if (!email.trim()) return
    loadOrders(email.trim())
  }

  function handleLogout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setEmail('')
    setOrders([])
    setSearched(false)
    window.location.reload()
  }

  async function handleProofSubmit(transactionId) {
    if (!proofFile || !transactionId) {
      setProofError('Missing file or transaction ID.')
      return
    }
    setProofStatus('uploading')
    setProofError('')
    try {
      const proofBase64 = await compressAndEncode(proofFile)
      console.log('[track-upload] transactionId:', transactionId, 'proof length:', proofBase64?.length || 0)
      const res = await fetch('/api/upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: transactionId, proof: proofBase64, proof_name: proofFile.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setProofStatus('sent')
      setProofFile(null)
      if (email) await loadOrders(email)
    } catch (err) {
      setProofError(err.message || 'Upload failed. Please try again.')
      setProofStatus('pending')
    }
  }

  async function handleWhatsAppConfirm(transactionId) {
    if (!transactionId) {
      setProofError('Transaction ID is missing.')
      return
    }
    setProofStatus('uploading')
    setProofError('')
    try {
      await submitProof(transactionId, { notes: 'Proof sent via WhatsApp' })
      setProofStatus('sent')
      if (email) await loadOrders(email)
    } catch (err) {
      setProofError(err.message || 'Failed to confirm. Please try again.')
      setProofStatus('pending')
    }
  }

  function openProofModal(transactionId) {
    setProofModal(transactionId)
    setProofFile(null)
    setProofStatus('pending')
    setProofError('')
  }

  const inputClass = 'w-full px-4 py-3 bg-surface-card border border-surface-border rounded-btn text-[15px] text-text-primary placeholder:text-text-dim outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all'

  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center px-4 py-10 lg:py-16 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="orange-glow absolute -left-[200px] top-[100px] -z-[1] h-[400px] w-[400px] animate-spin-slow rounded-full opacity-40" />
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-text-primary">Track My Order</h1>
          <p className="text-sm text-text-muted mt-1">
            {loggedIn
              ? <>Welcome back, <span className="text-text-primary font-medium">{user?.name || user?.email}</span></>
              : 'Enter your email to view your orders and submit proof.'}
          </p>
          {loggedIn && (
            <button onClick={handleLogout} className="mt-2 text-xs text-text-dim hover:text-red-400 transition-colors">
              Sign out
            </button>
          )}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className={inputClass}
            autoFocus={!loggedIn}
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="px-6 py-3 bg-accent-600 text-white rounded-btn text-sm font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-btn text-sm text-center">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-[3px] border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Order List */}
        {!loading && orders.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-text-dim mb-2">{orders.length} order{orders.length > 1 ? 's' : ''}</p>
            {orders.map((order) => {
              const isExpanded = expandedId === order.id
              const ticket = order.tickets || {}
              const hasProof = order.metadata?.proof_url || order.metadata?.notes

              return (
                <div
                  key={order.id}
                  className="bg-surface-elevated rounded-card border border-surface-border overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {ticket.abbreviation && (
                          <span className="text-xs font-semibold tracking-widest uppercase text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded-full shrink-0">
                            {ticket.abbreviation}
                          </span>
                        )}
                        <StatusBadge status={order.status} />
                      </div>
                      <span className="text-sm font-bold text-text-primary shrink-0">{formatPrice(order.total_amount)}</span>
                    </div>

                    <h3 className="text-[15px] font-semibold text-text-primary mb-1 truncate">
                      {ticket.title || 'Event Ticket'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      {ticket.date_time && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(ticket.date_time)}
                        </span>
                      )}
                      {ticket.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {ticket.location}
                        </span>
                      )}
                    </div>

                    {hasProof && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Proof submitted</span>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="flex-1 py-2 px-3 bg-surface-card border border-surface-border text-text-secondary rounded-btn text-xs font-medium hover:bg-surface-hover active:scale-[0.98] transition-all"
                      >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </button>
                      {!hasProof && order.status !== 'cancelled' && (
                        <button
                          onClick={() => openProofModal(order.transaction_id)}
                          className="flex-1 py-2 px-3 bg-accent-600 text-white rounded-btn text-xs font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all"
                        >
                          Submit Proof
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-surface-border px-5 py-4 bg-surface-card/50 space-y-2.5 text-sm">
                      {[
                        ['Transaction ID', order.transaction_id, true],
                        ['Buyer Name', order.buyer_name],
                        ['Email', order.buyer_email],
                        ['Phone', order.buyer_phone || '—'],
                        ['Quantity', order.quantity || 1],
                        ['Payment', (order.payment_method || '—').replace(/_/g, ' ')],
                      ].map(([label, value, mono]) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-text-muted text-xs">{label}</span>
                          <span className={`text-text-secondary text-xs ${mono ? 'font-mono' : ''}`}>{value}</span>
                        </div>
                      ))}
                      {ticket.price && (
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted text-xs">Price per ticket</span>
                          <span className="text-text-secondary text-xs">{formatPrice(ticket.price)}</span>
                        </div>
                      )}
                      {order.metadata?.proof_url && (
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted text-xs">Proof</span>
                          <a href={order.metadata.proof_url} target="_blank" rel="noopener noreferrer" className="text-accent-400 text-xs underline truncate max-w-[200px]">View Image</a>
                        </div>
                      )}
                      {order.metadata?.notes && (
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted text-xs">Notes</span>
                          <span className="text-text-secondary text-xs">{order.metadata.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && orders.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-surface-card rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm font-medium">No orders found</p>
            <a href="/" className="text-xs text-accent-400 hover:text-accent-300 mt-2 inline-block transition-colors">
              Register for an event →
            </a>
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-8">
          <a href="/" className="text-xs text-text-muted hover:text-accent-400 transition-colors">
            ← Back to Registration
          </a>
        </div>
      </div>

      {/* Proof Upload Modal */}
      {proofModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setProofModal(null)}
        >
          <div
            className="w-full max-w-sm bg-surface-elevated rounded-card border border-surface-border p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Submit Proof of Payment</h3>
              <button onClick={() => setProofModal(null)} className="p-1 text-text-dim hover:text-text-primary transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {proofStatus === 'sent' ? (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-btn p-4">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-400">Proof submitted successfully</p>
                  <p className="text-xs text-green-400/60 mt-0.5">Your order will be verified shortly.</p>
                </div>
              </div>
            ) : (
              <>
                {proofError && (
                  <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-btn text-xs">{proofError}</div>
                )}

                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-text-secondary">Option 1: Upload here</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files[0] || null)}
                    className="block w-full text-xs text-text-muted file:mr-3 file:py-2 file:px-4 file:rounded-btn file:border-0 file:text-xs file:font-medium file:bg-accent-600 file:text-white hover:file:bg-accent-500 file:cursor-pointer file:transition-colors"
                  />
                  {proofFile && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <img src={URL.createObjectURL(proofFile)} alt="Preview" className="w-8 h-8 rounded object-cover" />
                      <span className="truncate flex-1">{proofFile.name}</span>
                      <button onClick={() => setProofFile(null)} className="text-text-dim hover:text-red-400 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!proofFile || proofStatus === 'uploading'}
                    onClick={() => handleProofSubmit(proofModal)}
                    className="w-full py-2.5 bg-accent-600 text-white rounded-btn text-xs font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {proofStatus === 'uploading' ? 'Uploading...' : 'Submit Proof'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-surface-border" />
                  <span className="text-[11px] text-text-dim">or</span>
                  <div className="flex-1 h-px bg-surface-border" />
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-text-secondary">Option 2: Send via WhatsApp</p>
                  <button
                    type="button"
                    onClick={() => {
                      const order = orders.find(o => o.transaction_id === proofModal)
                      const msg = `Hi ACODERA, Ini Bukti Transferku Dengan Transaction ID ${proofModal} - ${order?.tickets?.title || ''}`
                      window.open(`https://wa.me/6285719540188?text=${encodeURIComponent(msg)}`, '_blank')
                    }}
                    className="w-full py-2.5 bg-green-600 text-white rounded-btn text-xs font-semibold hover:bg-green-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Send via WhatsApp
                  </button>
                  <button
                    type="button"
                    disabled={proofStatus === 'uploading'}
                    onClick={() => handleWhatsAppConfirm(proofModal)}
                    className="w-full py-2.5 bg-surface-card border border-surface-border text-text-secondary rounded-btn text-xs font-medium hover:bg-surface-hover active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {proofStatus === 'uploading' ? 'Confirming...' : "I've sent it via WhatsApp"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
