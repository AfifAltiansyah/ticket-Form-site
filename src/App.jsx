import { useState, useEffect } from 'react'
import FormPage from './pages/FormPage'
import CheckInPage from './pages/CheckInPage'
import QRPage from './pages/QRPage'
import TrackOrder from './pages/TrackOrder'

export default function App() {
  const [mode, setMode] = useState('register')

  useEffect(() => {
    function update() {
      const path = window.location.pathname
      if (path === '/checkin') setMode('checkin')
      else if (path === '/qr') setMode('qr')
      else if (path === '/track') setMode('track')
      else setMode('register')
    }
    update()
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <header className="w-full bg-black px-4 lg:px-8">
        <nav className="max-w-[1440px] mx-auto h-11 flex items-center justify-between">
          <span className="text-xs text-text-dim tracking-tight">Event Registration</span>
        </nav>
      </header>
      <main className="flex-1">
        {mode === 'checkin' ? <CheckInPage /> : mode === 'qr' ? <QRPage /> : mode === 'track' ? <TrackOrder /> : <FormPage />}
      </main>
    </div>
  )
}
