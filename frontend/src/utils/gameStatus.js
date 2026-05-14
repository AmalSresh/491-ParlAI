// Normalize game status across data sources into one canonical value.
//
// Inputs vary by source:
//   • ESPN scoreboard (NBA/NHL/Soccer raw events): `status.type.state` = 'pre' | 'in' | 'post'
//     plus optional `status.type.completed` boolean.
//   • Backend DB (`getGames` API for MLB/EPL): `status` string = 'scheduled' | 'in_progress' | 'completed'
//   • Frontend-formatted soccer/MLB games already normalize to the DB-style strings.
//
// Cross-source rules:
//   • Authoritative "live" signal wins.
//   • Authoritative "completed" signal wins.
//   • If raw status says scheduled but the start time + reasonable game length is in
//     the past, treat as 'finished' (data source's scores timer is behind).
//   • If raw status says scheduled but start time is already past (game has tipped off
//     by the clock) and we're inside the game-length window, treat as 'live'.
//   • Otherwise: 'upcoming'.

const GAME_LENGTH_MS = {
  nba: 3 * 60 * 60 * 1000, // tip + halftime + OT cushion
  basketball: 3 * 60 * 60 * 1000,
  nhl: 3 * 60 * 60 * 1000,
  hockey: 3 * 60 * 60 * 1000,
  mlb: 5 * 60 * 60 * 1000, // extras
  baseball: 5 * 60 * 60 * 1000,
  soccer: 3 * 60 * 60 * 1000, // 90' + stoppage + halftime
};

const DEFAULT_GAME_LENGTH_MS = 4 * 60 * 60 * 1000;

function gameLength(sport) {
  if (!sport) return DEFAULT_GAME_LENGTH_MS;
  return GAME_LENGTH_MS[String(sport).toLowerCase()] ?? DEFAULT_GAME_LENGTH_MS;
}

/**
 * @param {object} args
 * @param {string|null|undefined} args.rawStatus  ESPN state ('pre'/'in'/'post') or DB string
 * @param {boolean|undefined} args.completed      Optional explicit completion flag
 * @param {string|number|Date|null|undefined} args.startTime  ISO string / Date / ms
 * @param {string|null|undefined} args.sport      e.g. 'nba', 'mlb', 'nhl', 'soccer'
 * @returns {'live' | 'upcoming' | 'finished'}
 */
export function classifyGame({ rawStatus, completed, startTime, sport } = {}) {
  const status = String(rawStatus ?? '').toLowerCase();

  // 1. Explicit "finished" signals
  if (
    completed === true ||
    status === 'post' ||
    status === 'completed' ||
    status === 'finished' ||
    status === 'final' ||
    status === 'cancelled' ||
    status === 'postponed'
  ) {
    return 'finished';
  }

  // 2. Explicit "live" signals
  if (status === 'in' || status === 'in_progress' || status === 'live' || status === 'halftime') {
    return 'live';
  }

  // 3. Status says scheduled/pre but use clock to reconcile
  const startMs = startTime ? new Date(startTime).getTime() : NaN;
  if (Number.isFinite(startMs)) {
    const elapsed = Date.now() - startMs;
    const length = gameLength(sport);
    if (elapsed > length) return 'finished';   // stale "scheduled" past game length
    if (elapsed > 0) return 'live';            // game has started by clock, scores timer just behind
  }

  return 'upcoming';
}

/**
 * Convenience: returns true when betting should be closed for a game.
 * Bets are closed when the game is live OR finished (or invalid).
 */
export function isBettingClosedFor(game) {
  if (!game) return true;
  const cls = classifyGameFromGame(game);
  return cls !== 'upcoming';
}

/**
 * Adapt various game shapes into classifyGame() inputs.
 */
export function classifyGameFromGame(game) {
  if (!game) return 'finished';

  // ESPN raw scoreboard event shape: { status: { type: { state, completed } }, date }
  if (game.status && game.status.type && typeof game.status.type === 'object') {
    return classifyGame({
      rawStatus: game.status.type.state,
      completed: game.status.type.completed,
      startTime: game.date ?? game.startDate ?? game.startTime,
      sport: game.sport ?? inferSportFromEspn(game),
    });
  }

  // NBA client formatted shape: { status: { typeState, clock }, startDate }
  if (
    game.status &&
    typeof game.status === 'object' &&
    'typeState' in game.status
  ) {
    return classifyGame({
      rawStatus: game.status.typeState,
      startTime: game.startDate ?? game.startTime,
      sport: 'nba',
    });
  }

  // DB/normalized shape: { status: 'scheduled' | 'in_progress' | 'completed', startTime }
  return classifyGame({
    rawStatus: game.status,
    startTime: game.startTime ?? game.startDate,
    sport: game.sport ?? game.leagueSport,
  });
}

function inferSportFromEspn(game) {
  // ESPN events sometimes carry `leagues[0].slug` or `sport` higher up; best-effort.
  const slug = game?.leagues?.[0]?.slug || game?.league || '';
  if (/nba|basket/i.test(slug)) return 'nba';
  if (/nhl|hockey/i.test(slug)) return 'nhl';
  if (/mlb|base/i.test(slug)) return 'mlb';
  if (/soccer|epl|laliga|bundesliga/i.test(slug)) return 'soccer';
  return null;
}
