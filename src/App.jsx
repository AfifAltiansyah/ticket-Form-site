import { useState } from 'react'
import FormPage from './pages/FormPage'
import CheckInPage from './pages/CheckInPage'

export default function App() {
  const [mode, setMode] = useState('register')

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <header className="w-full bg-black px-4 lg:px-8">
        <nav className="max-w-[1440px] mx-auto h-11 flex items-center justify-between">
          <span className="text-xs text-text-dim tracking-tight">
            {mode === 'register' ? 'Event Registration' : 'Check-in'}
          </span>
          <div className="flex rounded-btn bg-surface-card p-0.5 gap-0.5">
            <button
              onClick={() => setMode('register')}
              className={`px-3 py-1 text-xs rounded-[10px] font-medium transition-all ${
                mode === 'register'
                  ? 'bg-accent-600 text-white'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setMode('checkin')}
              className={`px-3 py-1 text-xs rounded-[10px] font-medium transition-all ${
                mode === 'checkin'
                  ? 'bg-accent-600 text-white'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Check-in
            </button>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        {mode === 'register' ? <FormPage /> : <CheckInPage />}
      </main>
    </div>
  )
}
