import { enrichGamesWithEspnOdds, fetchNbaOdds } from '../../utils/espnOdds.js';

const API_BASE = '/api';
const ENV_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();
const RESOLVED_API_BASE = ENV_API_BASE_URL || API_BASE;
const ENDPOINTS = {
  placeBet: `${RESOLVED_API_BASE}/nba/bets`,
};

const ESPN_NBA_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

function safeGetTeamName(team) {
  return team?.displayName || team?.name || team?.abbreviation || '—';
}

function safeTeamAbbr(team) {
  return team?.abbreviation || team?.shortName || '—';
}

function normalizeScore(score) {
  if (score === null || score === undefined || score === '') return null;
  const n = Number(score);
  return Number.isNaN(n) ? null : n;
}

function parseNbaScoreboard(payload) {
  const league = payload?.leagues?.[0];
  const seasonDisplay =
    league?.season?.displayName || league?.season?.year || '—';

  const events = payload?.events || [];

  return events
    .map((event) => {
      const comp = event?.competitions?.[0];
      const competitors = comp?.competitors || [];
      const home = competitors.find((c) => c.homeAway === 'home');
      const away = competitors.find((c) => c.homeAway === 'away');

      if (!home || !away) return null;

      const status = comp?.status || event?.status || {};
      return {
        id: String(
          event?.id ??
            comp?.id ??
            `${away?.team?.abbreviation}@${home?.team?.abbreviation}`,
        ),
        league: league?.abbreviation || 'NBA',
        seasonDisplay,
        startDate: comp?.startDate || event?.date || null,
        status: {
          typeState: status?.type?.state || status?.type?.id || null,
          completed: status?.type?.completed ?? false,
          clock: status?.displayClock || null,
          period: status?.period ?? null,
          shortDetail: status?.type?.shortDetail || null,
        },
        home: {
          abbr: safeTeamAbbr(home.team),
          name: safeGetTeamName(home.team),
          logo: home.team?.logo || null,
          score: normalizeScore(home.score),
        },
        away: {
          abbr: safeTeamAbbr(away.team),
          name: safeGetTeamName(away.team),
          logo: away.team?.logo || null,
          score: normalizeScore(away.score),
        },
      };
    })
    .filter(Boolean);
}

function toYYYYMMDDUtc(d) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * ESPN `dates` uses YYYYMMDD. We want "today" to mean the user's local calendar day,
 * but we still need stable YYYYMMDD keys. This helper anchors the local date at
 * 12:00 UTC so it won't shift weeks at night for US timezones.
 * @param {Date} [refDate]
 * @returns {string[]}
 */
export function getNbaWeekDateKeys(refDate = new Date()) {
  // Convert the *local* Y/M/D into a stable UTC-noon anchor date.
  const localY = refDate.getFullYear();
  const localM = refDate.getMonth();
  const localD = refDate.getDate();
  const d = new Date(Date.UTC(localY, localM, localD, 12, 0, 0, 0));

  const day = d.getUTCDay(); // day-of-week for the local date
  const sunday = new Date(d);
  sunday.setUTCDate(d.getUTCDate() - day);
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(sunday);
    x.setUTCDate(sunday.getUTCDate() + i);
    keys.push(toYYYYMMDDUtc(x));
  }
  return keys;
}

export async function fetchNbaScoreboard({ date } = {}) {
  const url = date
    ? `${ESPN_NBA_SCOREBOARD_URL}?dates=${date}`
    : ESPN_NBA_SCOREBOARD_URL;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ESPN NBA scoreboard failed (${res.status})`);
  }
  const payload = await res.json();
  return parseNbaScoreboard(payload);
}

/**
 * All games scheduled in a window around `refDate` (default −5 to +7 days), de-duped
 * and sorted by tip time. Each game is enriched with real DraftKings odds from
 * ESPN's pickcenter (`game.odds`).
 */
export async function fetchNbaScoreboardWeek({ refDate } = {}) {
  // Fetch the current local Sun–Sat week, plus a wider rolling window so we
  // get recent finished games (history) and upcoming matches together.
  const base = refDate ?? new Date();
  const weekKeys = getNbaWeekDateKeys(base);

  const localY = base.getFullYear();
  const localM = base.getMonth();
  const localD = base.getDate();
  const anchor = new Date(Date.UTC(localY, localM, localD, 12, 0, 0, 0));

  const bufferKeys = [];
  for (let i = -5; i <= 7; i++) {
    const d = new Date(anchor);
    d.setUTCDate(anchor.getUTCDate() + i);
    bufferKeys.push(toYYYYMMDDUtc(d));
  }

  const keys = Array.from(new Set([...weekKeys, ...bufferKeys]));
  const dayResults = await Promise.all(
    keys.map((date) => fetchNbaScoreboard({ date })),
  );
  const byId = new Map();
  for (const dayGames of dayResults) {
    for (const g of dayGames) {
      if (!byId.has(g.id)) byId.set(g.id, g);
    }
  }
  const games = Array.from(byId.values()).sort((a, b) => {
    const ta = a.startDate ? new Date(a.startDate).getTime() : 0;
    const tb = b.startDate ? new Date(b.startDate).getTime() : 0;
    return tb - ta;
  });

  return enrichGamesWithEspnOdds(games, fetchNbaOdds);
}

export async function placeNbaBet(bet) {
  const res = await fetch(ENDPOINTS.placeBet, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bet),
  });

  if (!res.ok) {
    let data = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }
    throw new Error(data?.error || `Bet failed (${res.status})`);
  }

  return res.json();
}
