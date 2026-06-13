const CRM_API_URL = process.env.CRM_API_URL || process.env.VITE_CRM_API_URL || 'https://rthxlprgtfuhntpcdhsh.supabase.co/functions/v1/api'
const CRM_API_KEY = process.env.CRM_API_KEY || process.env.VITE_CRM_API_KEY || ''
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function errorResponse(status, message) {
  return { statusCode: status, headers: cors, body: JSON.stringify({ error: message }) }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors }
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed')
  }

  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch {}

  const { transaction_id, proof, proof_name } = body

  if (!transaction_id || !proof) {
    return errorResponse(400, 'Transaction ID and proof are required')
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse(500, 'Supabase credentials not configured')
  }

  try {
    // Extract content type and base64 data from data URI
    const match = proof.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!match) return errorResponse(400, 'Invalid proof format — expected base64 data URI')

    const contentType = match[1]
    const base64Data = match[2]
    const buffer = Buffer.from(base64Data, 'base64')
    const ext = contentType.split('/')[1] || 'jpg'
    const fileName = proof_name || `proof.${ext}`
    const filePath = `${transaction_id}/${fileName}`

    console.log(`[upload-proof] uploading ${filePath} (${buffer.length} bytes, ${contentType})`)

    // Upload to Supabase Storage
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
      return errorResponse(uploadRes.status, 'Failed to upload image to storage')
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/proofs/${filePath}`
    console.log('[upload-proof] uploaded to:', publicUrl)

    // PATCH CRM transaction with proof URL
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
  } catch (err) {
    console.error('[upload-proof] Error:', err.message)
    return errorResponse(500, 'Internal error: ' + err.message)
  }
}
