import { useState, useEffect, useMemo } from 'react'

function TicketCard({ ticket, isSelected, stackIndex, totalCards, hasSelection, onSelect }) {
  const stock = ticket.remaining ?? ticket.quantity

  let transform = ''
  let opacity = 1
  let zIndex = totalCards - stackIndex

  if (!hasSelection) {
    const yOffset = stackIndex * 32
    const rotation = (stackIndex % 2 === 0 ? -1.5 : 1.5) * (stackIndex + 1) * 0.6
    transform = `translateY(${yOffset}px) rotate(${rotation}deg)`
    opacity = 1 - stackIndex * 0.08
  } else if (isSelected) {
    transform = 'translateY(0px) rotate(0deg) scale(1)'
    zIndex = totalCards + 10
  } else {
    const yOffset = 20 + stackIndex * 28
    const rotation = (stackIndex % 2 === 0 ? 2 : -2) * 0.8
    transform = `translateY(${yOffset}px) rotate(${rotation}deg) scale(${0.96 - stackIndex * 0.015})`
    opacity = 0.6 - stackIndex * 0.1
  }

  return (
    <button
      key={ticket.id}
      onClick={() => onSelect(ticket.id)}
      className={`absolute inset-x-0 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-claude-brand focus-visible:ring-offset-4 focus-visible:ring-offset-claude-tile focus-visible:rounded-lg transition-all duration-500 ${isSelected ? 'hover:shadow-2xl' : 'hover:opacity-90'}`}
      style={{ transform, opacity, zIndex, transformOrigin: 'center top' }}
    >
      <div className={`rounded-lg overflow-hidden border ${isSelected ? 'border-white/15 shadow-product' : 'border-white/5'} bg-[#22201D]`}>
        {ticket.image_url ? (
          <div className="relative w-full aspect-[2/1] bg-neutral-800">
            <img src={ticket.image_url} alt={ticket.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#22201D] via-[#22201D]/30 to-transparent" />
          </div>
        ) : (
          <div className="w-full aspect-[2/1] bg-claude-brand/10 flex items-center justify-center">
            <span className="text-5xl font-bold text-claude-brand/20">
              {ticket.abbreviation?.charAt(0) || ticket.title?.charAt(0) || 'E'}
            </span>
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-claude-brand">
              {ticket.abbreviation}
            </span>
            <span className="w-1 h-1 rounded-full bg-claude-tile-subtle/40" />
            <span className="text-[10px] text-claude-tile-subtle">{stock} left</span>
          </div>
          <h3 className="text-lg font-semibold leading-snug text-claude-tile-text mb-1">{ticket.title}</h3>
          <p className="text-xs text-claude-tile-subtle leading-relaxed line-clamp-2 mb-3">
            {ticket.description || '\u00A0'}
          </p>
          <div className="flex items-center gap-4 text-xs text-claude-tile-subtle">
            {ticket.date_time && (
              <span>{new Date(ticket.date_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
            {ticket.location && <span className="truncate">{ticket.location}</span>}
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-claude-tile-subtle/60 mb-0.5">Price</p>
              <p className="text-base font-semibold text-claude-tile-text">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(ticket.price)}
              </p>
            </div>
            {isSelected && (
              <span className="text-[10px] font-medium text-claude-brand bg-claude-brand/10 px-2 py-1 rounded-full">Selected</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
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
      setError('Please select an event from the cards.')
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

  const deckOrder = useMemo(() => {
    if (!form.ticket_id) return availableTickets
    const selected = availableTickets.find((t) => t.id === Number(form.ticket_id))
    if (!selected) return availableTickets
    const rest = availableTickets.filter((t) => t.id !== Number(form.ticket_id))
    return [selected, ...rest]
  }, [availableTickets, form.ticket_id])

  function selectCard(ticketId) {
    setForm((prev) => ({ ...prev, ticket_id: String(ticketId), quantity: 1 }))
  }

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
              <span className="font-semibold text-claude-ink">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(result.total_amount)}
              </span>
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
      <div className="lg:w-5/12 flex items-center justify-center px-6 py-12 lg:py-0 bg-claude-canvas">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-[40px] font-semibold tracking-[-0.28px] leading-[1.1] text-claude-ink">Register</h1>
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
                    {ticket.title} — {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(ticket.price)} ({ticket.remaining ?? ticket.quantity} left)
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
                  value={selectedTicket ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedTicket.price * form.quantity) : '\u2014'}
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

      {/* Right — Card Deck */}
      <div className="lg:w-7/12 bg-claude-tile flex flex-col items-center justify-center p-8 lg:p-12 min-h-[60vh] lg:min-h-0 relative overflow-hidden">
        <div className="relative w-full max-w-[480px] mx-auto" style={{ height: '520px' }}>
          {deckOrder.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[21px] font-semibold text-claude-tile-subtle">No events available</p>
            </div>
          )}
          {deckOrder.map((ticket, idx) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isSelected={Number(form.ticket_id) === ticket.id}
              stackIndex={idx}
              totalCards={deckOrder.length}
              hasSelection={!!form.ticket_id}
              onSelect={selectCard}
            />
          ))}
        </div>
        {deckOrder.length > 0 && !form.ticket_id && (
          <p className="mt-6 text-xs text-claude-tile-subtle/60 tracking-[-0.12px]">Tap a card to select an event</p>
        )}
      </div>
    </div>
  )
}
