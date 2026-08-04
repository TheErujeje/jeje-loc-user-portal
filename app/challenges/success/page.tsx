'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { verifyPayment } from '@/lib/api'

function CheckingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-ink-900">
      <Loader2 className="h-16 w-16 text-brand-purple animate-spin mb-6 dark:text-brand-lilac" />
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Confirming your payment…</h1>
    </div>
  )
}

function ChallengePaymentSuccessContent() {
  const params = useSearchParams()
  const reference = params.get('reference') || params.get('trxref')
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking')

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      return
    }
    verifyPayment(reference)
      .then((res) => setStatus(res.status === 'success' ? 'success' : 'failed'))
      .catch(() => setStatus('failed'))
  }, [reference])

  if (status === 'checking') return <CheckingState />

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-ink-900">
      {status === 'success' && (
        <>
          <CheckCircle2 className="h-16 w-16 text-status-success mb-6" />
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 tracking-tight mb-4 dark:text-ink-100">Stake confirmed</h1>
          <p className="text-ink-500 max-w-md mb-8 dark:text-ink-400">
            Your stake is in. Check the Challenges page for the latest status.
          </p>
          <Link
            href="/challenges"
            className="flex items-center gap-2 bg-brand-purple hover:opacity-90 text-white font-medium px-6 py-3 sm:px-8 sm:py-4 rounded-lg transition-colors"
          >
            Back to Challenges
            <ArrowRight className="h-5 w-5" />
          </Link>
        </>
      )}
      {status === 'failed' && (
        <>
          <XCircle className="h-16 w-16 text-status-danger mb-6" />
          <h1 className="text-2xl font-semibold text-ink-900 tracking-tight mb-4 dark:text-ink-100">Payment not confirmed</h1>
          <p className="text-ink-500 max-w-md dark:text-ink-400">
            We couldn&apos;t confirm this payment yet. If you were charged, contact us and we&apos;ll sort it out.
          </p>
        </>
      )}
    </div>
  )
}

export default function ChallengePaymentSuccessPage() {
  return (
    <Suspense fallback={<CheckingState />}>
      <ChallengePaymentSuccessContent />
    </Suspense>
  )
}
