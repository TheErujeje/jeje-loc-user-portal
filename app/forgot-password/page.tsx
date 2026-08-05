'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MailCheck, Trophy } from 'lucide-react'
import { forgotPassword } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8 bg-white dark:bg-ink-900">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-6 w-6 text-brand-purple dark:text-brand-lilac" />
          <span className="font-semibold text-ink-900 tracking-tight dark:text-ink-100">
            Jeje&apos;s <span className="text-brand-purple dark:text-brand-lilac">League of Champions</span>
          </span>
        </div>

        {sent ? (
          <div className="space-y-4">
            <MailCheck className="h-10 w-10 text-status-success" />
            <h1 className="text-[22px] font-semibold text-ink-900 tracking-tight dark:text-ink-100">Check your email</h1>
            <p className="text-[13.5px] text-ink-600 dark:text-ink-400">
              If an account exists for <span className="font-medium text-ink-900 dark:text-ink-100">{email}</span>, a
              password reset link is on its way. It expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-brand-purple hover:underline dark:text-brand-lilac"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900 mb-2 dark:text-ink-100">
              Forgot your password?
            </h1>
            <p className="text-[13.5px] text-ink-600 mb-6 dark:text-ink-400">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink-700 dark:text-ink-300">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-hairline bg-ink-100 px-3.5 text-[13.5px] text-ink-900 transition-colors placeholder:text-ink-400 focus:bg-white focus:outline-none focus:border-brand-purple dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100 dark:focus:bg-ink-800 dark:focus:border-brand-lilac"
                />
              </label>

              {error && <p className="text-status-danger text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-brand-purple text-white font-medium text-[13.5px] hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
