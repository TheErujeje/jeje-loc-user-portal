'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, Info } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { UserLayout } from '@/components/UserLayout'
import { RegisterPrompt } from '@/components/RegisterPrompt'
import { useRegistrationStatus } from '@/lib/useRegistrationStatus'
import {
  acceptChallenge,
  cancelChallenge,
  createChallenge,
  fetchMyChallenges,
  fetchOpenChallenges,
  fetchWeeklyLimit,
  type Challenge,
  type ChallengeType,
  type WeeklyLimit,
} from '@/lib/api'
import { Select } from '@/components/ui/Select'

const CHALLENGE_MIN_STAKE_NAIRA = 1000
const CHALLENGE_MAX_STAKE_NAIRA = 50000

const TYPE_LABELS: Record<ChallengeType, string> = {
  most_points: 'Most Points',
  most_goals: 'Most Goals',
  most_bonus: 'Most Bonus Points',
  most_cards: 'Most Cards',
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString()}`
}

export default function ChallengesPage() {
  const { user, token } = useAuth()
  const { season, registered, myLeagueEntryId } = useRegistrationStatus(token)

  const [tab, setTab] = useState<'open' | 'mine'>('open')
  const [openChallenges, setOpenChallenges] = useState<Challenge[]>([])
  const [myChallenges, setMyChallenges] = useState<Challenge[]>([])
  const [weeklyLimit, setWeeklyLimit] = useState<WeeklyLimit | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [challengeType, setChallengeType] = useState<ChallengeType>('most_points')
  const [stakeNaira, setStakeNaira] = useState(1000)
  const [postError, setPostError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  const load = (sid: string) => {
    setListLoading(true)
    Promise.all([fetchOpenChallenges(sid), fetchMyChallenges(sid)])
      .then(([open, mine]) => {
        setOpenChallenges(open)
        setMyChallenges(mine)
      })
      .catch((err) => setListError(err instanceof Error ? err.message : 'Could not load challenges'))
      .finally(() => setListLoading(false))

    fetchWeeklyLimit(sid)
      .then(setWeeklyLimit)
      .catch(() => setWeeklyLimit(null))
  }

  useEffect(() => {
    if (!season || registered !== true) return
    load(season.id)
  }, [season, registered])

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!season) return
    setPostError(null)
    setPosting(true)
    try {
      const stakeKobo = Math.round(stakeNaira * 100)
      const res = await createChallenge(season.id, challengeType, stakeKobo)
      window.location.href = res.payment_authorization_url
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Could not create challenge')
      setPosting(false)
      if (season) fetchWeeklyLimit(season.id).then(setWeeklyLimit).catch(() => {})
    }
  }

  const handleAccept = async (challengeId: string) => {
    setBusyId(challengeId)
    try {
      const res = await acceptChallenge(challengeId)
      window.location.href = res.payment_authorization_url
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not accept challenge')
      setBusyId(null)
    }
  }

  const handleCancel = async (challengeId: string) => {
    setBusyId(challengeId)
    try {
      await cancelChallenge(challengeId)
      if (season) load(season.id)
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not cancel challenge')
    } finally {
      setBusyId(null)
    }
  }

  // Keep UserLayout mounted (rather than `return null`) so its own
  // loading/redirect-to-login effect actually gets a chance to fire —
  // e.g. right after clicking logout.
  if (!user) return <UserLayout>{null}</UserLayout>

  return (
    <UserLayout>
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Challenges</h1>

      {registered === null && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}

      {season && registered === false && <RegisterPrompt seasonLabel={season.label} />}

      {registered === true && (
        <>
      <section className="bg-white border border-hairline rounded-card shadow-sm p-6 dark:bg-ink-800 dark:border-ink-700">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">Post a challenge</h2>
          {weeklyLimit && (
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                weeklyLimit.remaining === 0
                  ? 'bg-status-danger/10 text-status-danger'
                  : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400'
              }`}
            >
              {weeklyLimit.remaining} of {weeklyLimit.limit} challenge slots left this gameweek
            </span>
          )}
        </div>

        <Link
          href="/challenges/rules"
          className="inline-flex items-center gap-1.5 text-xs text-brand-purple dark:text-brand-lilac hover:underline mb-4"
        >
          <Info className="h-3.5 w-3.5" />
          Rules, stakes &amp; how payouts work
        </Link>

        {weeklyLimit && weeklyLimit.remaining === 0 ? (
          <div className="flex items-start gap-3 bg-status-danger/10 text-status-danger text-sm rounded-lg p-4">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>
              This gameweek&apos;s challenge limit ({weeklyLimit.limit}) has been reached — no more challenges can be posted
              until next gameweek.
            </p>
          </div>
        ) : (
        <form onSubmit={handlePost} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label-eyebrow block mb-1">Type</label>
            <Select
              value={challengeType}
              onChange={(e) => setChallengeType(e.target.value as ChallengeType)}
              className="bg-white border border-hairline rounded-lg pl-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-brand-purple dark:bg-ink-800 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="label-eyebrow block mb-1">
              Stake ({formatNaira(CHALLENGE_MIN_STAKE_NAIRA * 100)}–{formatNaira(CHALLENGE_MAX_STAKE_NAIRA * 100)})
            </label>
            <input
              type="number"
              min={CHALLENGE_MIN_STAKE_NAIRA}
              max={CHALLENGE_MAX_STAKE_NAIRA}
              step={100}
              value={stakeNaira}
              onChange={(e) => setStakeNaira(Number(e.target.value))}
              className="bg-white border border-hairline rounded-lg px-3 py-2 text-sm text-ink-900 w-32 dark:bg-ink-800 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
            />
          </div>
          <button
            type="submit"
            disabled={posting}
            className="bg-brand-purple hover:opacity-90 text-white font-medium text-sm px-4 py-2 sm:px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {posting ? 'Redirecting…' : 'Post & Pay'}
          </button>
        </form>
        )}
        {postError && <p className="text-status-danger text-sm mt-3">{postError}</p>}
      </section>

      <section>
        <div className="flex gap-6 border-b border-hairline mb-6 dark:border-ink-700">
          <button
            onClick={() => setTab('open')}
            className={`pb-3 text-sm font-medium ${
              tab === 'open'
                ? 'text-brand-purple border-b-2 border-brand-purple dark:text-brand-lilac dark:border-brand-lilac'
                : 'text-ink-500 dark:text-ink-400'
            }`}
          >
            Open Challenges
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`pb-3 text-sm font-medium ${
              tab === 'mine'
                ? 'text-brand-purple border-b-2 border-brand-purple dark:text-brand-lilac dark:border-brand-lilac'
                : 'text-ink-500 dark:text-ink-400'
            }`}
          >
            My Challenges
          </button>
        </div>

        {listLoading && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}
        {listError && <p className="text-status-danger text-sm">{listError}</p>}

        {!listLoading && !listError && tab === 'open' && (
          <div className="space-y-3">
            {openChallenges.length === 0 && <p className="text-ink-500 text-sm dark:text-ink-400">No open challenges right now.</p>}
            {openChallenges.map((c) => {
              const isOwn = c.creator_league_entry_id === myLeagueEntryId
              return (
                <div
                  key={c.id}
                  className="bg-white border border-hairline rounded-card shadow-sm p-4 flex items-center justify-between dark:bg-ink-800 dark:border-ink-700"
                >
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-ink-100">{TYPE_LABELS[c.challenge_type]}</p>
                    <p className="text-ink-500 text-sm dark:text-ink-400">
                      {c.creator_team_name} · GW{c.event_id} · {formatNaira(c.stake_kobo)} stake
                    </p>
                  </div>
                  {isOwn ? (
                    <button
                      onClick={() => handleCancel(c.id)}
                      disabled={busyId === c.id}
                      className="text-xs sm:text-sm text-ink-500 hover:text-status-danger border border-hairline rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 disabled:opacity-50 dark:border-ink-700 dark:text-ink-400"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAccept(c.id)}
                      disabled={busyId === c.id}
                      className="bg-brand-purple hover:opacity-90 text-white font-medium text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {busyId === c.id ? 'Redirecting…' : 'Accept'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!listLoading && !listError && tab === 'mine' && (
          <div className="space-y-3">
            {myChallenges.length === 0 && (
              <p className="text-ink-500 text-sm dark:text-ink-400">You haven&apos;t posted or accepted any challenges yet.</p>
            )}
            {myChallenges.map((c) => {
              const opponentLabel =
                c.creator_league_entry_id === myLeagueEntryId ? c.opponent_team_name : c.creator_team_name
              const won = c.winner_league_entry_id === myLeagueEntryId
              return (
                <div key={c.id} className="bg-white border border-hairline rounded-card shadow-sm p-4 dark:bg-ink-800 dark:border-ink-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-ink-100">{TYPE_LABELS[c.challenge_type]}</p>
                      <p className="text-ink-500 text-sm dark:text-ink-400">
                        vs {opponentLabel ?? 'awaiting opponent'} · GW{c.event_id} · {formatNaira(c.stake_kobo)} stake
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        c.status === 'settled' && won
                          ? 'bg-status-success/10 text-status-success'
                          : c.status === 'settled'
                            ? 'bg-status-danger/10 text-status-danger'
                            : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400'
                      }`}
                    >
                      {c.status === 'settled' ? (won ? 'Won' : 'Lost') : c.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
        </>
      )}
    </UserLayout>
  )
}
