import { getUser } from '../api/auth'

export default function NavBar({ currentMode, navigate, loggedIn, onLoginClick, onLogout }) {
  const user = getUser()

  const navLinks = [
    { label: 'Register', href: '/', mode: 'form' },
    { label: 'Track Order', href: '/track', mode: 'track' },
  ]

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

          {/* Auth section */}
          {loggedIn ? (
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-surface-border">
              <div className="w-7 h-7 bg-accent-500/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-accent-400">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-[13px] text-text-dim hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="ml-2 px-4 py-1.5 bg-accent-600 text-white rounded-lg text-[13px] font-medium hover:bg-accent-500 active:scale-[0.98] transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
