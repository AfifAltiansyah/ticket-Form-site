const CRM_API_URL = process.env.CRM_API_URL || 'https://rthxlprgtfuhntpcdhsh.supabase.co/functions/v1/api'
const CRM_API_KEY = process.env.CRM_API_KEY || ''

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
  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch {}

  try {
    // POST /api/submit — enhanced transaction creation
    if (method === 'POST' && path === '/submit') {
      const { name, email, phone, ticket_id, quantity, payment_method, drink, proof, proof_name } = body

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
      if (drink) payload.drink = drink
      if (proof) {
        console.log('[api-submit] proof size:', proof.length, 'chars')
        payload.proof = proof
        payload.proof_name = proof_name || ''
      }

      console.log('[api-submit] sending to CRM, payload keys:', Object.keys(payload))
      let result
      let proofWarning = null
      try {
        result = await fetch(`${CRM_API_URL}/external/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': CRM_API_KEY },
          body: JSON.stringify(payload),
        })
      } catch (fetchErr) {
        console.error('[api-submit] CRM fetch failed:', fetchErr.message)
        return errorResponse(502, 'CRM unreachable')
      }

      // If proof caused an error, retry without it
      if (!result.ok && proof) {
        console.log('[api-submit] Retrying without proof...')
        proofWarning = 'Proof could not be saved'
        delete payload.proof
        delete payload.proof_name
        try {
          result = await fetch(`${CRM_API_URL}/external/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Api-Key': CRM_API_KEY },
            body: JSON.stringify(payload),
          })
        } catch (fetchErr) {
          console.error('[api-submit] CRM retry failed:', fetchErr.message)
          return errorResponse(502, 'CRM unreachable')
        }
      }

      // Try to parse the response
      let resultData
      try {
        resultData = await result.json()
      } catch {
        console.error('[api-submit] CRM response is not JSON, status:', result.status)
        return errorResponse(502, 'CRM returned invalid response')
      }

      if (!result.ok) return errorResponse(result.status, resultData.error || 'Failed')

      return {
        statusCode: 201,
        headers: cors,
        body: JSON.stringify({
          success: true,
          warning: proofWarning || undefined,
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
