import { useState, useEffect } from 'react'
import FormPage from './pages/FormPage'
import CheckInPage from './pages/CheckInPage'

export default function App() {
  const [mode, setMode] = useState('register')

  useEffect(() => {
    function update() {
      setMode(window.location.hash === '#checkin' ? 'checkin' : 'register')
    }
    update()
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <header className="w-full bg-black px-4 lg:px-8">
        <nav className="max-w-[1440px] mx-auto h-11 flex items-center justify-between">
          <span className="text-xs text-text-dim tracking-tight">Event Registration</span>
        </nav>
      </header>
      <main className="flex-1">
        {mode === 'register' ? <FormPage /> : <CheckInPage />}
      </main>
    </div>
  )
}
