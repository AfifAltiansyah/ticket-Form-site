const CRM_API_URL = process.env.CRM_API_URL || 'https://rthxlprgtfuhntpcdhsh.supabase.co/functions/v1/api'
const CRM_API_KEY = process.env.CRM_API_KEY || ''

console.log('[api-function] CRM_API_URL:', CRM_API_URL)
console.log('[api-function] CRM_API_KEY set:', !!CRM_API_KEY)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function errorResponse(status, message) {
  return { statusCode: status, headers: cors, body: JSON.stringify({ error: message }) }
}

async function proxyToCrm(method, apiPath, body) {
  const url = CRM_API_URL + apiPath
  const headers = { 'Content-Type': 'application/json', 'X-Api-Key': CRM_API_KEY }
  const options = { method, headers }
  if (body && method !== 'GET') options.body = JSON.stringify(body)

  const res = await fetch(url, options)
  const data = await res.json()
  return { statusCode: res.status, headers: cors, body: JSON.stringify(data) }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors }
  }

  const path = event.path
    .replace('/.netlify/functions/api', '')
    .replace('/api', '') || '/'
  const method = event.httpMethod
  console.log('[api-function] Request:', method, event.path, '→', CRM_API_URL + path)
  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch {}

  try {
    // POST /api/submit — enhanced transaction creation
    if (method === 'POST' && path === '/submit') {
      const { name, email, phone, ticket_id, quantity, payment_method } = body
      console.log('[api-submit] body:', JSON.stringify(body))

      if (!name || !email || !ticket_id || !payment_method) {
        return errorResponse(400, 'Name, email, ticket, and payment method are required')
      }

      const ticketRes = await fetch(`${CRM_API_URL}/external/tickets/${ticket_id}`, {
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': CRM_API_KEY },
      })
      const ticketJson = await ticketRes.json()
      if (!ticketJson.data) return errorResponse(400, 'Ticket not found')
      const ticket = ticketJson.data

      const qty = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1
      console.log('[api-submit] raw quantity:', quantity, '→ parsed qty:', qty)
      const total = ticket.price * qty
      const ts = Date.now()
      const abbrev = (ticket.abbreviation || 'TKT').toUpperCase()

      const payload = {
        ticket_id: ticket.id,
        transaction_id: `TKT-${abbrev}-${ts}`,
        unique_code: `${abbrev}${ts}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        barcode: String(Math.floor(Math.random() * 9999999999999)).padStart(13, '0'),
        quantity: qty,
        price_per_unit: ticket.price,
        total_amount: total,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone || '',
        payment_method: payment_method,
        status: 'pending',
        purchased_at: new Date().toISOString(),
      }

      const result = await fetch(`${CRM_API_URL}/external/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': CRM_API_KEY },
        body: JSON.stringify(payload),
      })
      const resultData = await result.json()

      if (!result.ok) return errorResponse(result.status, resultData.error || 'Failed')

      return {
        statusCode: 201,
        headers: cors,
        body: JSON.stringify({
          success: true,
          transaction: {
            id: resultData.data.id,
            transaction_id: resultData.data.transaction_id,
            ticket: ticket.title,
            buyer_name: name,
            total_amount: total,
            payment_method,
            status: 'pending',
          },
        }),
      }
    }

    // All other requests — proxy directly to CRM
    return proxyToCrm(method, path, body)
  } catch (err) {
    console.error('API proxy error:', err)
    return errorResponse(500, 'Internal error: ' + err.message)
  }
}
