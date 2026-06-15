const navLinks = [
  { label: 'Register', href: '/', mode: 'form' },
  { label: 'Track Order', href: '/track', mode: 'track' },
]

export default function NavBar({ currentMode, navigate }) {
  return (
    <header className="w-full border-b border-surface-border/50 bg-surface-base/80 backdrop-blur-xl sticky top-0 z-50">
      <nav className="max-w-[1440px] mx-auto px-5 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/') }}
          className="flex items-center gap-2.5 group"
        >
          <img src="/favicon.png" alt="ACODERA" className="w-8 h-8 rounded-lg" />
          <span className="text-sm font-semibold text-text-primary tracking-tight hidden sm:block">
            ACODERA
          </span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Nav links */}
          {navLinks.map(({ label, href, mode }) => {
            const isActive = currentMode === mode
            return (
              <a
                key={href}
                href={href}
                onClick={(e) => { e.preventDefault(); navigate(href) }}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-surface-card text-text-primary'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                }`}
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
