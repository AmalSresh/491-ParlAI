const API_BASE = "/api";
const ENV_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();
const RESOLVED_API_BASE = ENV_API_BASE_URL || API_BASE;
const ENDPOINTS = {
  placeBet: `${RESOLVED_API_BASE}/nba/bets`,
};

const ESPN_NBA_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

function safeGetTeamName(team) {
  return team?.displayName || team?.name || team?.abbreviation || "—";
}

function safeTeamAbbr(team) {
  return team?.abbreviation || team?.shortName || "—";
}

function normalizeScore(score) {
  if (score === null || score === undefined || score === "") return null;
  const n = Number(score);
  return Number.isNaN(n) ? null : n;
}

function parseNbaScoreboard(payload) {
  const league = payload?.leagues?.[0];
  const seasonDisplay =
    league?.season?.displayName || league?.season?.year || "—";

  const events = payload?.events || [];

  return events
    .map((event) => {
      const comp = event?.competitions?.[0];
      const competitors = comp?.competitors || [];
      const home = competitors.find((c) => c.homeAway === "home");
      const away = competitors.find((c) => c.homeAway === "away");

      if (!home || !away) return null;

      return {
        id: event?.id || comp?.id || `${away?.team?.abbreviation}@${home?.team?.abbreviation}`,
        league: league?.abbreviation || "NBA",
        seasonDisplay,
        startDate: comp?.startDate || event?.date || null,
        status: {
          typeState: comp?.status?.type?.state || comp?.status?.type?.id || null,
          clock: comp?.status?.displayClock || null,
        },
        home: {
          abbr: safeTeamAbbr(home.team),
          name: safeGetTeamName(home.team),
          score: normalizeScore(home.score),
        },
        away: {
          abbr: safeTeamAbbr(away.team),
          name: safeGetTeamName(away.team),
          score: normalizeScore(away.score),
        },
      };
    })
    .filter(Boolean);
}

export async function fetchNbaScoreboard({ date } = {}) {
  const url = date ? `${ESPN_NBA_SCOREBOARD_URL}?dates=${date}` : ESPN_NBA_SCOREBOARD_URL;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ESPN NBA scoreboard failed (${res.status})`);
  }
  const payload = await res.json();
  return parseNbaScoreboard(payload);
}

export async function placeNbaBet(bet) {
  const res = await fetch(ENDPOINTS.placeBet, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

