import { useEffect, useState } from 'react'
import { fetchCurrentSeason, fetchMyRegistrationStatus } from './api'

/**
 * A valid login says nothing about whether this user has actually
 * registered (paid) for the current season — every page that requires
 * registration shares this single fetch instead of duplicating it.
 * `registered` is null while still checking, then true/false once known.
 */
export function useRegistrationStatus(token: string | null) {
  const [season, setSeason] = useState<{ id: string; label: string } | null>(null)
  const [registered, setRegistered] = useState<boolean | null>(null)
  const [fplTeamName, setFplTeamName] = useState<string | null>(null)
  // My own LeagueEntry id for this season — Challenge participant fields are
  // league_entry ids, not account ids, so "is this my challenge" has to
  // compare against this, not against the logged-in user's own id.
  const [myLeagueEntryId, setMyLeagueEntryId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchCurrentSeason()
      .then((currentSeason) => {
        setSeason(currentSeason)
        fetchMyRegistrationStatus(currentSeason.id)
          .then((status) => {
            setRegistered(status.status === 'active')
            setFplTeamName(status.fpl_team_name)
            setMyLeagueEntryId(status.league_entry_id)
          })
          .catch(() => setRegistered(false))
      })
      .catch(() => setRegistered(false))
  }, [token])

  return { season, registered, fplTeamName, myLeagueEntryId }
}
