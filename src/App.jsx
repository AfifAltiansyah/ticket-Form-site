import FormPage from './pages/FormPage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full bg-apple-black px-4 lg:px-8">
        <nav className="max-w-[1440px] mx-auto h-11 flex items-center justify-between">
          <span className="text-xs text-white tracking-tight opacity-90">Event Registration</span>
        </nav>
      </header>
      <main className="flex-1">
        <FormPage />
      </main>
    </div>
  )
}
