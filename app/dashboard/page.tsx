'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { fetchCurrentSeason, fetchStandings, type StandingRow } from '@/lib/api'

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth()
  const router = useRouter()
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [eventId, setEventId] = useState<number | null>(null)
  const [standingsLoading, setStandingsLoading] = useState(true)
  const [standingsError, setStandingsError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!token) return
    fetchCurrentSeason()
      .then((season) => fetchStandings(season.id))
      .then((data) => {
        setStandings(data.results)
        setEventId(data.event_id)
      })
      .catch((err) => setStandingsError(err instanceof Error ? err.message : 'Could not load standings'))
      .finally(() => setStandingsLoading(false))
  }, [token])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-pitch-green animate-spin" />
      </div>
    )
  }

  const myRow = standings.find((s) => s.user_id === user.fpl_entry_id)

  return (
    <div className="min-h-screen">
      <header className="border-b border-stadium-700 px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-floodlight-gold" />
          <span className="font-heading font-bold tracking-wider">
            JEJE&apos;S <span className="text-floodlight-gold">LEAGUE</span>
          </span>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-10">
        <section>
          <h1 className="text-2xl font-heading font-bold mb-1">Welcome back, {user.full_name}</h1>
          <p className="text-gray-400">{user.fpl_team_name}</p>
        </section>

        {myRow && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="This Gameweek" value={`${myRow.gw_points} pts`} sub={eventId ? `GW${eventId}` : ''} />
            <StatCard label="Total Points" value={String(myRow.total_points)} />
            <StatCard label="Overall Rank" value={myRow.overall_rank ? `#${myRow.overall_rank}` : '—'} />
          </section>
        )}

        <section>
          <h2 className="text-lg font-heading font-bold mb-4 tracking-wide">
            LEAGUE STANDINGS {eventId ? `— GW${eventId}` : ''}
          </h2>

          {standingsLoading && <Loader2 className="h-6 w-6 text-pitch-green animate-spin" />}
          {standingsError && <p className="text-red-400 text-sm">{standingsError}</p>}

          {!standingsLoading && !standingsError && (
            <div className="overflow-x-auto rounded-sm border border-stadium-700">
              <table className="w-full text-sm">
                <thead className="bg-stadium-800 text-gray-400 text-left">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">GW Pts</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr
                      key={row.user_id}
                      className={`border-t border-stadium-800 ${
                        row.user_id === user.fpl_entry_id ? 'bg-pitch-green/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">{row.overall_rank ?? '—'}</td>
                      <td className="px-4 py-3">{row.fpl_team_name}</td>
                      <td className="px-4 py-3">{row.gw_points}</td>
                      <td className="px-4 py-3 font-bold">{row.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-stadium-800 border border-stadium-700 rounded-sm p-6">
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-heading font-bold text-white">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}
