import { useState, useEffect } from 'react'

function formatPrice(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n)
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
    if (!form.ticket_id) {
      setError('Please select an event.')
      setSubmitting(false)
      return
    }
    if (selectedTicket && form.quantity > stock) {
      setError(`Only ${stock} ticket${stock > 1 ? 's' : ''} available for ${selectedTicket.title}.`)
      setSubmitting(false)
      return
    }
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setResult(data.transaction)
        setForm({ name: '', email: '', phone: '', ticket_id: '', quantity: 1, payment_method: '' })
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const availableTickets = tickets.filter((t) => (t.remaining ?? t.quantity) > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-44px)]">
        <div className="animate-spin w-8 h-8 border-[3px] border-claude-brand border-t-transparent rounded-full" />
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-[calc(100vh-44px)] flex items-center justify-center px-4 bg-claude-cream">
        <div className="w-full max-w-md bg-claude-canvas rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-claude-brand-light rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-claude-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold text-claude-ink mb-1">Registration Confirmed</h2>
          <p className="text-claude-ink-subtle text-sm mb-6">Thank you, {result.buyer_name}.</p>
          <div className="bg-claude-sand rounded p-4 text-left space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-claude-ink-subtle">Transaction ID</span>
              <span className="font-medium tabular-nums text-claude-ink-muted">{result.transaction_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-claude-ink-subtle">Event</span>
              <span>{result.ticket}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-claude-ink-subtle">Total</span>
              <span className="font-semibold text-claude-ink">{formatPrice(result.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-claude-ink-subtle">Payment</span>
              <span className="capitalize">{result.payment_method.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-claude-ink-subtle">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{result.status}</span>
            </div>
          </div>
          <button
            onClick={() => setResult(null)}
            className="w-full py-[11px] px-[22px] bg-claude-brand text-white rounded-pill text-[17px] font-normal tracking-[-0.374px] hover:bg-claude-brand-hover active:scale-[0.95] transition-all"
          >
            Register Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-44px)] flex flex-col lg:flex-row">
      {/* Left — Form */}
      <div className="lg:w-5/12 xl:w-4/12 flex items-start justify-center px-6 py-12 lg:py-16 bg-claude-canvas overflow-y-auto">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-[36px] lg:text-[40px] font-semibold tracking-[-0.28px] leading-[1.1] text-claude-ink">Register</h1>
            <p className="text-[17px] text-claude-ink-subtle mt-1 tracking-[-0.374px]">Fill in your details to secure your spot.</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 text-red-600 rounded-sm text-sm tracking-[-0.224px]">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-claude-ink mb-1 tracking-[-0.224px]">Full Name *</label>
              <input type="text" required value={form.name} onChange={updateField('name')} placeholder="John Doe"
                className="w-full px-4 py-3 border border-claude-hairline rounded-sm text-[17px] text-claude-ink placeholder:text-claude-ink-subtle outline-none focus:border-claude-brand focus:ring-1 focus:ring-claude-brand transition-shadow tracking-[-0.374px] bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-claude-ink mb-1 tracking-[-0.224px]">Email *</label>
              <input type="email" required value={form.email} onChange={updateField('email')} placeholder="john@example.com"
                className="w-full px-4 py-3 border border-claude-hairline rounded-sm text-[17px] text-claude-ink placeholder:text-claude-ink-subtle outline-none focus:border-claude-brand focus:ring-1 focus:ring-claude-brand transition-shadow tracking-[-0.374px] bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-claude-ink mb-1 tracking-[-0.224px]">Phone</label>
              <input type="tel" value={form.phone} onChange={updateField('phone')} placeholder="+62812..."
                className="w-full px-4 py-3 border border-claude-hairline rounded-sm text-[17px] text-claude-ink placeholder:text-claude-ink-subtle outline-none focus:border-claude-brand focus:ring-1 focus:ring-claude-brand transition-shadow tracking-[-0.374px] bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-claude-ink mb-1 tracking-[-0.224px]">Event *</label>
              <select required value={form.ticket_id} onChange={updateField('ticket_id')}
                className="w-full px-4 py-3 border border-claude-hairline rounded-sm text-[17px] text-claude-ink bg-white outline-none focus:border-claude-brand focus:ring-1 focus:ring-claude-brand transition-shadow tracking-[-0.374px] appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 fill=%22none%22><path d=%22M1 1.5l5 5 5-5%22 stroke=%22%239C8F86%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat">
                <option value="">Select an event</option>
                {availableTickets.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.title} — {formatPrice(ticket.price)} ({ticket.remaining ?? ticket.quantity} left)
                  </option>
                ))}
              </select>
              {selectedTicket && (
                <p className="mt-1 text-xs text-claude-ink-subtle tracking-[-0.224px]">
                  {selectedTicket.location} &middot; {selectedTicket.date_time ? new Date(selectedTicket.date_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-claude-ink mb-1 tracking-[-0.224px]">Quantity</label>
                <input type="number" min="1" value={form.quantity}
                  onChange={(e) => { const val = Math.max(1, parseInt(e.target.value) || 1); setForm((p) => ({ ...p, quantity: val })) }}
                  className={`w-full px-4 py-3 border rounded-sm text-[17px] text-claude-ink outline-none transition-shadow tracking-[-0.374px] bg-white ${form.quantity > stock ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-claude-hairline focus:border-claude-brand focus:ring-1 focus:ring-claude-brand'}`} />
                {form.quantity > stock && (
                  <p className="mt-1 text-xs text-red-600 tracking-[-0.224px]">Only {stock} ticket{stock > 1 ? 's' : ''} available.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-claude-ink mb-1 tracking-[-0.224px]">Total</label>
                <input type="text" readOnly
                  value={selectedTicket ? formatPrice(selectedTicket.price * form.quantity) : '\u2014'}
                  className="w-full px-4 py-3 border border-claude-hairline bg-claude-sand rounded-sm text-[17px] font-medium text-claude-ink-muted cursor-default tracking-[-0.374px]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-claude-ink mb-1 tracking-[-0.224px]">Payment Method *</label>
              <select required value={form.payment_method} onChange={updateField('payment_method')}
                className="w-full px-4 py-3 border border-claude-hairline rounded-sm text-[17px] text-claude-ink bg-white outline-none focus:border-claude-brand focus:ring-1 focus:ring-claude-brand transition-shadow tracking-[-0.374px] appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 fill=%22none%22><path d=%22M1 1.5l5 5 5-5%22 stroke=%22%239C8F86%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat">
                <option value="">Select payment method</option>
                {paymentOptions.map((opt) => (
                  <option key={opt.id} value={opt.value}>
                    {opt.label}{(opt.account_number || opt.phone) ? ` \u2014 ${opt.account_number || opt.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-[14px] px-[28px] bg-claude-brand text-white rounded-pill text-[18px] font-light tracking-[0] hover:bg-claude-brand-hover active:scale-[0.95] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-[18px] h-[18px] border-[2px] border-white border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : 'Submit Registration'}
            </button>
          </form>
        </div>
      </div>

      {/* Right — Poster + Event Selector */}
      <div className="lg:w-7/12 xl:w-8/12 bg-claude-tile flex flex-col min-h-[50vh] lg:min-h-[calc(100vh-44px)] lg:max-h-[calc(100vh-44px)] overflow-hidden">
        {/* Poster area */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 min-h-0">
          {selectedTicket ? (
            <div className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl">
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-product bg-[#1F1C1A]">
                {selectedTicket.image_url && (
                  <div className="w-full bg-neutral-900">
                    <img
                      src={selectedTicket.image_url}
                      alt={selectedTicket.title}
                      className="w-full h-auto max-h-[320px] lg:max-h-[400px] object-contain mx-auto"
                    />
                    <div className="h-px bg-white/10" />
                  </div>
                )}
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-claude-brand/15 flex items-center justify-center">
                      <span className="text-sm font-bold text-claude-brand">
                        {selectedTicket.abbreviation?.charAt(0) || 'E'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.15em] uppercase text-claude-brand">
                        {selectedTicket.abbreviation}
                      </p>
                      <p className="text-[10px] text-claude-tile-subtle">{stock} tickets available</p>
                    </div>
                  </div>

                  <h2 className="text-2xl lg:text-[32px] xl:text-[36px] font-semibold leading-[1.15] text-claude-tile-text mb-2">
                    {selectedTicket.title}
                  </h2>

                  {selectedTicket.description && (
                    <p className="text-sm lg:text-[17px] leading-relaxed text-claude-tile-subtle mb-6">
                      {selectedTicket.description}
                    </p>
                  )}

                  <div className="space-y-3 mb-8">
                    {selectedTicket.date_time && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-claude-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-claude-tile-text/80">
                          {new Date(selectedTicket.date_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          &nbsp;&middot;&nbsp;
                          {new Date(selectedTicket.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {selectedTicket.location && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-claude-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-claude-tile-text/80">{selectedTicket.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-5 border-t border-white/10 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-claude-tile-subtle/60 mb-1">Price per ticket</p>
                      <p className="text-xl lg:text-2xl font-semibold text-claude-tile-text">
                        {formatPrice(selectedTicket.price)}
                      </p>
                    </div>
                    {form.quantity > 1 && (
                      <div className="text-right">
                        <p className="text-[11px] text-claude-tile-subtle/60 mb-1">&times;{form.quantity} total</p>
                        <p className="text-lg font-semibold text-claude-brand">
                          {formatPrice(selectedTicket.price * form.quantity)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center px-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 lg:mb-6">
                <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-lg lg:text-[21px] font-semibold text-claude-tile-subtle tracking-[0.231px]">Select an event</p>
              <p className="text-sm text-white/20 mt-1 tracking-[-0.224px]">Choose from below or the form dropdown</p>
            </div>
          )}
        </div>

        {/* Event selector strip */}
        <div className="border-t border-white/5 px-6 sm:px-8 lg:px-12 py-4 lg:py-5">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
            {availableTickets.map((ticket) => {
              const isSelected = Number(form.ticket_id) === ticket.id
              const remaining = ticket.remaining ?? ticket.quantity

              return (
                <button
                  key={ticket.id}
                  onClick={() => setForm((prev) => ({ ...prev, ticket_id: String(ticket.id), quantity: 1 }))}
                  className={`shrink-0 snap-start text-left rounded-xl border transition-all duration-300 active:scale-[0.97] ${
                    isSelected
                      ? 'border-claude-brand bg-claude-brand/10 scale-105'
                      : 'border-white/5 bg-white/5 hover:border-white/15 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="w-[140px] sm:w-[160px] lg:w-[180px]">
                    <div className="aspect-[3/2] bg-neutral-800 rounded-t-xl overflow-hidden flex items-center justify-center">
                      {ticket.image_url ? (
                        <img src={ticket.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-claude-brand/20">
                          {ticket.abbreviation?.slice(0, 2) || ticket.title?.slice(0, 2) || 'EV'}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-claude-tile-text truncate">{ticket.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] font-medium text-claude-brand">{formatPrice(ticket.price)}</p>
                        <p className="text-[10px] text-claude-tile-subtle/70">{remaining} left</p>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
            {availableTickets.length === 0 && (
              <p className="text-sm text-claude-tile-subtle/50 py-2">No events available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
