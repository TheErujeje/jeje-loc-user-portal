'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Camera,
  CheckCircle2,
  ListChecks,
  Loader2,
  Monitor,
  Moon,
  Pencil,
  ShieldCheck,
  Sun,
  Trash2,
  Trophy,
  Wallet,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useTheme, type Theme } from '@/lib/theme'
import { UserLayout } from '@/components/UserLayout'
import { RegisterPrompt } from '@/components/RegisterPrompt'
import { useRegistrationStatus } from '@/lib/useRegistrationStatus'
import {
  API_BASE_URL,
  deleteMyAvatar,
  fetchMyBankAccount,
  fetchPrizePool,
  updateMyBankAccount,
  updateMyProfile,
  uploadMyAvatar,
  type BankAccount,
  type PrizePoolBreakdown,
} from '@/lib/api'
import { NIGERIAN_BANKS } from '@/lib/banks'
import { Select } from '@/components/ui/Select'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth()
  const { season, registered } = useRegistrationStatus(token)

  return (
    <UserLayout>
      <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">Settings</h1>

      {registered === null && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}

      {season && registered === false && <RegisterPrompt seasonLabel={season.label} />}

      {user && (
        <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <ProfileCard user={user} onUpdated={refreshUser} />
            {registered === true && <BankAccountCard />}
          </div>
          <div className="space-y-6">
            <AppearanceCard />
            <LeagueRulesCard seasonId={season?.id ?? null} />
          </div>
        </div>
      )}
    </UserLayout>
  )
}

