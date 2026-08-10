import useSWR from 'swr'
import { fetchCurrentSeason, fetchMyRegistrationStatus } from './api'

type RegistrationStatusResult = {
  season: { id: string; label: string } | null
  registered: boolean
  fplTeamName: string | null
  myLeagueEntryId: string | null
}

async function loadRegistrationStatus(): Promise<RegistrationStatusResult> {
  let currentSeason: { id: string; label: string }
  try {
    currentSeason = await fetchCurrentSeason()
  } catch {
    return { season: null, registered: false, fplTeamName: null, myLeagueEntryId: null }
  }
  try {
    const status = await fetchMyRegistrationStatus(currentSeason.id)
    return {
      season: currentSeason,
      registered: status.status === 'active',
      fplTeamName: status.fpl_team_name,
      myLeagueEntryId: status.league_entry_id,
    }
  } catch {
    return { season: currentSeason, registered: false, fplTeamName: null, myLeagueEntryId: null }
  }
}

/**
 * A valid login says nothing about whether this user has actually
 * registered (paid) for the current season — every page that requires
 * registration shares this single cached fetch (one SWR key, keyed on
 * `token`) instead of every page independently re-fetching and each
 * showing its own loading spinner on every navigation.
 * `registered` is null while still checking, then true/false once known.
 */
export function useRegistrationStatus(token: string | null) {
  const { data } = useSWR(token ? ['registration-status', token] : null, loadRegistrationStatus)

  return {
    season: data?.season ?? null,
    registered: data ? data.registered : null,
    fplTeamName: data?.fplTeamName ?? null,
    myLeagueEntryId: data?.myLeagueEntryId ?? null,
  }
}
