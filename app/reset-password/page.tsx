'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, Trophy } from 'lucide-react'
import { resetPassword } from '@/lib/api'

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('This reset link is missing its token — request a new one.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await resetPassword(token, newPassword)
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <CheckCircle2 className="h-10 w-10 text-status-success" />
        <h1 className="text-[22px] font-semibold text-ink-900 tracking-tight dark:text-ink-100">Password updated</h1>
        <p className="text-[13.5px] text-ink-600 dark:text-ink-400">Taking you to sign in…</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900 mb-2 dark:text-ink-100">
        Choose a new password
      </h1>
      <p className="text-[13.5px] text-ink-600 mb-6 dark:text-ink-400">At least 8 characters.</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-ink-700 dark:text-ink-300">New password</span>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-hairline bg-ink-100 px-3.5 text-[13.5px] text-ink-900 transition-colors placeholder:text-ink-400 focus:bg-white focus:outline-none focus:border-brand-purple dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100 dark:focus:bg-ink-800 dark:focus:border-brand-lilac"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-ink-700 dark:text-ink-300">Confirm password</span>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-hairline bg-ink-100 px-3.5 text-[13.5px] text-ink-900 transition-colors placeholder:text-ink-400 focus:bg-white focus:outline-none focus:border-brand-purple dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100 dark:focus:bg-ink-800 dark:focus:border-brand-lilac"
          />
        </label>

        {error && <p className="text-status-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-brand-purple text-white font-medium text-[13.5px] hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8 bg-white dark:bg-ink-900">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-6 w-6 text-brand-purple dark:text-brand-lilac" />
          <span className="font-semibold text-ink-900 tracking-tight dark:text-ink-100">
            Jeje&apos;s <span className="text-brand-purple dark:text-brand-lilac">League of Champions</span>
          </span>
        </div>
        <Suspense fallback={<Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}>
          <ResetPasswordForm />
        </Suspense>
        <Link
          href="/login"
          className="mt-6 block text-center text-[13px] font-medium text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
