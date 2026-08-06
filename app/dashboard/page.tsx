'use client'

import { Fragment, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Medal } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { UserLayout } from '@/components/UserLayout'
import { RegisterPrompt } from '@/components/RegisterPrompt'
import { Select } from '@/components/ui/Select'
import { useRegistrationStatus } from '@/lib/useRegistrationStatus'
import {
  fetchLastFinishedStandings,
  fetchNewEntries,
  fetchStandingRowDetail,
  fetchStandings,
  type NewEntryRow,
  type StandingRow,
  type StandingRowDetail,
} from '@/lib/api'

const MEDAL_STYLES: Record<number, string> = {
  1: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  2: 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30',
  3: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30',
}

export default function DashboardPage() {
  const { user, token } = useAuth()
  const { season, registered, fplTeamName } = useRegistrationStatus(token)
  const [tab, setTab] = useState<'standings' | 'new_entries'>('standings')

  // Live (possibly in-progress) view — this is what loads by default.
  const [liveStandings, setLiveStandings] = useState<StandingRow[]>([])
  const [liveEventId, setLiveEventId] = useState<number | null>(null)
  // The last *finished* gameweek's winner — kept separate from live
  // standings (which can reflect a still-in-progress gameweek) so it stays
  // pinned to the previous concluded week until the current one finishes.
  const [lastFinishedMotw, setLastFinishedMotw] = useState<StandingRow | null>(null)

  // Historical "as of gameweek N" view, selected via the gameweek filter.
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [historicalStandings, setHistoricalStandings] = useState<StandingRow[]>([])

  const [standingsLoading, setStandingsLoading] = useState(false)
  const [standingsError, setStandingsError] = useState<string | null>(null)
  const [newEntries, setNewEntries] = useState<NewEntryRow[]>([])
  const [newEntriesLoading, setNewEntriesLoading] = useState(false)
  const [newEntriesError, setNewEntriesError] = useState<string | null>(null)

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [rowDetails, setRowDetails] = useState<Record<string, StandingRowDetail>>({})
  const [rowDetailLoadingId, setRowDetailLoadingId] = useState<string | null>(null)
  const [rowDetailError, setRowDetailError] = useState<string | null>(null)

  useEffect(() => {
    // Only ever fetched once we know this user is actually registered for
    // the season — an unregistered user shouldn't see (or even request)
    // this season's standings/new entries.
    if (!season || registered !== true) return

    setStandingsLoading(true)
    fetchStandings(season.id)
      .then((data) => {
        setLiveStandings(data.results)
        setLiveEventId(data.event_id)
      })
      .catch((err) => setStandingsError(err instanceof Error ? err.message : 'Could not load standings'))
      .finally(() => setStandingsLoading(false))

    fetchLastFinishedStandings(season.id)
      .then((data) => setLastFinishedMotw(data.results.find((s) => s.gw_rank === 1) || null))
      .catch(() => setLastFinishedMotw(null))

    setNewEntriesLoading(true)
    fetchNewEntries(season.id)
      .then(setNewEntries)
      .catch((err) => setNewEntriesError(err instanceof Error ? err.message : 'Could not load new entries'))
      .finally(() => setNewEntriesLoading(false))
  }, [season, registered])

  useEffect(() => {
    if (!season || registered !== true || selectedEventId == null) return
    setStandingsLoading(true)
    setStandingsError(null)
    fetchStandings(season.id, selectedEventId)
      .then((data) => setHistoricalStandings(data.results))
      .catch((err) => setStandingsError(err instanceof Error ? err.message : 'Could not load standings'))
      .finally(() => setStandingsLoading(false))
  }, [season, registered, selectedEventId])

  if (!user) return null

  const viewingLive = selectedEventId == null
  const standings = viewingLive ? liveStandings : historicalStandings
  const displayedEventId = viewingLive ? liveEventId : selectedEventId
  const managerOfTheWeek = viewingLive ? lastFinishedMotw : standings.find((s) => s.gw_rank === 1) || null
  const myRow = standings.find((s) => s.user_id === user.id)

  const toggleRowExpansion = (row: StandingRow) => {
    if (expandedRowId === row.league_entry_id) {
      setExpandedRowId(null)
      return
    }
    setExpandedRowId(row.league_entry_id)
    setRowDetailError(null)
    const cacheKey = `${row.league_entry_id}:${displayedEventId}`
    if (rowDetails[cacheKey] || !season || !displayedEventId) return
    setRowDetailLoadingId(row.league_entry_id)
    fetchStandingRowDetail(season.id, row.league_entry_id, displayedEventId)
      .then((detail) => setRowDetails((prev) => ({ ...prev, [cacheKey]: detail })))
      .catch((err) => setRowDetailError(err instanceof Error ? err.message : 'Could not load gameweek detail'))
      .finally(() => setRowDetailLoadingId(null))
  }

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
              <StatCard
                label={viewingLive ? 'This Gameweek' : `GW${displayedEventId} Points`}
                value={`${myRow.gw_points} pts`}
                sub={displayedEventId ? `GW${displayedEventId}` : ''}
              />
              <StatCard label="Total Points" value={String(myRow.total_points)} />
              <StatCard label="League Rank" value={myRow.overall_rank ? `#${myRow.overall_rank}` : '—'} />
              <StatCard
                label={viewingLive ? 'Manager of the Week' : `GW${displayedEventId} Winner`}
                value={managerOfTheWeek?.full_name || managerOfTheWeek?.fpl_team_name || '—'}
                sub={managerOfTheWeek?.fpl_team_name && managerOfTheWeek?.full_name ? managerOfTheWeek.fpl_team_name : undefined}
              />
            </section>
          )}

          <section>
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-hairline mb-4 dark:border-ink-700">
              <div className="flex gap-6">
                <button
                  onClick={() => setTab('standings')}
                  className={`pb-3 text-sm font-medium ${
                    tab === 'standings'
                      ? 'text-brand-purple border-b-2 border-brand-purple dark:text-brand-lilac dark:border-brand-lilac'
                      : 'text-ink-500 dark:text-ink-400'
                  }`}
                >
                  Standings {displayedEventId ? `— GW${displayedEventId}` : ''}
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

              {tab === 'standings' && liveEventId != null && (
                <Select
                  value={selectedEventId ?? ''}
                  onChange={(e) => {
                    setExpandedRowId(null)
                    setSelectedEventId(e.target.value === '' ? null : Number(e.target.value))
                  }}
                  wrapperClassName="mb-2"
                  className="bg-white border border-hairline rounded-lg pl-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:border-brand-purple dark:bg-ink-800 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
                >
                  <option value="">Live — GW{liveEventId}</option>
                  {Array.from({ length: liveEventId }, (_, i) => liveEventId - i).map((gw) => (
                    <option key={gw} value={gw}>
                      Gameweek {gw}
                    </option>
                  ))}
                </Select>
              )}
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
                          <th className="px-4 py-3 font-medium w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((row) => {
                          const medalClass = row.gw_rank ? MEDAL_STYLES[row.gw_rank] : undefined
                          const isExpanded = expandedRowId === row.league_entry_id
                          const detail = rowDetails[`${row.league_entry_id}:${displayedEventId}`]
                          return (
                            <Fragment key={row.league_entry_id}>
                              <tr
                                onClick={() => toggleRowExpansion(row)}
                                className={`border-t border-hairline cursor-pointer dark:border-ink-700 ${
                                  row.user_id === user.id ? 'bg-brand-purple-light dark:bg-brand-purple/20' : 'dark:bg-ink-800'
                                }`}
                              >
                                <td className="px-4 py-3 tnum dark:text-ink-100">{row.overall_rank ?? '—'}</td>
                                <td className="px-4 py-3 dark:text-ink-100">{row.fpl_team_name}</td>
                                <td className="px-4 py-3 tnum dark:text-ink-100">
                                  {medalClass ? (
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${medalClass}`}>
                                      <Medal className="h-3 w-3" /> {row.gw_points}
                                    </span>
                                  ) : (
                                    row.gw_points
                                  )}
                                </td>
                                <td className="px-4 py-3 font-semibold tnum dark:text-ink-100">{row.total_points}</td>
                                <td className="px-4 py-3 text-ink-400 dark:text-ink-500">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="border-t border-hairline bg-ink-100/60 dark:border-ink-700 dark:bg-ink-900/60">
                                  <td colSpan={5} className="px-4 py-4">
                                    {rowDetailLoadingId === row.league_entry_id && (
                                      <Loader2 className="h-4 w-4 text-brand-purple animate-spin dark:text-brand-lilac" />
                                    )}
                                    {!rowDetailLoadingId && rowDetailError && !detail && (
                                      <p className="text-status-danger text-xs">{rowDetailError}</p>
                                    )}
                                    {detail && (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                        <DetailStat label="Bonus points" value={String(detail.bonus_points)} />
                                        <DetailStat label="Bench points" value={String(detail.bench_points)} />
                                        <DetailStat
                                          label="Transfers"
                                          value={`${detail.transfers_made}${detail.transfer_cost ? ` (−${detail.transfer_cost} pts)` : ''}`}
                                        />
                                        <DetailStat label="Team value" value={`£${(detail.team_value / 10).toFixed(1)}m`} />
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })}
                        {standings.length === 0 && (
                          <tr className="dark:bg-ink-800">
                            <td colSpan={5} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">
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

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-ink-500 dark:text-ink-400">{label}</p>
      <p className="font-semibold tnum text-ink-900 dark:text-ink-100 mt-0.5">{value}</p>
    </div>
  )
}
