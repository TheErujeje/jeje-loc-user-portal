'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { UserLayout } from '@/components/UserLayout'
import { fetchMyPayouts, type MyPayout } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  pending_approval: 'text-status-warning',
  calculated: 'text-ink-500 dark:text-ink-400',
  approved: 'text-brand-purple dark:text-brand-lilac',
  processing: 'text-brand-purple dark:text-brand-lilac',
  paid: 'text-status-success',
  failed: 'text-status-danger',
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString()}`
}

export default function PayoutsPage() {
  const { user, token } = useAuth()
  const [payouts, setPayouts] = useState<MyPayout[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchMyPayouts()
      .then(setPayouts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load payouts'))
      .finally(() => setLoading(false))
  }, [token])

  if (!user) return null

  return (
    <UserLayout>
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Payouts</h1>
      <p className="text-ink-500 text-sm dark:text-ink-400">Prize winnings and challenge payouts, across every season you&apos;ve played.</p>

      {loading && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}
      {error && <p className="text-status-danger text-sm">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-card border border-hairline shadow-sm dark:border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-100 text-ink-500 text-left dark:bg-white/5 dark:text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Gameweek</th>
                <th className="px-4 py-3 font-medium">Prize</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-t border-hairline dark:border-ink-700 dark:bg-ink-800">
                  <td className="px-4 py-3 dark:text-ink-100">{p.event_id ? `GW${p.event_id}` : 'Season'}</td>
                  <td className="px-4 py-3 dark:text-ink-100">{p.label}</td>
                  <td className="px-4 py-3 font-semibold tnum dark:text-ink-100">{formatNaira(p.amount_kobo)}</td>
                  <td className={`px-4 py-3 font-semibold ${STATUS_COLORS[p.status] || ''}`}>
                    {p.status.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {payouts.length === 0 && (
                <tr className="dark:bg-ink-800">
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">
                    No payouts yet — win a prize or a challenge to see it here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </UserLayout>
  )
}
