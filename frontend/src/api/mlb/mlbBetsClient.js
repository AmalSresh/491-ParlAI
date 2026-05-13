const ESPN_MLB_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';

function generateOdds(espnId, homeAway) {
  const seed = [...espnId].reduce((a, c) => a + c.charCodeAt(0), 0) / 10000;
  const base =
    homeAway === 'home' ? 1.4 + seed * 0.8 : 1.4 + (1 - seed) * 0.8;
  return parseFloat(Math.max(1.25, Math.min(2.8, base)).toFixed(4));
}

export async function fetchMlbGamesFromEspn() {
  const res = await fetch(ESPN_MLB_SCOREBOARD);
  if (!res.ok) throw new Error(`ESPN MLB scoreboard failed (${res.status})`);
  const data = await res.json();

  const events = data.events ?? [];
  return events
    .map((event) => {
      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find((c) => c.homeAway === 'home');
      const away = comp?.competitors?.find((c) => c.homeAway === 'away');
      if (!home || !away) return null;

      const espnId = String(event.id);
      const statusState = event.status?.type?.state ?? 'pre';
      const isCompleted = event.status?.type?.completed ?? false;
      const dbStatus = isCompleted
        ? 'completed'
        : statusState === 'in'
          ? 'in_progress'
          : 'scheduled';

      const homeOdds = generateOdds(espnId, 'home');
      const awayOdds = generateOdds(espnId, 'away');

      const homeScore =
        home.score !== undefined && home.score !== ''
          ? parseInt(home.score, 10)
          : null;
      const awayScore =
        away.score !== undefined && away.score !== ''
          ? parseInt(away.score, 10)
          : null;

      return {
        id: espnId,
        leagueId: 703,
        sport: 'mlb',
        homeTeam: home.team.displayName,
        awayTeam: away.team.displayName,
        homeLogo: home.team.logo || null,
        awayLogo: away.team.logo || null,
        homeScore,
        awayScore,
        startTime: event.date,
        status: dbStatus,
        gameName: `${away.team.displayName} @ ${home.team.displayName}`,
        h2hPicks: {
          home: {
            id: `${espnId}-h2h-home`,
            label: home.team.displayName,
            odds: homeOdds,
          },
          away: {
            id: `${espnId}-h2h-away`,
            label: away.team.displayName,
            odds: awayOdds,
          },
        },
        totalsPicks: {
          over: { id: `${espnId}-totals-over`, odds: 1.91, lineValue: 8.5 },
          under: { id: `${espnId}-totals-under`, odds: 1.91, lineValue: 8.5 },
        },
        totalLine: 8.5,
      };
    })
    .filter(Boolean);
}
