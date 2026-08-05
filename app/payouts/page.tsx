'use client'

import { useEffect, useState } from 'react'
import { Loader2, Trophy, Users, Calendar } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { UserLayout } from '@/components/UserLayout'
import { fetchMyPayouts, fetchCurrentSeason, fetchPrizePool, type MyPayout, type PrizePoolBreakdown } from '@/lib/api'

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
  const [pool, setPool] = useState<PrizePoolBreakdown | null>(null)
  const [loading, setLoading] = useState(false)
  const [poolLoading, setPoolLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchMyPayouts()
      .then(setPayouts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load payouts'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!token) return
    setPoolLoading(true)
    fetchCurrentSeason()
      .then((season) => fetchPrizePool(season.id))
      .then(setPool)
      .catch(() => setPool(null))
      .finally(() => setPoolLoading(false))
  }, [token])

  if (!user) return null

  return (
    <UserLayout>
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Payouts</h1>
      <p className="text-ink-500 text-sm dark:text-ink-400">Prize winnings and challenge payouts, across every season you&apos;ve played.</p>

      {poolLoading && !pool && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}

      {pool && (
        <div className="bg-white border border-hairline rounded-card shadow-sm p-6 space-y-6 dark:bg-ink-800 dark:border-ink-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="label-eyebrow text-brand-purple dark:text-brand-lilac mb-1">Current prize pool</p>
              <p className="text-3xl font-semibold text-ink-900 tracking-tight tnum dark:text-ink-100">
                {formatNaira(pool.pool_kobo)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
              <Users className="h-4 w-4" />
              {pool.paid_entries} paid entries
              {pool.minimum_players > 0 && <span> / {pool.minimum_players} min</span>}
            </div>
          </div>

          {pool.minimum_players > 0 && (
            <div>
              <div className="h-2 w-full bg-ink-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${pool.minimum_players_met ? 'bg-status-success' : 'bg-brand-purple dark:bg-brand-lilac'}`}
                  style={{ width: `${Math.min(100, (pool.paid_entries / pool.minimum_players) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                {pool.minimum_players_met
                  ? 'Minimum players reached — prizes are locked in.'
                  : `${pool.minimum_players - pool.paid_entries} more player${pool.minimum_players - pool.paid_entries === 1 ? '' : 's'} needed before prizes are guaranteed.`}
              </p>
            </div>
          )}

          {pool.weekly_prize_enabled && (
            <div className="flex items-center gap-3 bg-ink-100 dark:bg-white/5 rounded-lg px-4 py-3">
              <Calendar className="h-5 w-5 text-brand-purple dark:text-brand-lilac shrink-0" />
              <p className="text-sm text-ink-700 dark:text-ink-200">
                <span className="font-semibold tnum">{formatNaira(pool.weekly_prize_amount_kobo)}</span> paid to the gameweek
                winner, every gameweek.
              </p>
            </div>
          )}

          <div>
            <p className="label-eyebrow mb-3">Season-end prizes</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {pool.season_prizes.map((slot) => (
                <div key={slot.label} className="bg-ink-100 dark:bg-white/5 rounded-lg p-3 text-center">
                  <Trophy className="h-4 w-4 mx-auto text-brand-purple dark:text-brand-lilac mb-1" />
                  <p className="text-xs text-ink-500 dark:text-ink-400">{slot.rank_range}</p>
                  <p className="font-semibold text-sm tnum text-ink-900 dark:text-ink-100">
                    {formatNaira(slot.per_rank_amount_kobo)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {pool.other_prizes.length > 0 && (
            <div>
              <p className="label-eyebrow mb-3">Other prizes</p>
              <ul className="space-y-2 text-sm">
                {pool.other_prizes.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-ink-700 dark:text-ink-200">
                    <span>{p.label}</span>
                    <span className="font-semibold tnum">{p.amount_kobo != null ? formatNaira(p.amount_kobo) : '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
