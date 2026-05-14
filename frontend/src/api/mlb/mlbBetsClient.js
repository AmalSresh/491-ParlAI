import { fetchMlbOdds } from '../../utils/espnOdds.js';

const ESPN_MLB_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';

function fmtDate(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('');
}

export async function fetchMlbGamesFromEspn() {
  // Fetch −2 to +10 days so users see recent finals plus a healthy upcoming slate.
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 2);
  const end = new Date(today);
  end.setDate(today.getDate() + 10);
  const dateRange = `${fmtDate(start)}-${fmtDate(end)}`;

  const res = await fetch(
    `${ESPN_MLB_SCOREBOARD}?dates=${dateRange}&limit=300`,
  );
  if (!res.ok) throw new Error(`ESPN MLB scoreboard failed (${res.status})`);
  const data = await res.json();

  const events = data.events ?? [];
  const oddsList = await Promise.all(
    events.map((event) => fetchMlbOdds(event.id).catch(() => null)),
  );

  return events
    .map((event, i) => {
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

      const homeScore =
        home.score !== undefined && home.score !== ''
          ? parseInt(home.score, 10)
          : null;
      const awayScore =
        away.score !== undefined && away.score !== ''
          ? parseInt(away.score, 10)
          : null;

      const realOdds = oddsList[i];
      const homeOdds = realOdds?.moneyHome ?? null;
      const awayOdds = realOdds?.moneyAway ?? null;
      const totalLine = realOdds?.overUnder ?? null;
      const overOdds = realOdds?.overOdds ?? null;
      const underOdds = realOdds?.underOdds ?? null;

      return {
        id: espnId,
        apiId: espnId,
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
          home: homeOdds
            ? {
                id: `${espnId}-h2h-home`,
                label: home.team.displayName,
                odds: homeOdds,
              }
            : null,
          away: awayOdds
            ? {
                id: `${espnId}-h2h-away`,
                label: away.team.displayName,
                odds: awayOdds,
              }
            : null,
        },
        totalsPicks: {
          over:
            totalLine != null && overOdds != null
              ? { id: `${espnId}-totals-over`, odds: overOdds, lineValue: totalLine }
              : null,
          under:
            totalLine != null && underOdds != null
              ? { id: `${espnId}-totals-under`, odds: underOdds, lineValue: totalLine }
              : null,
        },
        totalLine,
      };
    })
    .filter(Boolean);
}
