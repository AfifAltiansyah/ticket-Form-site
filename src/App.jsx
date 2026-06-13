import { useState, useEffect } from 'react'
import FormPage from './pages/FormPage'
import CheckInPage from './pages/CheckInPage'
import QRPage from './pages/QRPage'
import TrackOrder from './pages/TrackOrder'
import LoginPage from './pages/LoginPage'
import { isLoggedIn } from './api/auth'

export default function App() {
  const [mode, setMode] = useState('form')

  useEffect(() => {
    function update() {
      const path = window.location.pathname
      if (path === '/checkin') setMode('checkin')
      else if (path === '/qr') setMode('qr')
      else if (path === '/track') setMode('track')
      else if (path === '/login') setMode('login')
      else setMode('form')
    }
    update()
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  function navigate(path) {
    window.history.pushState(null, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const loggedIn = isLoggedIn()

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <header className="w-full bg-black px-4 lg:px-8">
        <nav className="max-w-[1440px] mx-auto h-11 flex items-center justify-between">
          <a href="/" className="text-xs text-text-dim tracking-tight hover:text-text-muted transition-colors">Event Registration</a>
          <div className="flex items-center gap-4">
            {loggedIn ? (
              <a href="/track" className="text-xs text-accent-400 hover:text-accent-300 transition-colors">My Orders</a>
            ) : (
              <a href="/login" className="text-xs text-accent-400 hover:text-accent-300 transition-colors">Sign In</a>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1">
        {mode === 'checkin' ? <CheckInPage /> :
         mode === 'qr' ? <QRPage /> :
         mode === 'track' ? <TrackOrder /> :
         mode === 'login' ? <LoginPage onLogin={() => navigate('/')} /> :
         <FormPage />}
      </main>
    </div>
  )
}
