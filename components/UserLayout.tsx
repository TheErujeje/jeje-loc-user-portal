'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { ThemeToggle } from './ThemeToggle'
import { Logo } from './Logo'

export function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-ink-900">
        <Loader2 className="h-8 w-8 text-brand-purple animate-spin dark:text-brand-lilac" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-ink-900">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hairline bg-white/95 px-4 py-3 backdrop-blur lg:hidden dark:border-ink-700 dark:bg-ink-900/95">
          <div className="flex items-center gap-2">
            <Logo className="h-10 w-10 text-brand-purple dark:text-brand-lilac" />
            <span className="font-semibold text-ink-900 tracking-tight dark:text-ink-100">
              Jeje&apos;s <span className="text-brand-purple dark:text-brand-lilac">League of Champions</span>
            </span>
          </div>
          <button onClick={logout} aria-label="Log out" className="text-ink-500 hover:text-status-danger dark:text-ink-400">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="hidden lg:flex items-center justify-end px-8 pt-6">
          <ThemeToggle />
        </div>

        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 pb-24 sm:py-10 lg:pb-10">
          <div className="max-w-5xl mx-auto space-y-10">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
