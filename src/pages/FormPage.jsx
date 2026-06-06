import { useState, useEffect } from 'react'

function formatPrice(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
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
        setTickets(ticketsJson.data || [])
        setPaymentOptions((optionsJson.data || []).filter((o) => o.is_active))
      } catch (err) {
        setError(err.message || 'Failed to load data. Please try again later.')
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function updateField(field) {
    return (e) => {
      const value = e.target.value
      setForm((prev) => {
        const next = { ...prev, [field]: value }
        if (field === 'ticket_id') next.quantity = 1
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
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong') }
      else { setResult(data.transaction); setForm({ name: '', email: '', phone: '', ticket_id: '', quantity: 1, payment_method: '' }) }
    } catch { setError('Network error. Please try again.') }
    finally { setSubmitting(false) }
  }

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
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-surface-elevated rounded-card border border-surface-border p-8 text-center">
          <div className="w-14 h-14 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-1">Registration Confirmed</h2>
          <p className="text-text-muted text-sm mb-6">Thank you, {result.buyer_name}.</p>
          <div className="bg-surface-card rounded-btn p-4 text-left space-y-2.5 text-sm mb-6">
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
          <button onClick={() => setResult(null)}
            className="w-full py-3 px-6 bg-accent-600 text-white rounded-btn text-sm font-medium hover:bg-accent-500 active:scale-[0.98] transition-all">
            Register Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col lg:flex-row">
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
              <input type="tel" value={form.phone} onChange={updateField('phone')} placeholder="+62..." className={inputClass} />
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
                  onChange={(e) => { const v = Math.max(1, parseInt(e.target.value) || 1); setForm((p) => ({ ...p, quantity: v })) }}
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
            <button type="submit" disabled={submitting}
              className="w-full py-3.5 bg-accent-600 text-white rounded-btn text-[15px] font-semibold hover:bg-accent-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 mt-1">
              {submitting ? 'Processing...' : 'Submit Registration'}
            </button>
          </form>
        </div>
      </div>

      {/* Right — Poster */}
      <div className="lg:w-7/12 xl:w-8/12 bg-surface-elevated flex flex-col items-center justify-center p-5 sm:p-8 lg:p-10 xl:p-12 min-h-[60vh] lg:min-h-screen overflow-y-auto">
        {selectedTicket ? (
          <div className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl animate-[fadeIn_0.3s_ease-out]">
            <div className="rounded-card overflow-hidden bg-surface-card border border-surface-border shadow-card">
              {selectedTicket.image_url && (
                <div className="w-full bg-[#111]">
                  <img
                    src={selectedTicket.image_url}
                    alt={selectedTicket.title}
                    className="w-full h-auto max-h-[350px] sm:max-h-[420px] lg:max-h-[500px] xl:max-h-[580px] object-contain mx-auto"
                  />
                </div>
              )}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="text-xs font-semibold tracking-widest uppercase text-accent-400 bg-accent-500/10 px-2.5 py-1 rounded-full">
                    {selectedTicket.abbreviation}
                  </span>
                  <span className="text-xs text-text-dim">{stock} tickets left</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3 leading-[1.2]">
                  {selectedTicket.title}
                </h2>

                {selectedTicket.description && (
                  <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
                    {selectedTicket.description}
                  </p>
                )}

                <div className="space-y-3 mb-7">
                  {selectedTicket.date_time && (
                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                      <svg className="w-4 h-4 text-accent-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(selectedTicket.date_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        &nbsp;&middot;&nbsp;
                        {new Date(selectedTicket.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  {selectedTicket.location && (
                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                      <svg className="w-4 h-4 text-accent-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{selectedTicket.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between pt-5 border-t border-surface-border">
                  <div>
                    <p className="text-xs text-text-dim mb-1">Price per ticket</p>
                    <p className="text-xl sm:text-2xl font-bold text-text-primary">{formatPrice(selectedTicket.price)}</p>
                  </div>
                  {form.quantity > 1 && (
                    <div className="text-right">
                      <p className="text-xs text-text-dim mb-1">{form.quantity} &times; tickets</p>
                      <p className="text-lg font-bold text-accent-400">{formatPrice(selectedTicket.price * form.quantity)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl text-center">
            <p className="text-lg font-semibold text-text-secondary mb-2">No event selected</p>
            <p className="text-sm text-text-dim mb-8">Pick one from the dropdown to see details here</p>

            {availableTickets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setForm((prev) => ({ ...prev, ticket_id: String(ticket.id), quantity: 1 }))}
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
