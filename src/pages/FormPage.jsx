import { useState, useEffect } from 'react'
import { formatPrice, compressAndEncode } from '../utils'
import { useRealtimeRefresh } from '../hooks/useSupabaseRealtime'

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function setTicketParam(ticket) {
  const url = new URL(window.location)
  if (ticket) {
    url.searchParams.set('ticket', slugify(ticket.title || String(ticket.id)))
  } else {
    url.searchParams.delete('ticket')
  }
  history.replaceState(null, '', url)
}

export default function FormPage() {
  const [tickets, setTickets] = useState([])
  const [paymentOptions, setPaymentOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    ticket_id: '',
    quantity: 1,
    payment_method: '',
    drink: '',
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [ticketsRes, optionsRes] = await Promise.all([
          fetch('/api/external/tickets'),
          fetch('/api/external/payment_options'),
        ])
        if (!ticketsRes.ok) throw new Error(`Tickets API: ${ticketsRes.status}`)
        if (!optionsRes.ok) throw new Error(`Options API: ${optionsRes.status}`)
        const ticketsJson = await ticketsRes.json()
        const optionsJson = await optionsRes.json()
        const ticketData = ticketsJson.data || []
        setTickets(ticketData)
        setPaymentOptions((optionsJson.data || []).filter((o) => o.is_active))

        const urlParam = new URLSearchParams(window.location.search).get('ticket')
        if (urlParam) {
          const match = ticketData.find((t) => slugify(t.title || String(t.id)) === urlParam)
          if (match) setForm((prev) => ({ ...prev, ticket_id: String(match.id), quantity: 1 }))
        } else {
          // Auto-select closest upcoming event
          const now = new Date()
          const upcoming = ticketData
            .filter((t) => new Date(t.date_time) > now && (t.remaining ?? t.quantity) > 0)
            .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
          if (upcoming.length > 0) {
            const closest = upcoming[0]
            setForm((prev) => ({ ...prev, ticket_id: String(closest.id), quantity: 1 }))
            setTicketParam(closest)
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load data. Please try again later.')
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Real-time: refresh tickets when transactions change (ticket purchases from other users)
  useRealtimeRefresh('transactions', async () => {
    try {
      const ticketsRes = await fetch('/api/external/tickets')
      if (ticketsRes.ok) {
        const ticketsJson = await ticketsRes.json()
        setTickets(ticketsJson.data || [])
      }
    } catch { /* silent */ }
  })

  function updateField(field) {
    return (e) => {
      const value = e.target.value
      setForm((prev) => {
        const next = { ...prev, [field]: value }
        if (field === 'ticket_id') {
          next.quantity = 1
          const ticket = tickets.find((t) => t.id === Number(value))
          setTicketParam(ticket || null)
        }
        return next
      })
    }
  }

  const selectedTicket = tickets.find((t) => t.id === Number(form.ticket_id))
  const stock = selectedTicket?.remaining ?? selectedTicket?.quantity ?? 0

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    setError('')
    if (!form.ticket_id) { setError('Please select an event.'); setSubmitting(false); return }
    if (selectedTicket && form.quantity > stock) {
      setError(`Only ${stock} ticket${stock > 1 ? 's' : ''} available.`); setSubmitting(false); return
    }
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, ticket_id: form.ticket_id, quantity: form.quantity, payment_method: form.payment_method, drink: form.drink }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong') }
      else {
        setResult(data.transaction)
        if (data.warning) setError(data.warning)
        setTicketParam(null)
        setForm({ name: '', email: '', phone: '', ticket_id: '', quantity: 1, payment_method: '', drink: '' })
      }
    } catch { setError('Network error. Please try again.') }
    finally { setSubmitting(false) }
  }

  async function handleProofUpload() {
    if (!proofFile || !result) return
    const txnId = result.transaction_id || result.id
    if (!txnId) {
      setProofError('Transaction ID is missing.')
      return
    }
    setProofStatus('uploading')
    setProofError('')
    try {
      const proofBase64 = await compressAndEncode(proofFile)
      console.log('[proof-upload] txnId:', txnId, 'proof length:', proofBase64?.length || 0)
      const res = await fetch('/api/upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txnId, proof: proofBase64, proof_name: proofFile.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setProofStatus('sent_site')
      setProofFile(null)
    } catch (err) {
      setProofStatus('pending')
      setProofError(err.message || 'Upload failed. Please try again.')
    }
  }

  function handleWhatsAppProof() {
    if (!result) return
    const txnId = result.transaction_id || result.id || ''
    const msg = `Hi ACODERA, Ini Bukti Transferku Dengan Transaction ID ${txnId} - ${result.ticket || ''}`
    window.open(`https://wa.me/6285719540188?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function handleConfirmWhatsApp() {
    if (!result) return
    const txnId = result.transaction_id || result.id
    if (!txnId) {
      setProofError('Transaction ID is missing.')
      return
    }
    setProofStatus('uploading')
    setProofError('')
    try {
      const res = await fetch(`/api/external/transactions/${txnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: { notes: 'Proof sent via WhatsApp' } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setProofStatus('sent_whatsapp')
    } catch (err) {
      setProofStatus('pending')
      setProofError(err.message || 'Failed to confirm. Please try again.')
    }
  }

  const [lightbox, setLightbox] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [proofStatus, setProofStatus] = useState('pending')
  const [proofError, setProofError] = useState('')

  const availableTickets = tickets.filter((t) => (t.remaining ?? t.quantity) > 0)

  const inputClass = 'w-full px-4 py-3 bg-surface-card border border-surface-border rounded-btn text-[15px] text-text-primary placeholder:text-text-dim outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all'
  const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 fill=%22none%22><path d=%22M1 1.5l5 5 5-5%22 stroke=%22%23737373%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat`
  const labelClass = 'block text-[13px] font-medium text-text-secondary mb-1.5'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-base">
        <div className="animate-spin w-8 h-8 border-[3px] border-accent-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (result) {
    const proofDone = proofStatus === 'sent_site' || proofStatus === 'sent_whatsapp'
    const txnId = result.transaction_id || result.id || ''
    const whatsappMsg = `Hi ACODERA, Ini Bukti Transferku Dengan Transaction ID ${txnId} - ${result.ticket || ''}`

    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-4">
          {/* Transaction Confirmed */}
          <div className="bg-surface-elevated rounded-card border border-surface-border p-8 text-center">
            <div className="w-14 h-14 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">Registration Confirmed</h2>
            <p className="text-text-muted text-sm mb-6">Thank you, {result.buyer_name}.</p>
            <div className="bg-surface-card rounded-btn p-4 text-left space-y-2.5 text-sm">
              {[
                ['Transaction ID', result.transaction_id],
                ['Event', result.ticket],
                ['Total', formatPrice(result.total_amount)],
                ['Payment', result.payment_method.replace(/_/g, ' ')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-text-muted">{label}</span>
                  <span className="font-medium text-text-secondary">{value}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className="text-xs font-medium bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full">{result.status}</span>
              </div>
            </div>
          </div>

          {/* Send Proof of Transfer */}
          <div className="bg-surface-elevated rounded-card border border-surface-border p-6 sm:p-7">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-accent-500/10 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Send Proof of Transfer</h3>
                <p className="text-xs text-text-dim">Required to complete your registration</p>
              </div>
            </div>

            {proofDone ? (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-btn p-4">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-400">
                    {proofStatus === 'sent_site' ? 'Proof uploaded successfully' : 'Marked as sent via WhatsApp'}
                  </p>
                  <p className="text-xs text-green-400/60 mt-0.5">Your registration will be verified shortly.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {proofError && (
                  <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-btn text-xs">{proofError}</div>
                )}

                {/* Option A: Upload on-site */}
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-text-secondary">Option 1: Upload here</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files[0] || null)}
                    className="block w-full text-xs text-text-muted file:mr-3 file:py-2 file:px-4 file:rounded-btn file:border-0 file:text-xs file:font-medium file:bg-accent-600 file:text-white hover:file:bg-accent-500 file:cursor-pointer file:transition-colors"
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
                    disabled={!proofFile || proofStatus === 'uploading'}
                    onClick={handleProofUpload}
                    className="w-full py-2.5 bg-accent-600 text-white rounded-btn text-xs font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {proofStatus === 'uploading' ? 'Uploading...' : 'Submit Proof'}
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-surface-border" />
                  <span className="text-[11px] text-text-dim">or</span>
                  <div className="flex-1 h-px bg-surface-border" />
                </div>

                {/* Option B: WhatsApp */}
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-text-secondary">Option 2: Send via WhatsApp</p>
                  <button
                    type="button"
                    onClick={handleWhatsAppProof}
                    className="w-full py-2.5 bg-green-600 text-white rounded-btn text-xs font-semibold hover:bg-green-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Send via WhatsApp
                  </button>
                  <button
                    type="button"
                    disabled={proofStatus === 'uploading'}
                    onClick={handleConfirmWhatsApp}
                    className="w-full py-2.5 bg-surface-card border border-surface-border text-text-secondary rounded-btn text-xs font-medium hover:bg-surface-hover active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {proofStatus === 'uploading' ? 'Confirming...' : "I've sent it via WhatsApp"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Register Again */}
          <button onClick={() => { setResult(null); setProofFile(null); setProofStatus('pending'); setProofError('') }}
            className="w-full py-3 px-6 bg-accent-600 text-white rounded-btn text-sm font-medium hover:bg-accent-500 active:scale-[0.98] transition-all">
            Register Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col lg:flex-row relative overflow-hidden">
      {/* Decorative glow */}
      <div className="orange-glow absolute -right-[150px] top-[370px] -z-[1] h-[500px] w-[500px] animate-spin-slow rounded-full opacity-60" />
      {/* Left — Form */}
      <div className="lg:w-5/12 xl:w-4/12 flex items-start justify-center px-5 py-10 lg:py-16 overflow-y-auto">
        <div className="w-full max-w-[380px]">
          <div className="mb-7">
            <h1 className="text-[28px] lg:text-[32px] font-bold text-text-primary">Event Registration</h1>
            <p className="text-sm text-text-muted mt-0.5">Secure your spot — fill in the details below.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-btn text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input type="text" required value={form.name} onChange={updateField('name')} placeholder="Enter your full name" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" required value={form.email} onChange={updateField('email')} placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" value={form.phone} onChange={updateField('phone')} placeholder="Phone" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Event *</label>
              <select required value={form.ticket_id} onChange={updateField('ticket_id')} className={selectClass}>
                <option value="">Choose an event</option>
                {availableTickets.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} — {formatPrice(t.price)}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Quantity</label>
                <input type="number" min="1" value={form.quantity}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') {
                      setForm((p) => ({ ...p, quantity: '' }))
                    } else {
                      const num = parseInt(val)
                      if (!isNaN(num) && num >= 1) {
                        setForm((p) => ({ ...p, quantity: num }))
                      }
                    }
                  }}
                  onBlur={() => {
                    if (!form.quantity || form.quantity < 1) {
                      setForm((p) => ({ ...p, quantity: 1 }))
                    }
                  }}
                  className={`${inputClass} ${form.quantity > stock ? '!border-red-500/50 !ring-red-500/30' : ''}`} />
                {form.quantity > stock && <p className="text-xs text-red-400 mt-1">Only {stock} available</p>}
              </div>
              <div>
                <label className={labelClass}>Total</label>
                <input type="text" readOnly
                  value={selectedTicket ? formatPrice(selectedTicket.price * form.quantity) : '\u2014'}
                  className={`${inputClass} bg-surface-border/20 text-text-secondary cursor-default`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Payment Method *</label>
              <select required value={form.payment_method} onChange={updateField('payment_method')} className={selectClass}>
                <option value="">Select method</option>
                {paymentOptions.map((o) => (
                  <option key={o.id} value={o.value}>{o.label}{(o.account_number || o.phone) ? ` \u2014 ${o.account_number || o.phone}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Drink</label>
              <select value={form.drink} onChange={updateField('drink')} className={selectClass}>
                <option value="">Select Drink</option>
                <option value="regular_tea">Regular Tea</option>
                <option value="javanish_latte">Javanish Latte</option>
                <option value="latte">Latte</option>
                <option value="lemon_tea">Lemon Tea</option>
              </select>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-3.5 bg-accent-600 text-white rounded-btn text-[15px] font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 mt-1">
              {submitting ? 'Processing...' : 'Checkout'}
            </button>
          </form>
        </div>
      </div>

      {/* Right — Poster */}
      <div className="lg:w-7/12 xl:w-8/12 bg-surface-elevated flex flex-col items-center justify-center p-5 sm:p-8 lg:p-10 xl:p-12 min-h-[60vh] lg:min-h-screen overflow-y-auto">
        {selectedTicket ? (
          <>
            <div className="w-full max-w-2xl xl:max-w-3xl animate-[fadeIn_0.3s_ease-out]">
              <div className="rounded-card overflow-hidden bg-surface-card border border-surface-border shadow-card flex flex-col sm:flex-row">
                {/* Image side */}
                {selectedTicket.image_url && (
                  <button
                    onClick={() => setLightbox(true)}
                    className="sm:w-[45%] shrink-0 bg-[#111] flex items-center justify-center cursor-pointer group relative overflow-hidden border-b sm:border-b-0 sm:border-r border-surface-border"
                  >
                    <img
                      src={selectedTicket.image_url}
                      alt={selectedTicket.title}
                      className="w-full h-auto max-h-[240px] sm:max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}

                {/* Info side */}
                <div className="flex-1 p-6 sm:p-7 lg:p-8 flex flex-col min-w-0">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-xs font-semibold tracking-widest uppercase text-accent-400 bg-accent-500/10 px-2.5 py-1 rounded-full">
                      {selectedTicket.abbreviation}
                    </span>
                    <span className="text-xs text-text-dim">{stock} tickets left</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-text-primary mb-2 leading-[1.2]">
                    {selectedTicket.title}
                  </h2>

                  {selectedTicket.description && (
                    <p className="text-[14px] text-text-secondary leading-relaxed mb-4 line-clamp-3">
                      {selectedTicket.description}
                    </p>
                  )}

                  <div className="space-y-2.5 mb-5 flex-1">
                    {selectedTicket.date_time && (
                      <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
                        <svg className="w-3.5 h-3.5 text-accent-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">
                          {new Date(selectedTicket.date_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          &nbsp;&middot;&nbsp;
                          {new Date(selectedTicket.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {selectedTicket.location && (
                      <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
                        <svg className="w-3.5 h-3.5 text-accent-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{selectedTicket.location}</span>
                      </div>
                    )}
                    {selectedTicket.maps_link && (
                      <div className="flex items-center gap-2.5 text-[13px]">
                        <div className="w-3.5 shrink-0" />
                        <a href={selectedTicket.maps_link} target="_blank" rel="noopener noreferrer"
                          className="text-accent-500 hover:text-accent-600 font-medium underline">
                          Google Maps
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between pt-4 border-t border-surface-border">
                    <div>
                      <p className="text-[11px] text-text-dim mb-0.5">Price per ticket</p>
                      <p className="text-lg sm:text-xl font-bold text-text-primary">{formatPrice(selectedTicket.price)}</p>
                    </div>
                    {form.quantity > 1 && (
                      <div className="text-right">
                        <p className="text-[11px] text-text-dim mb-0.5">{form.quantity} &times;</p>
                        <p className="text-base font-bold text-accent-400">{formatPrice(selectedTicket.price * form.quantity)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* What to Bring */}
            <div className="w-full max-w-2xl xl:max-w-3xl mt-5 animate-[fadeIn_0.3s_ease-out]">
              <div className="rounded-card bg-surface-card border border-surface-border shadow-card p-6 sm:p-7">
                <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  What to Bring
                </h3>
                <ul className="space-y-2.5">
                  {[
                    { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', text: 'A laptop (fully charged) + charger' },
                    /*{ icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', text: 'Python 3.10+ installed on your machine' },
                    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', text: 'A code editor (VS Code recommended)' },
                    { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', text: 'Notebook & pen for taking notes' },*/
                    { icon: 'M14.828 14.828a4 4 0 01-5.656 0M9.172 9.172a4 4 0 015.656 0M10 9V5a1 1 0 011-1h2a1 1 0 011 1v4m-4 6v4a1 1 0 001 1h2a1 1 0 001-1v-4', text: 'Curiosity and enthusiasm to learn AI!' },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-start gap-3 text-[13px] text-text-secondary">
                      <svg className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                      </svg>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Lightbox */}
            {lightbox && selectedTicket.image_url && (
              <div
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-[fadeIn_0.15s_ease-out]"
                onClick={() => setLightbox(false)}
              >
                <button
                  onClick={() => setLightbox(false)}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <img
                  src={selectedTicket.image_url}
                  alt={selectedTicket.title}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        ) : (
          <div className="w-full max-w-xl text-center">
            <p className="text-lg font-semibold text-text-secondary mb-2">No event selected</p>
            <p className="text-sm text-text-dim mb-8">Pick one from the dropdown to see details here</p>

            {availableTickets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => { setTicketParam(ticket); setForm((prev) => ({ ...prev, ticket_id: String(ticket.id), quantity: 1 })) }}
                    className="text-left bg-surface-card border border-surface-border rounded-card p-4 hover:border-accent-500/50 hover:bg-surface-hover transition-all active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0 group-hover:bg-accent-500/20 transition-colors">
                        <span className="text-sm font-bold text-accent-400">
                          {ticket.abbreviation?.charAt(0) || ticket.title?.charAt(0) || 'E'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{ticket.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">{formatPrice(ticket.price)} &middot; {ticket.remaining ?? ticket.quantity} left</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
