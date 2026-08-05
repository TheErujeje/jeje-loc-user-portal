'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { UserLayout } from '@/components/UserLayout'
import { RegisterPrompt } from '@/components/RegisterPrompt'
import { useRegistrationStatus } from '@/lib/useRegistrationStatus'
import { fetchLastFinishedStandings, fetchNewEntries, fetchStandings, type NewEntryRow, type StandingRow } from '@/lib/api'

export default function DashboardPage() {
  const { user, token } = useAuth()
  const { season, registered, fplTeamName } = useRegistrationStatus(token)
  const [tab, setTab] = useState<'standings' | 'new_entries'>('standings')
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [eventId, setEventId] = useState<number | null>(null)
  const [standingsLoading, setStandingsLoading] = useState(false)
  const [standingsError, setStandingsError] = useState<string | null>(null)
  const [newEntries, setNewEntries] = useState<NewEntryRow[]>([])
  const [newEntriesLoading, setNewEntriesLoading] = useState(false)
  const [newEntriesError, setNewEntriesError] = useState<string | null>(null)
  // The last *finished* gameweek's winner — kept separate from `standings`
  // (which can reflect a live, still-in-progress gameweek) so this stays
  // pinned to the previous concluded week until the current one finishes too.
  const [managerOfTheWeek, setManagerOfTheWeek] = useState<StandingRow | null>(null)

  useEffect(() => {
    // Only ever fetched once we know this user is actually registered for
    // the season — an unregistered user shouldn't see (or even request)
    // this season's standings/new entries.
    if (!season || registered !== true) return

    setStandingsLoading(true)
    fetchStandings(season.id)
      .then((data) => {
        setStandings(data.results)
        setEventId(data.event_id)
      })
      .catch((err) => setStandingsError(err instanceof Error ? err.message : 'Could not load standings'))
      .finally(() => setStandingsLoading(false))

    fetchLastFinishedStandings(season.id)
      .then((data) => setManagerOfTheWeek(data.results.find((s) => s.gw_rank === 1) || null))
      .catch(() => setManagerOfTheWeek(null))

    setNewEntriesLoading(true)
    fetchNewEntries(season.id)
      .then(setNewEntries)
      .catch((err) => setNewEntriesError(err instanceof Error ? err.message : 'Could not load new entries'))
      .finally(() => setNewEntriesLoading(false))
  }, [season, registered])

  if (!user) return null

  const myRow = standings.find((s) => s.user_id === user.id)

  return (
    <UserLayout>
      <section>
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight mb-1 dark:text-ink-100">Welcome back, {user.full_name}</h1>
        {fplTeamName && <p className="text-ink-500 dark:text-ink-400">{fplTeamName}</p>}
      </section>

      {registered === null && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}

      {season && registered === false && <RegisterPrompt seasonLabel={season.label} />}

      {registered === true && (
        <>
          {myRow && (
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="This Gameweek" value={`${myRow.gw_points} pts`} sub={eventId ? `GW${eventId}` : ''} />
              <StatCard label="Total Points" value={String(myRow.total_points)} />
              <StatCard label="League Rank" value={myRow.overall_rank ? `#${myRow.overall_rank}` : '—'} />
              <StatCard
                label="Manager of the Week"
                value={managerOfTheWeek?.full_name || managerOfTheWeek?.fpl_team_name || '—'}
                sub={managerOfTheWeek?.fpl_team_name && managerOfTheWeek?.full_name ? managerOfTheWeek.fpl_team_name : undefined}
              />
            </section>
          )}

          <section>
            <div className="flex gap-6 border-b border-hairline mb-4 dark:border-ink-700">
              <button
                onClick={() => setTab('standings')}
                className={`pb-3 text-sm font-medium ${
                  tab === 'standings'
                    ? 'text-brand-purple border-b-2 border-brand-purple dark:text-brand-lilac dark:border-brand-lilac'
                    : 'text-ink-500 dark:text-ink-400'
                }`}
              >
                Standings {eventId ? `— GW${eventId}` : ''}
              </button>
              <button
                onClick={() => setTab('new_entries')}
                className={`pb-3 text-sm font-medium ${
                  tab === 'new_entries'
                    ? 'text-brand-purple border-b-2 border-brand-purple dark:text-brand-lilac dark:border-brand-lilac'
                    : 'text-ink-500 dark:text-ink-400'
                }`}
              >
                New entries {newEntries.length ? `(${newEntries.length})` : ''}
              </button>
            </div>

            {tab === 'standings' && (
              <>
                {standingsLoading && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}
                {standingsError && <p className="text-status-danger text-sm">{standingsError}</p>}

                {!standingsLoading && !standingsError && (
                  <div className="overflow-x-auto rounded-card border border-hairline shadow-sm dark:border-ink-700">
                    <table className="w-full text-sm">
                      <thead className="bg-ink-100 text-ink-500 text-left dark:bg-white/5 dark:text-ink-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Rank</th>
                          <th className="px-4 py-3 font-medium">Team</th>
                          <th className="px-4 py-3 font-medium">GW Pts</th>
                          <th className="px-4 py-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((row) => (
                          <tr
                            key={row.user_id}
                            className={`border-t border-hairline dark:border-ink-700 ${
                              row.user_id === user.id ? 'bg-brand-purple-light dark:bg-brand-purple/20' : 'dark:bg-ink-800'
                            }`}
                          >
                            <td className="px-4 py-3 tnum dark:text-ink-100">{row.overall_rank ?? '—'}</td>
                            <td className="px-4 py-3 dark:text-ink-100">{row.fpl_team_name}</td>
                            <td className="px-4 py-3 tnum dark:text-ink-100">{row.gw_points}</td>
                            <td className="px-4 py-3 font-semibold tnum dark:text-ink-100">{row.total_points}</td>
                          </tr>
                        ))}
                        {standings.length === 0 && (
                          <tr className="dark:bg-ink-800">
                            <td colSpan={4} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">
                              No standings yet — check back once gameweek 1 finishes.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'new_entries' && (
              <>
                {newEntriesLoading && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}
                {newEntriesError && <p className="text-status-danger text-sm">{newEntriesError}</p>}

                {!newEntriesLoading && !newEntriesError && (
                  <div className="overflow-x-auto rounded-card border border-hairline shadow-sm dark:border-ink-700">
                    <table className="w-full text-sm">
                      <thead className="bg-ink-100 text-ink-500 text-left dark:bg-white/5 dark:text-ink-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Team</th>
                          <th className="px-4 py-3 font-medium">Manager</th>
                          <th className="px-4 py-3 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newEntries.map((row) => (
                          <tr key={row.fpl_entry_id} className="border-t border-hairline dark:border-ink-700 dark:bg-ink-800">
                            <td className="px-4 py-3 dark:text-ink-100">{row.entry_name}</td>
                            <td className="px-4 py-3 dark:text-ink-100">
                              {[row.player_first_name, row.player_last_name].filter(Boolean).join(' ') || '—'}
                            </td>
                            <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{new Date(row.joined_time).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {newEntries.length === 0 && (
                          <tr className="dark:bg-ink-800">
                            <td colSpan={3} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">
                              Nobody has joined the FPL league yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </UserLayout>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="relative rounded-card border border-hairline bg-white shadow-sm px-5 py-5 card-lift dark:border-ink-700 dark:bg-ink-800">
      <p className="label-eyebrow mb-2">{label}</p>
      <p className="text-[22px] font-semibold text-ink-900 tracking-tight tnum dark:text-ink-100">{value}</p>
      {sub && <p className="text-ink-500 text-xs mt-1 dark:text-ink-400">{sub}</p>}
    </div>
  )
}
