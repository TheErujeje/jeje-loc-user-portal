const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface User {
  fpl_entry_id: number
  email: string
  full_name: string
  fpl_team_name: string
  phone: string | null
  status: string
  created_at: string
}

export interface StandingRow {
  user_id: number
  fpl_team_name: string
  full_name: string
  gw_points: number
  gw_rank: number | null
  total_points: number
  overall_rank: number | null
}

export interface Payout {
  id: string
  event_id: number | null
  amount_kobo: number
  status: string
  calculated_at: string
  paid_at: string | null
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handle<{ access_token: string; refresh_token: string }>(res)
}

export async function fetchMe(token: string) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handle<User>(res)
}

export async function fetchCurrentSeason() {
  const res = await fetch(`${API_BASE_URL}/fpl/seasons/current`)
  return handle<{ id: string; label: string; status: string }>(res)
}

export async function fetchStandings(token: string, seasonId: string) {
  const res = await fetch(`${API_BASE_URL}/fpl/seasons/${seasonId}/standings`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handle<{ event_id: number | null; results: StandingRow[] }>(res)
}
