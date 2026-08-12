'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/auth/actions'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-emerald-700 font-bold text-xl tracking-tight">
          U-Safe
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavItem href="/history">履歴</NavItem>
          <NavItem href="/test">テスト発報</NavItem>
          <AlertNavItem href="/manual">本番発報</AlertNavItem>
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
          <MobileNavItem href="/history" onClick={() => setOpen(false)}>
            履歴
          </MobileNavItem>
          <MobileNavItem href="/test" onClick={() => setOpen(false)}>
            テスト発報
          </MobileNavItem>
          <MobileAlertNavItem href="/manual" onClick={() => setOpen(false)}>
            本番発報
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
