'use client'

import { AlertCircle, ArrowRight } from 'lucide-react'

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3050'

export function RegisterPrompt({ seasonLabel }: { seasonLabel: string }) {
  return (
    <section className="bg-brand-purple-light border border-brand-purple/20 rounded-card p-10 flex flex-col items-center text-center gap-4 dark:bg-brand-purple/10 dark:border-brand-purple/30">
      <AlertCircle className="h-8 w-8 text-brand-purple dark:text-brand-lilac" />
      <div>
        <p className="font-medium text-lg text-ink-900 dark:text-ink-100">You haven&apos;t registered for {seasonLabel} yet</p>
        <p className="text-ink-500 text-sm mt-1 max-w-md dark:text-ink-400">
          Register and pay the entry fee to unlock this page.
        </p>
      </div>
      <a
        href={`${LANDING_URL}/register`}
        className="flex items-center gap-2 bg-brand-purple hover:opacity-90 text-white font-medium text-sm px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-colors"
      >
        Register now
        <ArrowRight className="h-4 w-4" />
      </a>
    </section>
  )
}
