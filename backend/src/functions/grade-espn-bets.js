// Grade pending bet legs that point at ESPN-only events (NBA, NHL, non-EPL soccer).
// These legs have `selection_id IS NULL` because their selections never made it
// into the DB schema (they came from ESPN's scoreboard, not the Odds API ingest).
//
// Approach:
//   1. Pull every pending leg with NULL selection_id.
//   2. Group by event_id and probe ESPN summary endpoints across sports to find
//      the matching final score.
//   3. Grade each leg (h2h, totals, spreads) against the final score.
//   4. Cascade settlement using the existing processSettledBets pipeline.

import { app } from '@azure/functions';
import axios from 'axios';
import sql from 'mssql';
import { poolPromise } from '../../components/db-connect.js';
import { processSettledBets } from '../../evaluation/process-bet-results.js';
import { gradeAllPendingEvents } from './grade-all-pending-events.js';

const ESPN_ENDPOINTS = [
  { sport: 'basketball', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=' },
  { sport: 'hockey', url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=' },
  { sport: 'baseball', url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=' },
  { sport: 'soccer', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=' },
  { sport: 'soccer', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/summary?event=' },
  { sport: 'soccer', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/summary?event=' },
  { sport: 'soccer', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/summary?event=' },
  { sport: 'soccer', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/summary?event=' },
  { sport: 'soccer', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/summary?event=' },
  { sport: 'soccer', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/summary?event=' },
  { sport: 'soccer', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa/summary?event=' },
];

async function fetchEspnFinalScore(eventId, log) {
  for (const ep of ESPN_ENDPOINTS) {
    try {
      const res = await axios.get(`${ep.url}${eventId}`, { timeout: 6000, validateStatus: () => true });
      if (res.status !== 200 || !res.data || res.data.code) continue;
      const comp = res.data?.header?.competitions?.[0];
      const type = comp?.status?.type;
      if (!type?.completed) continue;
      const competitors = comp.competitors || [];
      const home = competitors.find((c) => c.homeAway === 'home');
      const away = competitors.find((c) => c.homeAway === 'away');
      if (!home || !away) continue;
      const homeScore = Number(home.score);
      const awayScore = Number(away.score);
      if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue;
      return {
        sport: ep.sport,
        homeScore,
        awayScore,
        homeName: home.team?.displayName || '',
        awayName: away.team?.displayName || '',
        homeAbbr: home.team?.abbreviation || '',
        awayAbbr: away.team?.abbreviation || '',
      };
    } catch (err) {
      log?.(`fetchEspnFinalScore ${eventId} via ${ep.url}: ${err.message}`);
    }
  }
  return null;
}

function normalize(s) {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseFirstNumber(s) {
  const m = String(s ?? '').match(/[+-]?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function gradeH2h(leg, score) {
  const label = leg.outcome_label || '';
  const labelNorm = normalize(label);
  const homeNorm = normalize(score.homeName);
  const awayNorm = normalize(score.awayName);
  const homeAbbr = normalize(score.homeAbbr);
  const awayAbbr = normalize(score.awayAbbr);

  const matchHome =
    labelNorm === homeNorm ||
    labelNorm === homeAbbr ||
    (homeNorm && (labelNorm.includes(homeNorm) || homeNorm.includes(labelNorm)));
  const matchAway =
    labelNorm === awayNorm ||
    labelNorm === awayAbbr ||
    (awayNorm && (labelNorm.includes(awayNorm) || awayNorm.includes(labelNorm)));
  const matchDraw = labelNorm === 'draw' || labelNorm === 'tie';

  // Determine the actual outcome
  const draw = score.homeScore === score.awayScore;
  let actual;
  if (draw) actual = 'draw';
  else if (score.homeScore > score.awayScore) actual = 'home';
  else actual = 'away';

  if (actual === 'draw') {
    if (matchDraw) return 'won';
    // For two-way sports (NBA/NHL/MLB) ESPN reports OT/SO results, so ties are rare.
    // If a team bet was placed and the result is a tie, push.
    return matchHome || matchAway ? 'void' : 'lost';
  }
  const winnerIsHome = actual === 'home';
  if (matchDraw) return 'lost';
  if (winnerIsHome) return matchHome ? 'won' : matchAway ? 'lost' : null;
  return matchAway ? 'won' : matchHome ? 'lost' : null;
}

function gradeTotals(leg, score) {
  const label = String(leg.outcome_label || '').toLowerCase();
  const isOver = label.includes('over');
  const isUnder = label.includes('under');
  if (!isOver && !isUnder) return null;
  const line = parseFirstNumber(label);
  if (line == null) return null;
  const total = score.homeScore + score.awayScore;
  if (total === line) return 'void';
  if (isOver) return total > line ? 'won' : 'lost';
  return total < line ? 'won' : 'lost';
}

function gradeSpreads(leg, score) {
  const label = String(leg.outcome_label || '');
  // Expected: "DET +5.5" or "PHX -2.5" or "ARS PK"
  const tokens = label.trim().split(/\s+/);
  if (tokens.length < 2) return null;
  const teamToken = normalize(tokens[0]);
  const lineToken = tokens.slice(1).join(' ');
  let line;
  if (/^pk$/i.test(lineToken.trim())) line = 0;
  else line = parseFirstNumber(lineToken);
  if (line == null) return null;

  const homeAbbr = normalize(score.homeAbbr);
  const awayAbbr = normalize(score.awayAbbr);
  const homeName = normalize(score.homeName);
  const awayName = normalize(score.awayName);
  const isHome = teamToken === homeAbbr || teamToken === homeName || (homeName && homeName.includes(teamToken));
  const isAway = teamToken === awayAbbr || teamToken === awayName || (awayName && awayName.includes(teamToken));
  if (!isHome && !isAway) return null;

  const margin = isHome
    ? score.homeScore - score.awayScore
    : score.awayScore - score.homeScore;
  const adjusted = margin + line;
  if (adjusted === 0) return 'void';
  return adjusted > 0 ? 'won' : 'lost';
}

export async function gradeEspnOnlyBets(context) {
  const pool = await poolPromise;
  const log = (msg) => (context?.log ? context.log(msg) : console.log(msg));

  // Pull pending legs that don't reference a DB selection.
  const legsRes = await pool.request().query(`
    SELECT TOP 500
      bl.id AS leg_id,
      bl.event_id,
      bl.market_key,
      bl.outcome_label,
      bl.status
    FROM bet_legs bl
    INNER JOIN bets b ON b.id = bl.bet_id
    WHERE bl.status = 'pending'
      AND bl.selection_id IS NULL
      AND bl.event_id IS NOT NULL
      AND b.status = 'PENDING'
    ORDER BY bl.bet_id
  `);

  const legs = legsRes.recordset || [];
  if (legs.length === 0) {
    log('No ESPN-only pending legs to grade.');
    return { graded: 0 };
  }

  log(`Found ${legs.length} ESPN-only pending legs across ${new Set(legs.map((l) => l.event_id)).size} events.`);

  // Group by event_id
  const byEvent = new Map();
  for (const leg of legs) {
    const key = String(leg.event_id);
    if (!byEvent.has(key)) byEvent.set(key, []);
    byEvent.get(key).push(leg);
  }

  // Fetch final scores with bounded concurrency
  const eventIds = Array.from(byEvent.keys());
  const CONCURRENCY = 5;
  const scoresMap = new Map();
  for (let i = 0; i < eventIds.length; i += CONCURRENCY) {
    const batch = eventIds.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((id) => fetchEspnFinalScore(id, log)));
    batch.forEach((id, idx) => {
      if (results[idx]) scoresMap.set(id, results[idx]);
    });
  }

  let graded = 0;
  for (const [eventId, eventLegs] of byEvent) {
    const score = scoresMap.get(eventId);
    if (!score) continue;

    for (const leg of eventLegs) {
      const marketKey = String(leg.market_key || '').toLowerCase();
      let result = null;
      try {
        if (marketKey === 'h2h') result = gradeH2h(leg, score);
        else if (marketKey === 'totals') result = gradeTotals(leg, score);
        else if (marketKey === 'spreads') result = gradeSpreads(leg, score);
      } catch (err) {
        log(`Grader exception leg ${leg.leg_id}: ${err.message}`);
      }
      if (!result) continue;

      await pool
        .request()
        .input('legId', sql.BigInt, leg.leg_id)
        .input('result', sql.NVarChar, result)
        .query(`UPDATE bet_legs SET status = @result WHERE id = @legId`);
      graded++;
    }
  }

  log(`Graded ${graded} ESPN-only legs. Triggering settlement…`);

  if (graded > 0) {
    try {
      await processSettledBets(pool);
    } catch (err) {
      context?.error?.('processSettledBets failed:', err);
    }
  }

  return { graded };
}

// Runs both graders back-to-back: DB events first (MLB/EPL), ESPN-only second
// (NBA/NHL/non-EPL soccer). Either path on its own returns early if no work.
async function runAllGraders(context) {
  const pool = await poolPromise;
  try {
    await gradeAllPendingEvents(pool);
  } catch (err) {
    context?.error?.('gradeAllPendingEvents failed:', err);
  }
  try {
    await gradeEspnOnlyBets(context);
  } catch (err) {
    context?.error?.('gradeEspnOnlyBets failed:', err);
  }
}

app.timer('gradeBetsTimer', {
  // Every 15 minutes — fast enough to settle bets within reasonable time
  // after games end, without hammering ESPN.
  schedule: '0 */15 * * * *',
  handler: async (myTimer, context) => {
    context.log('grade-bets timer fired at:', new Date().toISOString());
    await runAllGraders(context);
  },
});

app.http('gradeBetsManual', {
  methods: ['GET', 'POST'],
  route: 'admin/grade-bets',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await runAllGraders(context);
      return { status: 200, jsonBody: { ok: true } };
    } catch (err) {
      context.error('Manual grader failed:', err);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
