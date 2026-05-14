// Fetch real odds for ESPN events via the summary endpoint (`pickcenter`).
// ESPN returns American odds (-110, +200, etc.); the rest of the app uses decimal odds.

const SUMMARY_URLS = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary',
  // Soccer summary URL is per-league: `/soccer/<key>/summary`
};

function americanToDecimal(am) {
  const n = Number(am);
  if (!Number.isFinite(n) || n === 0) return null;
  if (n > 0) return parseFloat((n / 100 + 1).toFixed(2));
  return parseFloat((100 / Math.abs(n) + 1).toFixed(2));
}

function parsePickcenter(pc) {
  if (!pc) return null;
  const moneyHome = americanToDecimal(pc?.homeTeamOdds?.moneyLine);
  const moneyAway = americanToDecimal(pc?.awayTeamOdds?.moneyLine);
  const moneyDraw = americanToDecimal(pc?.drawOdds?.moneyLine);
  const spreadHomeOdds = americanToDecimal(pc?.homeTeamOdds?.spreadOdds);
  const spreadAwayOdds = americanToDecimal(pc?.awayTeamOdds?.spreadOdds);
  const overOdds = americanToDecimal(pc?.overOdds);
  const underOdds = americanToDecimal(pc?.underOdds);
  // `spread` is the home-team line in ESPN (negative = home favored).
  const homeSpread = pc?.spread != null ? Number(pc.spread) : null;
  const awaySpread = homeSpread != null ? -homeSpread : null;
  const overUnder = pc?.overUnder != null ? Number(pc.overUnder) : null;
  return {
    provider: pc?.provider?.name || null,
    moneyHome,
    moneyAway,
    moneyDraw,
    homeSpread,
    awaySpread,
    spreadHomeOdds,
    spreadAwayOdds,
    overUnder,
    overOdds,
    underOdds,
  };
}

// Convert ESPN's win-probability matchup predictor into fair decimal odds
// with a 4% house margin. Returns null if predictor data is missing.
function derivePredictorOdds(pred) {
  if (!pred) return null;
  const homeProb = Number(pred?.homeTeam?.gameProjection);
  const awayProb = Number(pred?.awayTeam?.gameProjection);
  if (!Number.isFinite(homeProb) || !Number.isFinite(awayProb)) return null;
  const clamp = (p) => Math.max(0.5, Math.min(99.5, p));
  const fair = (p) => 100 / clamp(p);
  const VIG = 1.04;
  return {
    provider: 'ESPN Predictor',
    moneyHome: parseFloat((fair(homeProb) / VIG).toFixed(2)),
    moneyAway: parseFloat((fair(awayProb) / VIG).toFixed(2)),
    moneyDraw: null,
    homeSpread: null,
    awaySpread: null,
    spreadHomeOdds: null,
    spreadAwayOdds: null,
    overUnder: null,
    overOdds: null,
    underOdds: null,
  };
}

async function fetchSummary(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pc = Array.isArray(data?.pickcenter) ? data.pickcenter[0] : null;
    const fromPickcenter = parsePickcenter(pc);
    // Pickcenter is best when present — full market (ML, spread, total, draw).
    if (fromPickcenter && (fromPickcenter.moneyHome != null || fromPickcenter.moneyAway != null)) {
      return fromPickcenter;
    }
    // Fallback: derive moneyline from ESPN's matchup predictor (real model output).
    const fromPredictor = derivePredictorOdds(data?.predictor);
    if (fromPredictor) return fromPredictor;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch real odds for an NBA event from ESPN's pickcenter.
 * Returns null on failure (caller should handle missing odds).
 */
export async function fetchNbaOdds(eventId) {
  if (!eventId) return null;
  return fetchSummary(`${SUMMARY_URLS.nba}?event=${eventId}`);
}

export async function fetchNhlOdds(eventId) {
  if (!eventId) return null;
  return fetchSummary(`${SUMMARY_URLS.nhl}?event=${eventId}`);
}

export async function fetchMlbOdds(eventId) {
  if (!eventId) return null;
  return fetchSummary(`${SUMMARY_URLS.mlb}?event=${eventId}`);
}

export async function fetchSoccerOdds(leagueKey, eventId) {
  if (!leagueKey || !eventId) return null;
  return fetchSummary(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueKey}/summary?event=${eventId}`,
  );
}

/**
 * Enrich a list of game objects with real ESPN odds, fetched in parallel.
 * Each `games[i]` must have an `id` (ESPN event id). Returns the same list with
 * an `.odds` field populated where available.
 */
export async function enrichGamesWithEspnOdds(games, fetcher) {
  if (!Array.isArray(games) || games.length === 0) return games;
  const results = await Promise.allSettled(games.map((g) => fetcher(g.id)));
  return games.map((g, i) => {
    const r = results[i];
    const odds = r.status === 'fulfilled' ? r.value : null;
    return { ...g, odds };
  });
}
