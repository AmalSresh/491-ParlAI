import { useState, useEffect } from 'react';
import { parseSoccerSpreads } from '../adapters/soccerApiAdapter';
import { fetchSoccerOdds } from '../utils/espnOdds.js';
import { classifyGame } from '../utils/gameStatus.js';

const EPL_LEAGUE_NAME = 'English Premier League';

const ESPN_SOCCER_LEAGUES = [
  { key: 'eng.1', label: 'Premier League' },
  { key: 'esp.1', label: 'La Liga' },
  { key: 'ita.1', label: 'Serie A' },
  { key: 'ger.1', label: 'Bundesliga' },
  { key: 'fra.1', label: 'Ligue 1' },
  { key: 'usa.1', label: 'MLS' },
  { key: 'uefa.champions', label: 'Champions League' },
  { key: 'uefa.europa', label: 'Europa League' },
];

const matchTeams = (name1, name2) => {
  if (!name1 || !name2) return false;
  const normalize = (str) =>
    str
      .toLowerCase()
      .replace(/ and | & /g, '')
      .replace(/fc/g, '')
      .replace(/[^a-z]/g, '');
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  return n1.includes(n2) || n2.includes(n1);
};

function fmtDate(d) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('');
}

async function fetchEspnSoccerGames() {
  // Fetch −7 to +14 day window so history + upcoming both populate.
  const today = new Date();
  const dateStart = new Date(today);
  dateStart.setDate(today.getDate() - 7);
  const dateEnd = new Date(today);
  dateEnd.setDate(today.getDate() + 14);
  const dateRange = `${fmtDate(dateStart)}-${fmtDate(dateEnd)}`;

  const results = await Promise.allSettled(
    ESPN_SOCCER_LEAGUES.map(async ({ key, label }) => {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${key}/scoreboard?dates=${dateRange}&limit=200`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      const events = data.events ?? [];
      // Fetch real odds in parallel via pickcenter
      const oddsList = await Promise.all(
        events.map((event) => fetchSoccerOdds(key, event.id).catch(() => null)),
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
          const rawStatus = isCompleted
            ? 'completed'
            : statusState === 'in'
              ? 'in_progress'
              : 'scheduled';
          const dbStatus = reconcileStatus(rawStatus, event.date);

          const realOdds = oddsList[i];
          const homeOdds = realOdds?.moneyHome ?? null;
          const drawOdds = realOdds?.moneyDraw ?? null;
          const awayOdds = realOdds?.moneyAway ?? null;
          const overOdds = realOdds?.overOdds ?? null;
          const underOdds = realOdds?.underOdds ?? null;
          const totalLine = realOdds?.overUnder ?? null;

          return {
            id: `${key}-${espnId}`,
            apiId: espnId,
            homeTeam: home.team.displayName,
            awayTeam: away.team.displayName,
            homeScore:
              home.score !== undefined && home.score !== ''
                ? parseInt(home.score, 10)
                : null,
            awayScore:
              away.score !== undefined && away.score !== ''
                ? parseInt(away.score, 10)
                : null,
            homeLogo: home.team.logo || null,
            awayLogo: away.team.logo || null,
            startTime: event.date,
            status: dbStatus,
            totalLine,
            overOdds,
            underOdds,
            sport: 'Soccer',
            leagueId: null,
            leagueLabel: label,
            h2hPicks: {
              home: homeOdds ? { id: `${espnId}-h2h-home`, label: home.team.displayName, odds: homeOdds } : null,
              draw: drawOdds ? { id: `${espnId}-h2h-draw`, label: 'Draw', odds: drawOdds } : null,
              away: awayOdds ? { id: `${espnId}-h2h-away`, label: away.team.displayName, odds: awayOdds } : null,
            },
            totalsPicks: {
              over: totalLine && overOdds ? { id: `${espnId}-totals-over`, odds: overOdds, lineValue: totalLine } : null,
              under: totalLine && underOdds ? { id: `${espnId}-totals-under`, odds: underOdds, lineValue: totalLine } : null,
            },
            spread: { home: null, away: null },
          };
        })
        .filter(Boolean);
    }),
  );

  const all = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  // Sort: live first, then upcoming, then completed
  const order = { in_progress: 0, scheduled: 1, completed: 2 };
  return all.sort(
    (a, b) =>
      (order[a.status] ?? 3) - (order[b.status] ?? 3) ||
      new Date(a.startTime) - new Date(b.startTime),
  );
}

// Map the shared classifier output into the DB-style status strings that the
// rest of the soccer UI expects ('scheduled' | 'in_progress' | 'completed').
function reconcileStatus(rawStatus, startTimeIso) {
  const cls = classifyGame({
    rawStatus,
    startTime: startTimeIso,
    sport: 'soccer',
  });
  if (cls === 'live') return 'in_progress';
  if (cls === 'finished') return 'completed';
  return 'scheduled';
}

function formatDbGame(dbGame) {
  const sport = dbGame.league?.sport;
  const leagueId = dbGame.league?.id;

  const h2hMarket = dbGame.markets?.find((m) => m.type === 'h2h');
  let h2hPicks = { home: null, draw: null, away: null };

  if (h2hMarket) {
    const homeS = h2hMarket.selections.find((s) =>
      matchTeams(s.label, dbGame.homeTeam),
    );
    const awayS = h2hMarket.selections.find((s) =>
      matchTeams(s.label, dbGame.awayTeam),
    );
    const drawS = h2hMarket.selections.find(
      (s) =>
        s.label.toLowerCase() === 'draw' ||
        s.label.toLowerCase() === 'tie',
    );
    h2hPicks = {
      home: homeS ? { id: homeS.id, label: homeS.label, odds: homeS.odds } : null,
      draw: drawS ? { id: drawS.id, label: drawS.label, odds: drawS.odds } : null,
      away: awayS ? { id: awayS.id, label: awayS.label, odds: awayS.odds } : null,
    };
  }

  const totalsMarket = dbGame.markets?.find((m) => m.type === 'totals');
  let totalLine = null, overOdds = null, underOdds = null;
  let totalsPicks = { over: null, under: null };

  if (totalsMarket && totalsMarket.selections.length > 0) {
    const over = totalsMarket.selections.find((s) =>
      s.label.toLowerCase().includes('over'),
    );
    const under = totalsMarket.selections.find((s) =>
      s.label.toLowerCase().includes('under'),
    );
    totalLine = over?.lineValue || under?.lineValue || null;
    overOdds = over?.odds || null;
    underOdds = under?.odds || null;
    totalsPicks = {
      over: over ? { id: over.id, odds: over.odds, lineValue: over.lineValue ?? null } : null,
      under: under ? { id: under.id, odds: under.odds, lineValue: under.lineValue ?? null } : null,
    };
  }

  const { home: spreadHomeSel, away: spreadAwaySel } =
    parseSoccerSpreads(dbGame);

  return {
    id: dbGame.id,
    apiId: dbGame.apiId,
    homeTeam: dbGame.homeTeam,
    awayTeam: dbGame.awayTeam,
    homeScore: dbGame.scores?.home,
    awayScore: dbGame.scores?.away,
    totalLine,
    overOdds,
    underOdds,
    sport: sport ?? 'Soccer',
    leagueId,
    leagueLabel: 'Premier League',
    h2hPicks,
    totalsPicks,
    spread: {
      home: spreadHomeSel
        ? { selectionId: spreadHomeSel.id, odds: spreadHomeSel.odds, lineValue: spreadHomeSel.lineValue }
        : null,
      away: spreadAwaySel
        ? { selectionId: spreadAwaySel.id, odds: spreadAwaySel.odds, lineValue: spreadAwaySel.lineValue }
        : null,
    },
    homeLogo:
      dbGame.homeLogo ||
      `https://ui-avatars.com/api/?name=${dbGame.homeTeam}&background=random`,
    awayLogo:
      dbGame.awayLogo ||
      `https://ui-avatars.com/api/?name=${dbGame.awayTeam}&background=random`,
    startTime: dbGame.startTime,
    status: reconcileStatus(dbGame.status, dbGame.startTime),
  };
}

async function fetchDbEplGames() {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const end = new Date();
  end.setDate(end.getDate() + 14);

  const params = new window.URLSearchParams({
    leagueName: EPL_LEAGUE_NAME,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  const apiUrl = `/api/getGames?${params.toString()}`;
  const response = await fetch(apiUrl);
  if (!response.ok) return [];
  const backendData = await response.json();
  if (!Array.isArray(backendData)) return [];
  return backendData.map(formatDbGame);
}

export const getSoccerGames = (pruneSelectionsForGames) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchLiveGames = async () => {
      try {
        // Pull DB EPL (real Odds API data) and ESPN multi-league (real DraftKings
        // odds via pickcenter) in parallel, then merge — DB wins on EPL collisions.
        const [dbGames, espnGames] = await Promise.all([
          fetchDbEplGames().catch(() => []),
          fetchEspnSoccerGames().catch(() => []),
        ]);

        const dbApiIds = new Set(dbGames.map((g) => String(g.apiId)));
        const merged = [
          ...dbGames,
          ...espnGames.filter((g) => !dbApiIds.has(String(g.apiId))),
        ];

        const order = { in_progress: 0, scheduled: 1, completed: 2 };
        merged.sort(
          (a, b) =>
            (order[a.status] ?? 3) - (order[b.status] ?? 3) ||
            new Date(a.startTime) - new Date(b.startTime),
        );

        if (cancelled) return;
        setGames(merged);
        if (pruneSelectionsForGames) pruneSelectionsForGames(merged);
      } catch (error) {
        console.error('Failed to fetch soccer games from all sources:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLiveGames();
    const intervalId = window.setInterval(fetchLiveGames, 300000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pruneSelectionsForGames]);

  return { games, loading };
};