function ProfileCard({
  user,
  onUpdated,
}: {
  user: { full_name: string; email: string; phone: string | null; avatar_url: string | null }
  onUpdated: () => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarVersion, setAvatarVersion] = useState(0)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(user.full_name)
  const [phone, setPhone] = useState(user.phone || '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setAvatarError('Image must be under 3MB.')
      return
    }

    setAvatarBusy(true)
    setAvatarError(null)
    try {
      await uploadMyAvatar(file)
      await onUpdated()
      setAvatarVersion((v) => v + 1)
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Could not upload photo')
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true)
    setAvatarError(null)
    try {
      await deleteMyAvatar()
      await onUpdated()
      setAvatarVersion((v) => v + 1)
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Could not remove photo')
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      await updateMyProfile(fullName, phone)
      await onUpdated()
      setSaved(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white border border-hairline rounded-card shadow-sm p-6 dark:bg-ink-800 dark:border-ink-700">
      <h2 className="text-lg font-semibold text-ink-900 mb-1 dark:text-ink-100">Profile</h2>
      <p className="text-ink-500 text-sm mb-6 dark:text-ink-400">How you show up across the league.</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative h-20 w-20 shrink-0">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${API_BASE_URL}${user.avatar_url}?v=${avatarVersion}`}
              alt=""
              className="h-20 w-20 rounded-full object-cover border border-hairline dark:border-ink-700"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-brand-purple-light text-brand-purple flex items-center justify-center text-xl font-semibold dark:bg-brand-purple/20 dark:text-brand-lilac">
              {initials(user.full_name)}
            </div>
          )}
          {avatarBusy && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarBusy}
            className="flex items-center gap-1.5 bg-white border border-hairline hover:border-brand-purple text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-ink-700 transition-colors disabled:opacity-50 dark:bg-ink-800 dark:border-ink-700 dark:text-ink-300 dark:hover:border-brand-lilac"
          >
            <Camera className="h-3.5 w-3.5" /> Change photo
          </button>
          {user.avatar_url && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={avatarBusy}
              className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-ink-500 hover:text-status-danger transition-colors disabled:opacity-50 dark:text-ink-400"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
      {avatarError && <p className="text-status-danger text-sm mb-4">{avatarError}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-eyebrow block mb-1">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full bg-ink-100 border border-hairline rounded-lg px-3 py-2 text-sm text-ink-500 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-400"
          />
        </div>
        <div>
          <label className="label-eyebrow block mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-brand-purple dark:bg-ink-800 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
          />
        </div>
        <div>
          <label className="label-eyebrow block mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 800 000 0000"
            className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-purple dark:bg-ink-800 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-purple hover:opacity-90 text-white font-medium text-sm px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
        {saveError && <p className="text-status-danger text-sm">{saveError}</p>}
        {saved && (
          <p className="flex items-center gap-2 text-status-success text-sm">
            <CheckCircle2 className="h-4 w-4" /> Profile updated.
          </p>
        )}
      </form>
    </section>
  )
}

const APPEARANCE_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function AppearanceCard() {
  const { theme, setTheme } = useTheme()

  return (
    <section className="bg-white border border-hairline rounded-card shadow-sm p-6 dark:bg-ink-800 dark:border-ink-700">
      <h2 className="text-lg font-semibold text-ink-900 mb-1 dark:text-ink-100">Appearance</h2>
      <p className="text-ink-500 text-sm mb-4 dark:text-ink-400">Choose how Jeje&apos;s <span className="font-semibold">League of Champions</span> looks on this device.</p>

      <div className="grid grid-cols-3 gap-2">
        {APPEARANCE_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const active = theme === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs sm:text-sm font-medium transition-colors ${
                active
                  ? 'border-brand-purple bg-brand-purple-light text-brand-purple dark:border-brand-lilac dark:bg-brand-purple/20 dark:text-brand-lilac'
                  : 'border-hairline text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400 dark:hover:border-ink-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {opt.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString()}`
}

function LeagueRulesCard({ seasonId }: { seasonId: string | null }) {
  const [pool, setPool] = useState<PrizePoolBreakdown | null>(null)

  useEffect(() => {
    if (!seasonId) return
    fetchPrizePool(seasonId)
      .then(setPool)
      .catch(() => setPool(null))
  }, [seasonId])

  return (
    <section className="bg-white border border-hairline rounded-card shadow-sm p-6 dark:bg-ink-800 dark:border-ink-700">
      <div className="flex items-center gap-2 mb-1">
        <ListChecks className="h-4 w-4 text-brand-purple dark:text-brand-lilac" />
        <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">League rules</h2>
      </div>
      <p className="text-ink-500 text-sm mb-6 dark:text-ink-400">How the league runs, end to end.</p>

      <dl className="space-y-5 text-sm">
        <div>
          <dt className="label-eyebrow mb-1">Season format</dt>
          <dd className="text-ink-700 dark:text-ink-300">
            A private Fantasy Premier League classic mini-league, ranked by total points across the season
            {pool ? ` — ${formatNaira(pool.entry_fee_kobo)} entry fee per manager.` : '.'} Optional head-to-head
            challenges run alongside the classic table every gameweek.
          </dd>
        </div>
        <div>
          <dt className="label-eyebrow mb-1">Standings source</dt>
          <dd className="text-ink-700 dark:text-ink-300">
            Pulled directly from the official FPL classic-league API — synced automatically after every gameweek, and
            refreshed live while a gameweek is in progress. Nothing is entered or adjusted manually.
          </dd>
        </div>
        <div>
          <dt className="label-eyebrow mb-1 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Prize structure
          </dt>
          <dd className="text-ink-700 dark:text-ink-300">
            {pool ? (
              <>
                {pool.weekly_prize_enabled && (
                  <>
                    {formatNaira(pool.weekly_prize_amount_kobo)} to the gameweek winner, every gameweek, plus{' '}
                  </>
                )}
                a season-end split of the prize pool across the top 15 finishers.{' '}
              </>
            ) : (
              'A share of the prize pool goes to the gameweek winner and the top season finishers. '
            )}
            <Link href="/payouts" className="text-brand-purple dark:text-brand-lilac hover:underline">
              See the current prize pool
            </Link>
            .
          </dd>
        </div>
        <div>
          <dt className="label-eyebrow mb-1">Registration &amp; eligibility</dt>
          <dd className="text-ink-700 dark:text-ink-300">
            Registration stays open all season, right up to the final day — join whenever you like. To keep the
            season-end prizes fair to managers who&apos;ve been in it from the start, though, you need to have
            registered before Gameweek 10&apos;s deadline to be eligible for a season-end prize. Weekly gameweek
            prizes and head-to-head challenges have no such cutoff — anyone can win those the moment they&apos;ve
            joined.
          </dd>
        </div>
        <div>
          <dt className="label-eyebrow mb-1">Tie-breaks</dt>
          <dd className="text-ink-700 dark:text-ink-300">
            If two or more managers are tied — on points for a single gameweek, or on total points for the season —
            the winner is decided by a fair random draw, fixed once the tie is set and never re-rolled.
          </dd>
        </div>
        <div>
          <dt className="label-eyebrow mb-1">Payout timing</dt>
          <dd className="text-ink-700 dark:text-ink-300">
            Once a gameweek is finished and FPL&apos;s scores are fully locked in, payouts are calculated automatically.
            An admin reviews and approves each one, which fires the bank transfer immediately — no separate payment
            run to wait for.
          </dd>
        </div>
        <div>
          <dt className="label-eyebrow mb-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Support
          </dt>
          <dd className="text-ink-700 dark:text-ink-300">
            Questions about a payout, a challenge, or your registration? Reach out to your league admin directly.
          </dd>
        </div>
      </dl>

      <p className="text-xs text-ink-400 dark:text-ink-500 mt-6 pt-4 border-t border-hairline dark:border-ink-700">
        By registering and participating in Jeje&apos;s League of Champions, you agree to the rules above and our
        terms and conditions.
      </p>
    </section>
  )
}

function BankAccountCard() {
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState(NIGERIAN_BANKS[0].code)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchMyBankAccount()
      .then((account) => {
        setBankAccount(account)
        if (account) {
          setAccountNumber(account.account_number)
          setBankCode(account.bank_code)
        } else {
          // Nothing on file yet — go straight to the form instead of an
          // empty display view with nothing to show.
          setIsEditing(true)
        }
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load bank details'))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = () => {
    setSaveError(null)
    setSaved(false)
    if (bankAccount) {
      setAccountNumber(bankAccount.account_number)
      setBankCode(bankAccount.bank_code)
    }
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setSaveError(null)
    if (bankAccount) {
      setAccountNumber(bankAccount.account_number)
      setBankCode(bankAccount.bank_code)
      setIsEditing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const updated = await updateMyBankAccount(accountNumber, bankCode)
      setBankAccount(updated)
      setSaved(true)
      setIsEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not update bank details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white border border-hairline rounded-card shadow-sm p-6 dark:bg-ink-800 dark:border-ink-700">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-brand-purple dark:text-brand-lilac" />
          <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">Bank account</h2>
        </div>
        {!loading && !loadError && bankAccount && !isEditing && (
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-ink-600 hover:text-brand-purple transition-colors dark:text-ink-400 dark:hover:text-brand-lilac"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
      <p className="text-ink-500 text-sm mb-6 dark:text-ink-400">
        This is the account payouts and challenge winnings are sent to.
      </p>

      {loading && <Loader2 className="h-6 w-6 text-brand-purple animate-spin dark:text-brand-lilac" />}
      {loadError && <p className="text-status-danger text-sm">{loadError}</p>}

      {!loading && !loadError && bankAccount && !isEditing && (
        <>
          <div className="flex items-center gap-3 bg-ink-100 border border-hairline rounded-lg p-4 dark:bg-ink-900 dark:border-ink-700">
            <div className="h-9 w-9 shrink-0 rounded-full bg-brand-purple-light text-brand-purple flex items-center justify-center text-sm font-semibold dark:bg-brand-purple/20 dark:text-brand-lilac">
              {(bankAccount.bank_name || NIGERIAN_BANKS.find((b) => b.code === bankAccount.bank_code)?.name || '?')[0]}
            </div>
            <div>
              {bankAccount.account_name && (
                <p className="font-semibold text-ink-900 dark:text-ink-100">{bankAccount.account_name}</p>
              )}
              <p className="text-ink-500 text-sm dark:text-ink-400">
                {bankAccount.bank_name || NIGERIAN_BANKS.find((b) => b.code === bankAccount.bank_code)?.name} ·{' '}
                {bankAccount.account_number}
              </p>
            </div>
          </div>
          {saved && (
            <p className="flex items-center gap-2 text-status-success text-sm mt-3">
              <CheckCircle2 className="h-4 w-4" /> Bank details updated.
            </p>
          )}
        </>
      )}

      {!loading && !loadError && isEditing && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-eyebrow block mb-1">Bank</label>
            <Select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              wrapperClassName="w-full"
              className="w-full bg-white border border-hairline rounded-lg pl-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-brand-purple dark:bg-ink-800 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
            >
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-brand-purple dark:bg-ink-800 dark:border-ink-700 dark:text-ink-100 dark:focus:border-brand-lilac"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-purple hover:opacity-90 text-white font-medium text-sm px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Bank Details'}
            </button>
            {bankAccount && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 transition-colors disabled:opacity-50 dark:text-ink-400 dark:hover:text-ink-100"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>
          {saveError && <p className="text-status-danger text-sm">{saveError}</p>}
        </form>
      )}
    </section>
  )
}
