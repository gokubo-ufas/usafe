import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" className="w-7 h-7 shrink-0" fill="none" aria-hidden>
            <path
              d="M16 3 L28 8 L28 18 C28 24 22 29 16 31 C10 29 4 24 4 18 L4 8 Z"
              fill="url(#shield-grad)"
              stroke="#059669"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="800"
              fontFamily="system-ui, sans-serif" fill="white" letterSpacing="-0.5">U</text>
            <defs>
              <linearGradient id="shield-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-emerald-700 font-bold text-xl tracking-tight">U-Safe</span>
        </Link>
      </div>
    </header>
  )
}
