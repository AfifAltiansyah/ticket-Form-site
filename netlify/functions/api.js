const CRM_API_URL = process.env.CRM_API_URL || 'https://rthxlprgtfuhntpcdhsh.supabase.co/functions/v1/api'
const CRM_API_KEY = process.env.CRM_API_KEY || ''
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
}

function errorResponse(status, message) {
  return { statusCode: status, headers: cors, body: JSON.stringify({ error: message }) }
}

async function proxyToCrm(method, apiPath, body, authToken) {
  const url = CRM_API_URL + apiPath
  const headers = { 'Content-Type': 'application/json', 'X-Api-Key': CRM_API_KEY }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`
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

  // Extract auth token from frontend
  const authToken = (event.headers.authorization || '').replace('Bearer ', '') || null

  try {
    // POST /api/submit — transaction creation (no proof)
    if (method === 'POST' && path === '/submit') {
      const { name, email, phone, ticket_id, quantity, payment_method, drink } = body

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

      console.log('[api-submit] sending to CRM, payload keys:', Object.keys(payload))
      let result
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

      let resultData
      try {
        resultData = await result.json()
      } catch {
        console.error('[api-submit] CRM response is not JSON, status:', result.status)
        return errorResponse(502, 'CRM returned invalid response')
      }

      if (!result.ok) return errorResponse(result.status, resultData.error || 'Failed')

      // CRM returns array when quantity > 1, single object when quantity = 1
      const txn = Array.isArray(resultData.data) ? resultData.data[0] : resultData.data

      console.log('[api-submit] CRM response, txn id:', txn?.id, 'transaction_id:', txn?.transaction_id)

      return {
        statusCode: 201,
        headers: cors,
        body: JSON.stringify({
          success: true,
          transaction: {
            id: txn.id,
            transaction_id: txn.transaction_id || txn.id,
            ticket: ticket.title,
            buyer_name: name,
            total_amount: total,
            payment_method,
            status: 'pending',
          },
        }),
      }
    }

    // POST /api/checkin — check in by unique code
    if (method === 'POST' && path === '/checkin') {
      const { unique_code } = body
      if (!unique_code) return errorResponse(400, 'Unique code is required')
      return proxyToCrm(method, '/external/checkin', body, authToken)
    }

    // POST /api/upload-proof — upload proof image and update transaction
    if (method === 'POST' && path === '/upload-proof') {
      const { transaction_id, proof, proof_name } = body

      console.log('[upload-proof] transaction_id:', transaction_id, 'proof length:', proof?.length || 0, 'proof_name:', proof_name)

      if (!transaction_id || !proof) {
        return errorResponse(400, 'Transaction ID and proof are required')
      }

      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return errorResponse(500, 'Supabase credentials not configured')
      }

      const match = proof.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!match) {
        console.error('[upload-proof] Invalid proof format, first 100 chars:', proof.substring(0, 100))
        return errorResponse(400, 'Invalid proof format — expected base64 data URI')
      }

      const contentType = match[1]
      const base64Data = match[2]
      const buffer = Buffer.from(base64Data, 'base64')
      const ext = contentType.split('/')[1] || 'jpg'
      const safeName = (proof_name || `proof.${ext}`).replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = safeName
      const filePath = `${transaction_id}/${fileName}`

      console.log(`[upload-proof] uploading ${filePath} (${buffer.length} bytes, ${contentType})`)

      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/proofs/${filePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'x-upsert': 'true',
        },
        body: buffer,
      })

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => '')
        console.error('[upload-proof] Storage upload failed:', uploadRes.status, errText)
        console.error('[upload-proof] Storage URL:', `${SUPABASE_URL}/storage/v1/object/proofs/${filePath}`)
        console.error('[upload-proof] Content-Type:', contentType, 'Buffer length:', buffer.length)
        return errorResponse(uploadRes.status, 'Failed to upload image to storage: ' + errText)
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/proofs/${filePath}`
      console.log('[upload-proof] uploaded to:', publicUrl)

      const patchRes = await fetch(`${CRM_API_URL}/external/transactions/${transaction_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': CRM_API_KEY,
        },
        body: JSON.stringify({
          metadata: {
            proof_url: publicUrl,
            proof_name: fileName,
          },
        }),
      })

      if (!patchRes.ok) {
        const errData = await patchRes.json().catch(() => ({}))
        console.error('[upload-proof] CRM PATCH failed:', patchRes.status, errData)
        return errorResponse(patchRes.status, errData.error || 'Failed to update transaction')
      }

      console.log('[upload-proof] CRM updated successfully')
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({ success: true, proof_url: publicUrl }),
      }
    }

    // All other requests — proxy directly to CRM
    return proxyToCrm(method, path, body, authToken)
  } catch (err) {
    console.error('API proxy error:', err)
    return errorResponse(500, 'Internal error: ' + err.message)
  }
}
