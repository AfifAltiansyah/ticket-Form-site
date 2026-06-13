import { useState, useEffect } from 'react'
import FormPage from './pages/FormPage'
import CheckInPage from './pages/CheckInPage'
import QRPage from './pages/QRPage'
import TrackOrder from './pages/TrackOrder'
import LandingPage from './pages/LandingPage'
import NavBar from './components/NavBar'
import { isLoggedIn } from './api/auth'

export default function App() {
  const [mode, setMode] = useState('form')
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())

  useEffect(() => {
    function update() {
      setLoggedIn(isLoggedIn())
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

  // If not logged in and trying to access protected routes, show landing
  const isProtected = mode === 'track'
  const showLanding = !loggedIn && (mode === 'form' || isProtected || mode === 'login')

  if (showLanding) {
    return <LandingPage onSuccess={() => { setLoggedIn(true); navigate('/') }} />
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <NavBar currentMode={mode} navigate={navigate} />
      <main className="flex-1">
        {mode === 'checkin' && <CheckInPage />}
        {mode === 'qr' && <QRPage />}
        {mode === 'track' && <TrackOrder />}
        {mode === 'form' && <FormPage />}
      </main>
    </div>
  )
}
