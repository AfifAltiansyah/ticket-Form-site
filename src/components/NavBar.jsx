const navLinks = [
  { label: 'Register', href: '/', mode: 'form' },
  { label: 'Track Order', href: '/track', mode: 'track' },
  { label: 'Check In', href: '/checkin', mode: 'checkin', cta: true },
]

export default function NavBar({ currentMode, navigate }) {
  return (
    <header className="w-full border-b border-surface-border/50 bg-surface-base/80 backdrop-blur-xl sticky top-0 z-50">
      <nav className="max-w-[1440px] mx-auto px-5 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/') }}
          className="flex items-center group"
        >
          <img src="/acodera-logo.svg" alt="ACODERA" className="h-8 w-8" />
        </a>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Nav links */}
          {navLinks.map(({ label, href, mode, cta }) => {
            const isActive = currentMode === mode
            const className = cta
              ? `px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                  isActive ? 'bg-accent-500 text-white' : 'bg-accent-600 text-white hover:bg-accent-500'
                }`
              : `px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-surface-card text-text-primary'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                }`
            return (
              <a
                key={href}
                href={href}
                onClick={(e) => { e.preventDefault(); navigate(href) }}
                className={className}
              >
                {label}
              </a>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
