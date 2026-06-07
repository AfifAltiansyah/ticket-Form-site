export default function QRPage() {
  const checkinUrl = 'https://daftar-ticket.netlify.app/checkin'

  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center px-4 gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Check-in</h1>
        <p className="text-sm text-text-muted">Scan this code to open the check-in page</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-2xl">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkinUrl)}`}
          alt="Check-in QR Code"
          className="w-72 h-72 sm:w-80 sm:h-80"
        />
      </div>
      <p className="text-xs text-text-dim text-center max-w-xs">
        {checkinUrl}
      </p>
    </div>
  )
}
