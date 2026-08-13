import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-gray-950/90 border-b border-white/[0.08] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
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
          <div className="flex items-baseline gap-2">
            <span className="text-white font-bold text-xl tracking-tight leading-none">U-Safe</span>
            <span className="text-white/40 text-[10px] tracking-wide">安否確認ツール</span>
          </div>
        </Link>
      </div>
    </header>
  )
}
