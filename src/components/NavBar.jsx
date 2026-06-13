import { isLoggedIn, getUser, logout } from '../api/auth'

export default function NavBar({ currentMode, navigate }) {
  const loggedIn = isLoggedIn()
  const user = getUser()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const links = loggedIn
    ? [
        { label: 'Register', href: '/', mode: 'form' },
        { label: 'My Orders', href: '/track', mode: 'track' },
      ]
    : [
        { label: 'Sign In', href: '/login', mode: 'login' },
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
          <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-700 rounded-lg flex items-center justify-center shadow-lg shadow-accent-600/20 group-hover:shadow-accent-600/30 transition-shadow">
            <span className="text-sm font-bold text-white">Z</span>
          </div>
          <span className="text-sm font-semibold text-text-primary tracking-tight hidden sm:block">
            Zero To AI
          </span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {links.map(({ label, href, mode }) => {
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

          {loggedIn && (
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-surface-border">
              <div className="w-7 h-7 bg-accent-500/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-accent-400">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[13px] text-text-dim hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
