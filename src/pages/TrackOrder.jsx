import { useState } from 'react'
import { formatPrice, compressAndEncode } from '../utils'
import { lookupOrders, uploadProof, submitProof } from '../api/crm'

const WHATSAPP_NUMBER = '6281934138145'
const STATUS_FILTERS = ['All', 'Pending', 'Paid', 'Checked In']

function statusStyle(status) {
  const s = (status || '').toLowerCase()
  if (s === 'paid' || s === 'confirmed') return 'bg-green-500/10 text-green-400'
  if (s === 'checked_in' || s === 'checked in') return 'bg-blue-500/10 text-blue-400'
  if (s === 'cancelled' || s === 'canceled') return 'bg-red-500/10 text-red-400'
  return 'bg-amber-400/10 text-amber-400'
}

function proofStatus(t) {
  const meta = t.metadata || {}
  if (meta.proof_url) return { label: 'Proof uploaded', color: 'text-green-400' }
  if (meta.notes && meta.notes.toLowerCase().includes('whatsapp')) return { label: 'Sent via WhatsApp', color: 'text-green-400' }
  return { label: 'No proof submitted', color: 'text-amber-400' }
}

export default function TrackOrder() {
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)

  const [proofFile, setProofFile] = useState(null)
  const [proofTarget, setProofTarget] = useState(null)
  const [proofLoading, setProofLoading] = useState(false)
  const [proofError, setProofError] = useState('')

  const filtered = filter === 'All' ? orders : orders.filter((t) => {
    const s = (t.status || '').toLowerCase()
    if (filter === 'Pending') return s === 'pending'
    if (filter === 'Paid') return s === 'paid' || s === 'confirmed'
    if (filter === 'Checked In') return s === 'checked_in' || s === 'checked in'
    return true
  })

  async function handleSearch(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    setExpanded(null)
    setProofTarget(null)
    try {
      const data = await lookupOrders(email.trim())
      setOrders(data.data || [])
    } catch (err) {
      setError(err.message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  function handleExpand(id) {
    setExpanded(expanded === id ? null : id)
    setProofTarget(null)
    setProofFile(null)
    setProofError('')
  }

  function startProof(order) {
    setProofTarget(order)
    setProofFile(null)
    setProofError('')
  }

  async function handleUploadProof() {
    if (!proofFile || !proofTarget) return
    setProofLoading(true)
    setProofError('')
    try {
      const txnId = proofTarget.transaction_id || proofTarget.id
      const base64 = await compressAndEncode(proofFile)
      await uploadProof(txnId, base64, proofFile.name)
      setOrders((prev) => prev.map((o) =>
        o.id === proofTarget.id
          ? { ...o, metadata: { ...o.metadata, proof_url: 'uploaded', proof_name: proofFile.name } }
          : o
      ))
      setProofTarget(null)
      setProofFile(null)
    } catch (err) {
      setProofError(err.message)
    } finally {
      setProofLoading(false)
    }
  }

  function handleWhatsApp(order) {
    const txnId = order.transaction_id || order.id
    const ticketName = order.tickets?.title || order.ticket || ''
    const msg = `Hi, here is my proof of transfer for transaction ${txnId} - ${ticketName}`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function handleConfirmWhatsApp(order) {
    setProofLoading(true)
    setProofError('')
    try {
      const txnId = order.transaction_id || order.id
      await submitProof(txnId, { notes: 'Proof sent via WhatsApp' })
      setOrders((prev) => prev.map((o) =>
        o.id === order.id
          ? { ...o, metadata: { ...o.metadata, notes: 'Proof sent via WhatsApp' } }
          : o
      ))
      setProofTarget(null)
    } catch (err) {
      setProofError(err.message)
    } finally {
      setProofLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center px-4 py-10 lg:py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-[28px] lg:text-[32px] font-bold text-text-primary">Track My Order</h1>
          <p className="text-sm text-text-muted mt-1">Enter your email to view your orders and submit proof of transfer.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 bg-surface-card border border-surface-border rounded-btn text-[15px] text-text-primary placeholder:text-text-dim outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-accent-600 text-white rounded-btn text-[15px] font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-btn text-sm">{error}</div>
        )}

        {searched && !loading && orders.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-text-secondary font-medium mb-1">No orders found</p>
            <p className="text-sm text-text-dim">No transactions found for this email address.</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-1 bg-surface-card rounded-btn p-1 border border-surface-border">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setExpanded(null); setProofTarget(null) }}
                  className={`flex-1 py-2 rounded-[10px] text-xs font-medium transition-all ${
                    filter === f ? 'bg-accent-600 text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <p className="text-xs text-text-dim">{filtered.length} order{filtered.length !== 1 ? 's' : ''} found</p>

            <div className="space-y-3">
              {filtered.map((order) => {
                const ticket = order.tickets || {}
                const isExpanded = expanded === order.id
                const proof = proofStatus(order)
                const showProofForm = proofTarget?.id === order.id

                return (
                  <div key={order.id} className="bg-surface-elevated rounded-card border border-surface-border overflow-hidden">
                    <button
                      onClick={() => handleExpand(order.id)}
                      className="w-full text-left p-5 hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-text-primary truncate">
                            {ticket.title || order.ticket || 'Event'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                            {ticket.date_time && (
                              <span>{new Date(ticket.date_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            )}
                            {ticket.location && (
                              <>
                                <span>&middot;</span>
                                <span className="truncate">{ticket.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${statusStyle(order.status)}`}>
                            {order.status || 'pending'}
                          </span>
                          <p className="text-sm font-bold text-text-primary mt-1">{formatPrice(order.total_amount)}</p>
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-text-dim mt-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-surface-border pt-4 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-text-dim text-xs mb-0.5">Transaction ID</p>
                            <p className="text-text-secondary font-mono text-xs">{order.transaction_id}</p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs mb-0.5">Quantity</p>
                            <p className="text-text-secondary">{order.quantity || 1}</p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs mb-0.5">Buyer</p>
                            <p className="text-text-secondary">{order.buyer_name}</p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs mb-0.5">Payment</p>
                            <p className="text-text-secondary capitalize">{(order.payment_method || '').replace(/_/g, ' ')}</p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs mb-0.5">Purchased</p>
                            <p className="text-text-secondary">
                              {order.purchased_at ? new Date(order.purchased_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-dim text-xs mb-0.5">Proof Status</p>
                            <p className={`text-xs font-medium ${proof.color}`}>{proof.label}</p>
                          </div>
                        </div>

                        {proof.label === 'No proof submitted' && (
                          <div className="pt-2 border-t border-surface-border space-y-3">
                            {proofError && (
                              <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-btn text-xs">{proofError}</div>
                            )}

                            {showProofForm ? (
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-text-secondary">Upload proof</p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setProofFile(e.target.files[0] || null)}
                                    className="block w-full text-xs text-text-muted file:mr-3 file:py-2 file:px-4 file:rounded-btn file:border-0 file:text-xs file:font-medium file:bg-accent-600 file:text-white hover:file:bg-accent-500 file:cursor-pointer"
                                  />
                                  {proofFile && (
                                    <div className="flex items-start gap-3 bg-surface-card rounded-btn p-3 border border-surface-border">
                                      <img src={URL.createObjectURL(proofFile)} alt="Preview" className="w-10 h-10 rounded object-cover shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-text-primary truncate">{proofFile.name}</p>
                                        <p className="text-[11px] text-text-dim">{(proofFile.size / 1024).toFixed(0)} KB</p>
                                      </div>
                                      <button type="button" onClick={() => setProofFile(null)} className="p-1 text-text-dim hover:text-red-400 transition-colors shrink-0">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    disabled={!proofFile || proofLoading}
                                    onClick={handleUploadProof}
                                    className="w-full py-2.5 bg-accent-600 text-white rounded-btn text-xs font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    {proofLoading ? 'Uploading...' : 'Submit Proof'}
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-px bg-surface-border" />
                                  <span className="text-[11px] text-text-dim">or</span>
                                  <div className="flex-1 h-px bg-surface-border" />
                                </div>

                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={() => handleWhatsApp(order)}
                                    className="w-full py-2.5 bg-green-600 text-white rounded-btn text-xs font-semibold hover:bg-green-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    Send via WhatsApp
                                  </button>
                                  <button
                                    type="button"
                                    disabled={proofLoading}
                                    onClick={() => handleConfirmWhatsApp(order)}
                                    className="w-full py-2.5 bg-surface-card border border-surface-border text-text-secondary rounded-btn text-xs font-medium hover:bg-surface-hover active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    {proofLoading ? 'Confirming...' : "I've sent it via WhatsApp"}
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setProofTarget(null)}
                                  className="w-full py-2 text-xs text-text-dim hover:text-text-secondary transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startProof(order)}
                                className="w-full py-2.5 bg-accent-600 text-white rounded-btn text-xs font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all"
                              >
                                Submit Proof of Transfer
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
