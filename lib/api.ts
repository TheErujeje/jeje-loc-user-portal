export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  status: string
  created_at: string
}

export interface StandingRow {
  user_id: string | null
  fpl_team_name: string | null
  full_name: string | null
  gw_points: number
  gw_rank: number | null
  total_points: number
  overall_rank: number | null
}

export interface NewEntryRow {
  fpl_entry_id: number
  entry_name: string
  player_first_name: string | null
  player_last_name: string | null
  joined_time: string
}

export interface MyPayout {
  id: string
  source: 'prize' | 'challenge'
  label: string
  event_id: number | null
  amount_kobo: number
  status: string
  created_at: string
  paid_at: string | null
}

export interface BankAccount {
  account_number: string
  bank_code: string
  bank_name: string | null
  account_name: string | null
  is_primary: boolean
}

export type ChallengeType = 'most_points' | 'most_goals' | 'most_bonus' | 'most_cards'

export interface Challenge {
  id: string
  season_id: string
  event_id: number
  challenge_type: ChallengeType
  stake_kobo: number
  creator_league_entry_id: string
  creator_team_name: string | null
  opponent_league_entry_id: string | null
  opponent_team_name: string | null
  status: string
  winner_league_entry_id: string | null
  result_snapshot: Record<string, unknown> | null
  payout_percent_snapshot: number
  created_at: string
  accepted_at: string | null
  resolved_at: string | null
}

export interface ChallengeCheckout {
  challenge_id: string
  payment_authorization_url: string
  payment_reference: string
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

function clearSessionAndRedirect() {
  localStorage.removeItem('loc_access_token')
  localStorage.removeItem('loc_refresh_token')
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

let refreshInFlight: Promise<string | null> | null = null

// Access tokens expire in 30 min. Rather than send the user back to /login on
// every 401, try exchanging the (30-day) refresh token for a new pair first —
// only fall back to a hard redirect if the refresh token is also gone/expired.
// refreshInFlight collapses concurrent 401s into a single refresh call.
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem('loc_refresh_token')
    if (!refreshToken) return null

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) return null
      const data = await res.json()
      localStorage.setItem('loc_access_token', data.access_token)
      localStorage.setItem('loc_refresh_token', data.refresh_token)
      return data.access_token as string
    } catch {
      return null
    }
  })()

  const result = await refreshInFlight
  refreshInFlight = null
  return result
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('loc_access_token')
  const withAuth = (t: string | null): RequestInit => ({
    ...init,
    headers: { ...init.headers, ...(t ? { Authorization: `Bearer ${t}` } : {}) },
  })

  const res = await fetch(`${API_BASE_URL}${path}`, withAuth(token))
  if (res.status !== 401) return res

  const newToken = await refreshAccessToken()
  if (!newToken) {
    clearSessionAndRedirect()
    return res
  }
  return fetch(`${API_BASE_URL}${path}`, withAuth(newToken))
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handle<{ access_token: string; refresh_token: string }>(res)
}

export async function logout() {
  const refreshToken = localStorage.getItem('loc_refresh_token')
  if (!refreshToken) return
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => {})
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return handle<{ message: string }>(res)
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  })
  return handle<{ status: string }>(res)
}

export async function fetchMe() {
  const res = await authedFetch('/auth/me')
  return handle<User>(res)
}

export async function fetchCurrentSeason() {
  const res = await authedFetch('/fpl/seasons/current')
  return handle<{ id: string; label: string; status: string }>(res)
}

export async function fetchStandings(seasonId: string) {
  const res = await authedFetch(`/fpl/seasons/${seasonId}/standings`)
  return handle<{ event_id: number | null; results: StandingRow[] }>(res)
}

// Pinned to the last *finished* gameweek — unlike fetchStandings, this never
// resolves to a live/in-progress gameweek, so "Manager of the Week" doesn't
// shift around while a gameweek is still being played.
export async function fetchLastFinishedStandings(seasonId: string) {
  const res = await authedFetch(`/fpl/seasons/${seasonId}/standings?finished_only=true`)
  return handle<{ event_id: number | null; results: StandingRow[] }>(res)
}

