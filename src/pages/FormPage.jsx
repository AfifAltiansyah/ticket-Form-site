import { useState, useEffect } from 'react'

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
        setPaymentOptions(
          (optionsJson.data || []).filter((o) => o.is_active)
        )
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

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    setError('')

    if (selectedTicket && form.quantity > selectedTicket.quantity) {
      setError(`Only ${selectedTicket.quantity} ticket${selectedTicket.quantity > 1 ? 's' : ''} available for ${selectedTicket.title}.`)
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

  const availableTickets = tickets.filter((t) => t.quantity > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-44px)]">
        <div className="animate-spin w-8 h-8 border-[3px] border-apple-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-[calc(100vh-44px)] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-apple-canvas rounded-apple-lg p-8 text-center">
          <div className="w-16 h-16 bg-[#f0f7ff] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-apple-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold text-apple-ink mb-1">Registration Confirmed</h2>
          <p className="text-apple-ink-subtle text-sm mb-6">
            Thank you, {result.buyer_name}.
          </p>
          <div className="bg-apple-parchment rounded-apple-sm p-4 text-left space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-apple-ink-subtle">Transaction ID</span>
              <span className="font-medium tabular-nums text-apple-ink-muted">{result.transaction_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-apple-ink-subtle">Event</span>
              <span>{result.ticket}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-apple-ink-subtle">Total</span>
              <span className="font-semibold text-apple-ink">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(result.total_amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-apple-ink-subtle">Payment</span>
              <span className="capitalize">{result.payment_method.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-apple-ink-subtle">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                {result.status}
              </span>
            </div>
          </div>
          <button
            onClick={() => setResult(null)}
            className="w-full py-[11px] px-[22px] bg-apple-blue text-white rounded-apple-pill text-[17px] font-normal tracking-[-0.374px] hover:opacity-90 active:scale-[0.95] transition-all"
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
      <div className="lg:w-6/12 flex items-center justify-center px-6 py-12 lg:py-0 bg-apple-canvas">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="text-[40px] font-semibold tracking-[-0.28px] leading-[1.1] text-apple-ink">
              Register
            </h1>
            <p className="text-[17px] text-apple-ink-subtle mt-1 tracking-[-0.374px]">
              Fill in your details to secure your spot.
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 text-red-600 rounded-apple-sm text-sm tracking-[-0.224px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-apple-ink mb-1 tracking-[-0.224px]">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={updateField('name')}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-apple-sm text-[17px] text-apple-ink placeholder:text-apple-ink-subtle outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-shadow tracking-[-0.374px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-ink mb-1 tracking-[-0.224px]">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={updateField('email')}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-apple-sm text-[17px] text-apple-ink placeholder:text-apple-ink-subtle outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-shadow tracking-[-0.374px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-ink mb-1 tracking-[-0.224px]">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={updateField('phone')}
                placeholder="+62812..."
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-apple-sm text-[17px] text-apple-ink placeholder:text-apple-ink-subtle outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-shadow tracking-[-0.374px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-ink mb-1 tracking-[-0.224px]">
                Event *
              </label>
              <select
                required
                value={form.ticket_id}
                onChange={updateField('ticket_id')}
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-apple-sm text-[17px] text-apple-ink bg-white outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-shadow tracking-[-0.374px] appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;12&quot; height=&quot;8&quot; fill=&quot;none&quot;><path d=&quot;M1 1.5l5 5 5-5&quot; stroke=&quot;%237a7a7a&quot; stroke-width=&quot;1.5&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot;/></svg>')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
              >
                <option value="">Select an event</option>
                {availableTickets.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.title} — {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(ticket.price)} ({ticket.quantity} left)
                  </option>
                ))}
              </select>
              {selectedTicket && (
                <p className="mt-1 text-xs text-apple-ink-subtle tracking-[-0.224px]">
                  {selectedTicket.location} &middot; {selectedTicket.date_time ? new Date(selectedTicket.date_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-apple-ink mb-1 tracking-[-0.224px]">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1)
                    setForm((p) => ({ ...p, quantity: val }))
                  }}
                  className={`w-full px-4 py-3 border rounded-apple-sm text-[17px] text-apple-ink outline-none transition-shadow tracking-[-0.374px] ${
                    selectedTicket && form.quantity > selectedTicket.quantity
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-[#e0e0e0] focus:border-apple-blue focus:ring-1 focus:ring-apple-blue'
                  }`}
                />
                {selectedTicket && form.quantity > selectedTicket.quantity && (
                  <p className="mt-1 text-xs text-red-600 tracking-[-0.224px]">
                    Only {selectedTicket.quantity} ticket{selectedTicket.quantity > 1 ? 's' : ''} available.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-ink mb-1 tracking-[-0.224px]">
                  Total
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    selectedTicket
                      ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedTicket.price * form.quantity)
                      : '—'
                  }
                  className="w-full px-4 py-3 border border-[#e0e0e0] bg-apple-parchment rounded-apple-sm text-[17px] font-medium text-apple-ink-muted cursor-default tracking-[-0.374px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-ink mb-1 tracking-[-0.224px]">
                Payment Method *
              </label>
              <select
                required
                value={form.payment_method}
                onChange={updateField('payment_method')}
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-apple-sm text-[17px] text-apple-ink bg-white outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-shadow tracking-[-0.374px] appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;12&quot; height=&quot;8&quot; fill=&quot;none&quot;><path d=&quot;M1 1.5l5 5 5-5&quot; stroke=&quot;%237a7a7a&quot; stroke-width=&quot;1.5&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot;/></svg>')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
              >
                <option value="">Select payment method</option>
                {paymentOptions.map((opt) => (
                  <option key={opt.id} value={opt.value}>
                    {opt.label}
                    {(opt.account_number || opt.phone) ? ` — ${opt.account_number || opt.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-[14px] px-[28px] bg-apple-blue text-white rounded-apple-pill text-[18px] font-light tracking-[0] hover:opacity-90 active:scale-[0.95] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-[18px] h-[18px] border-[2px] border-white border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : (
                'Submit Registration'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right — Poster */}
      <div className="lg:w-6/12 bg-apple-tile flex items-center justify-center p-8 lg:p-16 min-h-[50vh] lg:min-h-0">
        {selectedTicket ? (
          <div className="w-full max-w-[420px]">
            <div className="bg-apple-tile border border-white/10 rounded-apple-lg p-8 lg:p-10">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-8">
                {selectedTicket.abbreviation}
              </p>
              <h2 className="text-[40px] font-semibold leading-[1.1] text-white mb-3">
                {selectedTicket.title}
              </h2>
              {selectedTicket.description && (
                <p className="text-[17px] leading-[1.47] text-white/60 mb-8">
                  {selectedTicket.description}
                </p>
              )}
              <div className="space-y-4 mb-8">
                {selectedTicket.date_time && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-apple-blue-dark mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-white/80 font-medium">
                        {new Date(selectedTicket.date_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-sm text-white/50">
                        {new Date(selectedTicket.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
                {selectedTicket.location && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-apple-blue-dark mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-white/80">{selectedTicket.location}</p>
                  </div>
                )}
              </div>
              <div className="border-t border-white/10 pt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/40 mb-1">Price per ticket</p>
                  <p className="text-[28px] font-semibold leading-[1.14] text-white">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedTicket.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40 mb-1">Available</p>
                  <p className="text-sm font-medium text-white/80">{selectedTicket.quantity} ticket{selectedTicket.quantity > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2m10 0v2m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[21px] font-semibold text-white/80 tracking-[0.231px]">Select an event</p>
            <p className="text-sm text-white/40 mt-1 tracking-[-0.224px]">Choose from the form to see details</p>
          </div>
        )}
      </div>
    </div>
  )
}
