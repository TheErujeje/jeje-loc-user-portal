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

export async function fetchMe() {
  const res = await authedFetch('/auth/me')
  return handle<User>(res)
}

export async function fetchCurrentSeason() {
  const res = await fetch(`${API_BASE_URL}/fpl/seasons/current`)
  return handle<{ id: string; label: string; status: string }>(res)
}

export async function fetchStandings(seasonId: string) {
  const res = await authedFetch(`/fpl/seasons/${seasonId}/standings`)
  return handle<{ event_id: number | null; results: StandingRow[] }>(res)
}