export async function fetchNewEntries(seasonId: string) {
  const res = await authedFetch(`/fpl/seasons/${seasonId}/new-entries`)
  return handle<NewEntryRow[]>(res)
}

export async function fetchMyRegistrationStatus(seasonId: string) {
  const res = await authedFetch(`/registration/my-status?season_id=${seasonId}`)
  return handle<{
    registered: boolean
    status: string | null
    league_entry_id: string | null
    fpl_entry_id: number | null
    fpl_team_name: string | null
  }>(res)
}

export async function fetchMyPayouts() {
  const res = await authedFetch('/payouts/mine')
  return handle<MyPayout[]>(res)
}

export interface PrizePoolSlot {
  label: string
  rank_range: string
  percent: number
  amount_kobo: number
  per_rank_amount_kobo: number
}

export interface PrizePoolBreakdown {
  season_id: string
  pool_kobo: number
  paid_entries: number
  entry_fee_kobo: number
  minimum_players: number
  minimum_players_met: boolean
  weekly_prize_enabled: boolean
  weekly_prize_amount_kobo: number
  season_prizes: PrizePoolSlot[]
  other_prizes: { id: string; label: string; scope: string; amount_kobo: number | null }[]
  allocated_kobo: number
}

export async function fetchPrizePool(seasonId: string) {
  const res = await authedFetch(`/payouts/prize-pool?season_id=${seasonId}`)
  return handle<PrizePoolBreakdown>(res)
}

export async function fetchMyBankAccount() {
  const res = await authedFetch('/me/bank-account')
  return handle<BankAccount | null>(res)
}

export async function updateMyBankAccount(accountNumber: string, bankCode: string) {
  const res = await authedFetch('/me/bank-account', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
  })
  return handle<BankAccount>(res)
}

export async function updateMyProfile(fullName: string, phone: string) {
  const res = await authedFetch('/me/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName, phone: phone || null }),
  })
  return handle<User>(res)
}

export async function uploadMyAvatar(file: File) {
  const body = new FormData()
  body.append('file', file)
  const res = await authedFetch('/me/avatar', { method: 'POST', body })
  return handle<User>(res)
}

export async function deleteMyAvatar() {
  const res = await authedFetch('/me/avatar', { method: 'DELETE' })
  return handle<User>(res)
}

export async function verifyPayment(reference: string) {
  const res = await authedFetch(`/payments/verify/${reference}`)
  return handle<{ status: string }>(res)
}

export async function fetchOpenChallenges(seasonId: string) {
  const res = await authedFetch(`/challenges/open?season_id=${seasonId}`)
  return handle<Challenge[]>(res)
}

export interface WeeklyLimit {
  event_id: number | null
  used: number
  limit: number
  remaining: number
}

export async function fetchWeeklyLimit(seasonId: string) {
  const res = await authedFetch(`/challenges/weekly-limit?season_id=${seasonId}`)
  return handle<WeeklyLimit>(res)
}

export async function fetchMyChallenges(seasonId: string) {
  const res = await authedFetch(`/challenges/mine?season_id=${seasonId}`)
  return handle<Challenge[]>(res)
}

export async function createChallenge(seasonId: string, challengeType: ChallengeType, stakeKobo: number) {
  const res = await authedFetch('/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ season_id: seasonId, challenge_type: challengeType, stake_kobo: stakeKobo }),
  })
  return handle<ChallengeCheckout>(res)
}

export async function acceptChallenge(challengeId: string) {
  const res = await authedFetch(`/challenges/${challengeId}/accept`, { method: 'POST' })
  return handle<ChallengeCheckout>(res)
}

export async function cancelChallenge(challengeId: string) {
  const res = await authedFetch(`/challenges/${challengeId}/cancel`, { method: 'POST' })
  return handle<{ status: string }>(res)
}
