import { useState, useEffect } from 'react'
import FormPage from './pages/FormPage'
import CheckInPage from './pages/CheckInPage'
import QRPage from './pages/QRPage'
import TrackOrder from './pages/TrackOrder'
import NavBar from './components/NavBar'
import AuthModal from './components/AuthModal'
import { isLoggedIn, logout } from './api/auth'

export default function App() {
  const [mode, setMode] = useState('form')
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    function update() {
      setLoggedIn(isLoggedIn())
      const path = window.location.pathname
      if (path === '/checkin') setMode('checkin')
      else if (path === '/qr') setMode('qr')
      else if (path === '/track') setMode('track')
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

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <NavBar
        currentMode={mode}
        navigate={navigate}
        loggedIn={loggedIn}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={() => { logout(); setLoggedIn(false); navigate('/') }}
      />
      <main className="flex-1">
        {mode === 'checkin' && <CheckInPage />}
        {mode === 'qr' && <QRPage />}
        {mode === 'track' && <TrackOrder />}
        {mode === 'form' && <FormPage />}
      </main>
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => { setLoggedIn(true); setShowAuthModal(false); navigate('/track') }}
        />
      )}
    </div>
  )
}
