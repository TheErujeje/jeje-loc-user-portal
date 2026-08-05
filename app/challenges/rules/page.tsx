'use client'

import Link from 'next/link'
import { ArrowLeft, Target, Coins, Gavel, CalendarClock, RotateCcw } from 'lucide-react'
import { UserLayout } from '@/components/UserLayout'

const CHALLENGE_TYPES = [
  { label: 'Most Points', description: 'Whoever scores more total FPL points in the gameweek wins.' },
  { label: 'Most Goals', description: 'Whoever’s players score more combined goals in the gameweek wins.' },
  { label: 'Most Bonus Points', description: 'Whoever’s players earn more combined bonus points in the gameweek wins.' },
  { label: 'Most Cards', description: 'Whoever’s players pick up more combined yellow/red cards in the gameweek wins.' },
]

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white border border-hairline rounded-card shadow-sm p-6 dark:bg-ink-800 dark:border-ink-700">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-brand-purple dark:text-brand-lilac" />
        <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">{title}</h2>
      </div>
      <div className="text-sm text-ink-600 dark:text-ink-300 space-y-2">{children}</div>
    </section>
  )
}

export default function ChallengeRulesPage() {
  return (
    <UserLayout>
      <div>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1.5 text-sm text-brand-purple dark:text-brand-lilac hover:underline mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Challenges
        </Link>
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight dark:text-ink-100">
          Challenge rules &amp; terms
        </h1>
        <p className="text-ink-500 text-sm dark:text-ink-400">
          Everything to know before you post or accept a head-to-head challenge.
        </p>
      </div>

      <Section icon={Target} title="Challenge types">
        <p>A challenge is a head-to-head bet against one other manager for a single gameweek, in one of four formats:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {CHALLENGE_TYPES.map((t) => (
            <li key={t.label}>
              <span className="font-semibold text-ink-900 dark:text-ink-100">{t.label}</span> — {t.description}
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={Coins} title="Stakes &amp; payout on win">
        <p>
          Choose a stake between <span className="font-semibold text-ink-900 dark:text-ink-100">₦1,000 and ₦50,000</span>.
          The manager who accepts your challenge matches it exactly, so both sides risk the same amount.
        </p>
        <p>
          A platform fee of <span className="font-semibold text-ink-900 dark:text-ink-100">5%</span> applies on every
          completed challenge, taken from the combined pot before the winner is paid.
        </p>
      </Section>

      <Section icon={Gavel} title="Arbitration">
        <p>
          Once the gameweek is finished and FPL&apos;s scores are locked in (including bonus points), the challenge is
          settled automatically against the frozen data. Every result is calculated the same way for everyone — there&apos;s
          no manual judgment call on who scored what.
        </p>
        <p>
          An admin only steps in for a genuine tie or a dispute. In that case, the admin either confirms a winner or
          refunds both stakes in full — no partial payouts.
        </p>
      </Section>

      <Section icon={CalendarClock} title="Weekly limit">
        <p>
          Only a limited number of challenges can be posted across the whole league per gameweek — you&apos;ll see the
          current count and remaining slots on the Challenges page. This cap is set by the league admin and can change
          from week to week, so post early if you want to guarantee a slot.
        </p>
      </Section>

      <Section icon={RotateCcw} title="Cancellation &amp; refunds">
        <ul className="list-disc list-inside space-y-1">
          <li>
            You can cancel your own challenge any time before another manager accepts it — a{' '}
            <span className="font-semibold text-ink-900 dark:text-ink-100">2.5% cancellation fee</span> applies, and the
            rest of your stake is refunded.
          </li>
          <li>
            If nobody accepts before the gameweek&apos;s deadline, the challenge automatically expires and your stake is
            refunded in full — no fee, no action needed on your part.
          </li>
          <li>Once someone accepts, the challenge is locked in for both sides and can no longer be cancelled.</li>
        </ul>
      </Section>
    </UserLayout>
  )
}
