import { useState, useEffect } from 'react';
import { parseSoccerSpreads } from '../adapters/soccerApiAdapter';

const EPL_LEAGUE_NAME = 'English Premier League';

const ESPN_SOCCER_LEAGUES = [
  { key: 'ger.1', label: 'Bundesliga' },
  { key: 'esp.1', label: 'La Liga' },
  { key: 'usa.1', label: 'MLS' },
  { key: 'eng.1', label: 'Premier League' },
  { key: 'fra.1', label: 'Ligue 1' },
  { key: 'uefa.champions', label: 'Champions League' },
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

function seedOdds(espnId, slot) {
  const seed = ([...espnId].reduce((a, c) => a + c.charCodeAt(0), 0) + slot * 31) / 10000;
  return parseFloat(Math.max(1.35, Math.min(4.5, 1.35 + seed * 3.15)).toFixed(2));
}

async function fetchEspnSoccerGames() {
  const results = await Promise.allSettled(
    ESPN_SOCCER_LEAGUES.map(async ({ key, label }) => {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${key}/scoreboard`,
      );
      if (!res.ok) return [];
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

          const homeOdds = seedOdds(espnId, 0);
          const drawOdds = seedOdds(espnId, 1);
          const awayOdds = seedOdds(espnId, 2);
          const overOdds = 1.9;
          const underOdds = 1.9;
          const totalLine = 2.5;

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
              home: { id: `${espnId}-h2h-home`, label: home.team.displayName, odds: homeOdds },
              draw: { id: `${espnId}-h2h-draw`, label: 'Draw', odds: drawOdds },
              away: { id: `${espnId}-h2h-away`, label: away.team.displayName, odds: awayOdds },
            },
            totalsPicks: {
              over: { id: `${espnId}-totals-over`, odds: overOdds, lineValue: totalLine },
              under: { id: `${espnId}-totals-under`, odds: underOdds, lineValue: totalLine },
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

export const getSoccerGames = (pruneSelectionsForGames) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveGames = async () => {
      try {
        const start = new Date();
        start.setDate(start.getDate() - 2);
        const end = new Date();
        end.setDate(end.getDate() + 14);

        const params = new URLSearchParams({
          leagueName: EPL_LEAGUE_NAME,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });

        const apiUrl = `/api/getGames?${params.toString()}`;
        const response = await fetch(apiUrl);
        const backendData = await response.json();

        if (Array.isArray(backendData) && backendData.length > 0) {
          // DB has data — use it
          const formattedGames = backendData.map((dbGame) => {
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
            let totalLine = '-', overOdds = '-', underOdds = '-';
            let totalsPicks = { over: null, under: null };

            if (totalsMarket && totalsMarket.selections.length > 0) {
              const over = totalsMarket.selections.find((s) =>
                s.label.toLowerCase().includes('over'),
              );
              const under = totalsMarket.selections.find((s) =>
                s.label.toLowerCase().includes('under'),
              );
              totalLine = over?.lineValue || under?.lineValue || '-';
              overOdds = over?.odds || '-';
              underOdds = under?.odds || '-';
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
              status: dbGame.status,
            };
          });

          setGames(formattedGames);
          if (pruneSelectionsForGames) pruneSelectionsForGames(formattedGames);
        } else {
          // DB empty — fall back to ESPN multi-league
          const espnGames = await fetchEspnSoccerGames();
          setGames(espnGames);
          if (pruneSelectionsForGames) pruneSelectionsForGames(espnGames);
        }
      } catch (error) {
        // Any DB error — try ESPN
        try {
          const espnGames = await fetchEspnSoccerGames();
          setGames(espnGames);
          if (pruneSelectionsForGames) pruneSelectionsForGames(espnGames);
        } catch {
          console.error('Failed to fetch soccer games from all sources:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLiveGames();
    const intervalId = window.setInterval(fetchLiveGames, 300000);
    return () => window.clearInterval(intervalId);
  }, [pruneSelectionsForGames]);

  return { games, loading };
};
