'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Swords, Wallet, Settings } from 'lucide-react'

const links = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Challenges', path: '/challenges', icon: Swords },
  { name: 'Payouts', path: '/payouts', icon: Wallet },
  { name: 'Settings', path: '/settings', icon: Settings },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-hairline bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-ink-700 dark:bg-ink-900/95">
      {links.map((link) => {
        const Icon = link.icon
        const active = pathname === link.path
        return (
          <Link
            key={link.path}
            href={link.path}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              active ? 'text-brand-purple dark:text-brand-lilac' : 'text-ink-500 dark:text-ink-400'
            }`}
          >
            <Icon className="h-5 w-5" />
            {link.name}
          </Link>
        )
      })}
    </nav>
  )
}
