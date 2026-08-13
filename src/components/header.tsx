'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/auth/actions'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <svg viewBox="0 0 32 32" className="w-7 h-7 shrink-0" fill="none" aria-hidden>
            <path
              d="M16 3 L28 8 L28 18 C28 24 22 29 16 31 C10 29 4 24 4 18 L4 8 Z"
              fill="url(#shield-grad)"
              stroke="#059669"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <text
              x="16" y="21"
              textAnchor="middle"
              fontSize="13"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
              fill="white"
              letterSpacing="-0.5"
            >U</text>
            <defs>
              <linearGradient id="shield-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-emerald-700 font-bold text-xl tracking-tight">
            U-Safe
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <AlertNavItem href="/dispatch">発報管理</AlertNavItem>
          <form action={signOut}>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-gray-500 hover:text-gray-700"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white divide-y divide-gray-50">
          <MobileAlertNavItem href="/dispatch" onClick={() => setOpen(false)}>
            発報管理
          </MobileAlertNavItem>
          <form action={signOut} className="px-4">
            <button
              type="submit"
              className="w-full text-left py-3 text-sm text-gray-500"
            >
              ログアウト
            </button>
          </form>
        </div>
      )}
    </header>
  )
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
    >
      {children}
    </Link>
  )
}

function AlertNavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
    >
      {children}
    </Link>
  )
}

function MobileNavItem({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-3 text-sm text-gray-700">
      {children}
    </Link>
  )
}

function MobileAlertNavItem({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-3 text-sm font-medium text-red-600">
      {children}
    </Link>
  )
}
