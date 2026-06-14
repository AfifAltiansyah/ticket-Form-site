export async function lookupOrders(email) {
  const res = await fetch(`/api/external/transactions?email=${encodeURIComponent(email)}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Lookup failed (${res.status})`)
  }
  return res.json()
}

export async function submitProof(transactionId, metadata) {
  const res = await fetch(`/api/external/transactions/${transactionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to submit proof')
  }
  return res.json()
}

export async function uploadProof(transactionId, proof, proofName) {
  const res = await fetch('/api/upload-proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction_id: transactionId, proof, proof_name: proofName }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Upload failed')
  }
  return res.json()
}
