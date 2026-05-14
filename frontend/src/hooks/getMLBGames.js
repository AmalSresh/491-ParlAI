import { useState, useEffect } from 'react';
import { fetchMlbGamesFromEspn } from '../api/mlb/mlbBetsClient';
import { classifyGame } from '../utils/gameStatus.js';

const MLB_LEAGUE_ID = 703;

// Stale `scheduled` rows (game already started or finished but the scores timer
// is behind) are normalized down to a real status using the shared classifier.
function reconcileStatus(rawStatus, startTimeIso) {
  const cls = classifyGame({
    rawStatus,
    startTime: startTimeIso,
    sport: 'mlb',
  });
  if (cls === 'live') return 'in_progress';
  if (cls === 'finished') return 'completed';
  return 'scheduled';
}

function matchTeams(name1, name2) {
  if (!name1 || !name2) return false;
  const normalize = (str) => str.toLowerCase().replace(/[^a-z]/g, '');
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  return n1.includes(n2) || n2.includes(n1);
}

async function fetchFromDb() {
  const start = new Date();
  start.setDate(start.getDate() - 3);
  const end = new Date();
  end.setDate(end.getDate() + 14);

  const params = new window.URLSearchParams({
    leagueId: MLB_LEAGUE_ID,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  const res = await fetch(`/api/getGames?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch MLB games from DB');
  const backendData = await res.json();
  if (!Array.isArray(backendData) || backendData.length === 0) return [];

  return backendData.map((dbGame) => {
    const leagueId = dbGame.league?.id;
    const sport = dbGame.league?.sport;

    const h2hMarket = dbGame.markets?.find((m) => m.type === 'h2h');
    let h2hPicks = { home: null, away: null };

    if (h2hMarket) {
      const homeS = h2hMarket.selections.find((s) =>
        matchTeams(s.label, dbGame.homeTeam),
      );
      const awayS = h2hMarket.selections.find((s) =>
        matchTeams(s.label, dbGame.awayTeam),
      );
      h2hPicks = {
        home: homeS ? { id: homeS.id, label: homeS.label, odds: homeS.odds } : null,
        away: awayS ? { id: awayS.id, label: awayS.label, odds: awayS.odds } : null,
      };
    }

    const totalsMarket = dbGame.markets?.find((m) => m.type === 'totals');
    let totalsPicks = { over: null, under: null };
    let totalLine = 8.5;

    if (totalsMarket) {
      const over = totalsMarket.selections.find((s) =>
        s.label.toLowerCase().includes('over'),
      );
      const under = totalsMarket.selections.find((s) =>
        s.label.toLowerCase().includes('under'),
      );
      totalLine = over?.lineValue || under?.lineValue || 8.5;
      totalsPicks = {
        over: over ? { id: over.id, odds: over.odds, lineValue: over.lineValue } : null,
        under: under ? { id: under.id, odds: under.odds, lineValue: under.lineValue } : null,
      };
    }

    return {
      id: dbGame.apiId || String(dbGame.id),
      apiId: dbGame.apiId,
      dbId: dbGame.id,
      leagueId,
      sport: sport?.toLowerCase() || 'mlb',
      homeTeam: dbGame.homeTeam,
      awayTeam: dbGame.awayTeam,
      homeLogo:
        dbGame.homeLogo ||
        `https://ui-avatars.com/api/?name=${dbGame.homeTeam}&background=random`,
      awayLogo:
        dbGame.awayLogo ||
        `https://ui-avatars.com/api/?name=${dbGame.awayTeam}&background=random`,
      homeScore: dbGame.scores?.home,
      awayScore: dbGame.scores?.away,
      startTime: dbGame.startTime,
      status: reconcileStatus(dbGame.status, dbGame.startTime),
      gameName: `${dbGame.awayTeam} @ ${dbGame.homeTeam}`,
      h2hPicks,
      totalsPicks,
      totalLine,
    };
  });
}

export const getMLBGames = (pruneSelectionsForGames) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchGames = async () => {
      try {
        // Pull DB (real Odds API odds, mostly recent/live) and ESPN (real
        // pickcenter odds + upcoming schedule) in parallel, then merge — DB
        // wins on overlapping events.
        const [dbGames, espnGames] = await Promise.all([
          fetchFromDb().catch(() => []),
          fetchMlbGamesFromEspn().catch(() => []),
        ]);

        const dbApiIds = new Set(dbGames.map((g) => String(g.apiId ?? g.id)));
        const espnNormalized = espnGames.map((g) => ({
          ...g,
          status: reconcileStatus(g.status, g.startTime),
        }));
        const merged = [
          ...dbGames,
          ...espnNormalized.filter((g) => !dbApiIds.has(String(g.apiId ?? g.id))),
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
      } catch (err) {
        console.error('Failed to fetch MLB games:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGames();
    const intervalId = window.setInterval(fetchGames, 300000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pruneSelectionsForGames]);

  return { games, loading, error };
};
