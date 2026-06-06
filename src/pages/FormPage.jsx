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

        const ticketsJson = await ticketsRes.json()
        const optionsJson = await optionsRes.json()

        setTickets(ticketsJson.data || [])
        setPaymentOptions(
          (optionsJson.data || []).filter((o) => o.is_active)
        )
      } catch (err) {
        setError('Failed to load data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function updateField(field) {
    return (e) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const selectedTicket = tickets.find((t) => t.id === Number(form.ticket_id))

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    setError('')

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

  if (result) {
    return (
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Confirmed!</h2>
        <p className="text-gray-600 mb-6">
          Thank you, <strong>{result.buyer_name}</strong>. Your transaction has been recorded.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-mono font-medium">{result.transaction_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Event</span>
            <span>{result.ticket}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(result.total_amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment</span>
            <span className="capitalize">{result.payment_method.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              {result.status}
            </span>
          </div>
        </div>
        <button
          onClick={() => setResult(null)}
          className="w-full py-3 px-4 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
        >
          Register Again
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Loading events...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Register for Event</h1>
        <p className="text-gray-500 mt-1">Fill in your details to secure your spot.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={updateField('name')}
            placeholder="John Doe"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={updateField('email')}
            placeholder="john@example.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={updateField('phone')}
            placeholder="+62812..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event *</label>
          <select
            required
            value={form.ticket_id}
            onChange={updateField('ticket_id')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow text-sm bg-white"
          >
            <option value="">Select an event</option>
            {tickets.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.title} — {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(ticket.price)}
              </option>
            ))}
          </select>
          {selectedTicket && (
            <p className="mt-1 text-xs text-gray-500">
              {selectedTicket.location} &middot; {selectedTicket.date_time ? new Date(selectedTicket.date_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
            <input
              type="text"
              readOnly
              value={
                selectedTicket
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedTicket.price * form.quantity)
                  : '-'
              }
              className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 cursor-default"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
          <select
            required
            value={form.payment_method}
            onChange={updateField('payment_method')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow text-sm bg-white"
          >
            <option value="">Select payment method</option>
            {paymentOptions.map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.label}
                {opt.account_number ? ` — ${opt.account_number}` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Processing...
            </span>
          ) : (
            'Submit Registration'
          )}
        </button>
      </form>
    </div>
  )
}
