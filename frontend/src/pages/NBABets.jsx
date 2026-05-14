import { useEffect, useMemo, useState } from 'react';
import {
  fetchNbaScoreboardWeek,
  getNbaWeekDateKeys,
} from '../api/nba/nbaBetsClient';
import { useGlobalBetSlip } from '../context/BetSlipContext';
import {
  MARKET_KEYS,
  formatSpreadLine,
  isBettingClosed,
} from '../utils/betPayload.js';
import { classifyGameFromGame } from '../utils/gameStatus.js';

const NBA_FUTURES = [
  {
    key: 'championship',
    title: '🏆 NBA Championship',
    picks: [
      { id: 'nba-fut-champ-bos', label: 'Boston Celtics', odds: 3.50 },
      { id: 'nba-fut-champ-okc', label: 'Oklahoma City Thunder', odds: 4.50 },
      { id: 'nba-fut-champ-cle', label: 'Cleveland Cavaliers', odds: 6.00 },
      { id: 'nba-fut-champ-den', label: 'Denver Nuggets', odds: 7.50 },
      { id: 'nba-fut-champ-mil', label: 'Milwaukee Bucks', odds: 9.00 },
      { id: 'nba-fut-champ-gsw', label: 'Golden State Warriors', odds: 12.00 },
      { id: 'nba-fut-champ-nyk', label: 'New York Knicks', odds: 14.00 },
    ],
  },
  {
    key: 'mvp',
    title: '⭐ NBA MVP',
    picks: [
      { id: 'nba-fut-mvp-jokic', label: 'Nikola Jokić', odds: 3.00 },
      { id: 'nba-fut-mvp-sga', label: 'Shai Gilgeous-Alexander', odds: 3.50 },
      { id: 'nba-fut-mvp-giannis', label: 'Giannis Antetokounmpo', odds: 5.50 },
      { id: 'nba-fut-mvp-tatum', label: 'Jayson Tatum', odds: 8.00 },
      { id: 'nba-fut-mvp-luka', label: 'Luka Dončić', odds: 9.00 },
      { id: 'nba-fut-mvp-edwards', label: 'Anthony Edwards', odds: 11.00 },
    ],
  },
  {
    key: 'dpoy',
    title: '🛡️ Defensive Player of the Year',
    picks: [
      { id: 'nba-fut-dpoy-wemby', label: 'Victor Wembanyama', odds: 2.50 },
      { id: 'nba-fut-dpoy-bam', label: 'Bam Adebayo', odds: 5.00 },
      { id: 'nba-fut-dpoy-gobert', label: 'Rudy Gobert', odds: 6.00 },
      { id: 'nba-fut-dpoy-jjj', label: 'Jaren Jackson Jr.', odds: 7.00 },
      { id: 'nba-fut-dpoy-lopez', label: 'Brook Lopez', odds: 10.00 },
    ],
  },
  {
    key: 'roy',
    title: '🌟 Rookie of the Year',
    picks: [
      { id: 'nba-fut-roy-risacher', label: 'Zaccharie Risacher', odds: 3.00 },
      { id: 'nba-fut-roy-sarr', label: 'Alexandre Sarr', odds: 4.50 },
      { id: 'nba-fut-roy-castle', label: 'Stephon Castle', odds: 5.00 },
      { id: 'nba-fut-roy-sheppard', label: 'Reed Sheppard', odds: 7.00 },
      { id: 'nba-fut-roy-clingan', label: 'Donovan Clingan', odds: 9.00 },
    ],
  },
  {
    key: 'smoy',
    title: '💡 Sixth Man of the Year',
    picks: [
      { id: 'nba-fut-smoy-powell', label: 'Norman Powell', odds: 3.50 },
      { id: 'nba-fut-smoy-monk', label: 'Malik Monk', odds: 5.00 },
      { id: 'nba-fut-smoy-pritchard', label: 'Payton Pritchard', odds: 6.00 },
      { id: 'nba-fut-smoy-clarkson', label: 'Jordan Clarkson', odds: 8.00 },
      { id: 'nba-fut-smoy-hyland', label: 'Bones Hyland', odds: 12.00 },
    ],
  },
];

// Layered odds source for NBA matchups:
//   1. game.odds.* — DraftKings via ESPN pickcenter (preferred, real-book odds)
//   2. game.odds.moneyHome/moneyAway — derived from ESPN's matchup predictor
//      (real ESPN model output with 4% house margin) for games where DraftKings
//      hasn't posted lines yet.
//   3. Deterministic per-game fallback below — varies per matchup so every game
//      has bettable markets even before bookmaker lines drop.
function seedH2h(gameId, side) {
  const s = [...String(gameId)].reduce((a, c) => a + c.charCodeAt(0), 0) % 100 / 100;
  const base = side === 'home' ? 1.35 + s * 1.2 : 1.35 + (1 - s) * 1.2;
  return parseFloat(Math.max(1.25, Math.min(2.75, base)).toFixed(2));
}
function seedNbaSpread(gameId) {
  const sum = [...String(gameId)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return 1.5 + (sum % 11);
}
function seedNbaTotal(gameId) {
  const sum = [...String(gameId)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return 210 + (sum % 31);
}

function formatKickoff(iso) {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDayHeading(iso) {
  if (!iso) return 'Date TBA';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return 'Date TBA';
  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function daySortKey(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toDateString();
}

function getStatusLabel(state) {
  switch (state) {
    case 'pre':
    case 'post':
    case 'in':
      return state.toUpperCase();
    default:
      return state ? String(state).toUpperCase() : '—';
  }
}

function pickButtonClass(selected, disabled) {
  const base =
    'rounded-lg border px-3 py-2 text-xs font-extrabold transition-colors min-w-[5.5rem]';
  if (disabled) {
    return `${base} border-sb-border bg-sb-bg/40 text-sb-muted cursor-not-allowed opacity-50`;
  }
  if (selected) {
    return `${base} border-sb-blue bg-sb-blue/15 text-sb-blue ring-1 ring-sb-blue cursor-pointer`;
  }
  return `${base} border-sb-border bg-sb-bg text-sb-text hover:border-sb-blue hover:text-sb-blue cursor-pointer`;
}

function GameCard({ game, onToggleBet, selectedBets, bettingClosed }) {
  const homeScore = game.home.score ?? null;
  const awayScore = game.away.score ?? null;
  const cls = classifyGameFromGame(game);
  const isFinal = cls === 'finished';
  const closed = bettingClosed || cls !== 'upcoming';

  const isSel = (marketKey, outcomeLabel) =>
    selectedBets.some(
      (b) =>
        String(b.gameId) === String(game.id) &&
        b.marketKey === marketKey &&
        b.outcomeLabel === outcomeLabel,
    );

  const fire = (payload) => {
    if (closed || !onToggleBet) return;
    onToggleBet(payload);
  };

  const realOdds = game.odds || null;
  // Layered fallback (see comment above): pickcenter → predictor → deterministic per-game.
  const homeOdds = realOdds?.moneyHome ?? seedH2h(game.id, 'home');
  const awayOdds = realOdds?.moneyAway ?? seedH2h(game.id, 'away');
  const awayMlLabel = game.away.abbr;
  const homeMlLabel = game.home.abbr;
  const seededSpread = seedNbaSpread(game.id);
  const awaySpreadLine = realOdds?.awaySpread ?? seededSpread;
  const homeSpreadLine = realOdds?.homeSpread ?? -seededSpread;
  const spreadAwayOdds = realOdds?.spreadAwayOdds ?? 1.91;
  const spreadHomeOdds = realOdds?.spreadHomeOdds ?? 1.91;
  const totalLine = realOdds?.overUnder ?? seedNbaTotal(game.id);
  const overOdds = realOdds?.overOdds ?? 1.91;
  const underOdds = realOdds?.underOdds ?? 1.91;
  const hasMl = true;
  const hasSpread = true;
  const hasTotal = true;

  const isLive = cls === 'live';
  const period = game.status?.period;
  const clock = game.status?.clock;
  const liveLabel = period
    ? `Q${period}${clock && clock !== '0:00' ? ` ${clock}` : ''}`
    : 'LIVE';

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isLive
          ? 'border-[#00f6ff44] bg-[#050e14] shadow-[0_0_20px_rgba(0,246,255,0.08)]'
          : 'border-sb-border bg-sb-bg/60'
      } ${isFinal ? 'opacity-80' : ''}`}
    >
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-sb-border/60">
        <span className="text-[0.65rem] uppercase tracking-widest text-sb-muted font-bold">
          🏀 {game.league} • {game.seasonDisplay}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[0.65rem] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {liveLabel}
          </span>
        ) : isFinal ? (
          <span className="text-[0.65rem] font-bold text-sb-muted">FINAL</span>
        ) : (
          <span className="text-[0.7rem] text-sb-muted">
            {formatKickoff(game.startDate)}
          </span>
        )}
      </div>

      <div className="p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {game.away.logo ? (
            <img
              src={game.away.logo}
              alt={game.away.name}
              className="w-9 h-9 object-contain flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-sb-blue/10 border border-sb-blue/30 flex items-center justify-center text-[0.6rem] font-extrabold text-sb-blue">
              {game.away.abbr}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sb-text font-extrabold text-sm truncate">
              {game.away.name}
            </div>
            <div className="text-[0.65rem] text-sb-muted">Away</div>
          </div>
        </div>

        <div className="text-center px-2">
          {isLive || isFinal ? (
            <div
              className={`text-3xl font-black tracking-tight ${
                isLive ? 'text-sb-blue' : 'text-sb-text'
              }`}
            >
              {awayScore ?? '—'}
              <span className="text-sb-muted mx-1.5 text-2xl">–</span>
              {homeScore ?? '—'}
            </div>
          ) : (
            <div className="text-sb-muted font-bold text-sm">VS</div>
          )}
        </div>

        <div className="flex items-center gap-2.5 min-w-0 justify-end text-right">
          <div className="min-w-0">
            <div className="text-sb-text font-extrabold text-sm truncate">
              {game.home.name}
            </div>
            <div className="text-[0.65rem] text-sb-muted">Home</div>
          </div>
          {game.home.logo ? (
            <img
              src={game.home.logo}
              alt={game.home.name}
              className="w-9 h-9 object-contain flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-sb-blue/10 border border-sb-blue/30 flex items-center justify-center text-[0.6rem] font-extrabold text-sb-blue">
              {game.home.abbr}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {hasMl && (
          <div className="flex flex-col gap-2">
            <span className="text-[0.65rem] font-bold text-sb-muted tracking-widest uppercase">
              Moneyline
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pickButtonClass(
                  isSel(MARKET_KEYS.H2H, awayMlLabel),
                  closed,
                )}
                disabled={closed}
                onClick={() =>
                  fire({
                    gameId: String(game.id),
                    leagueId: 'nba',
                    sport: 'basketball',
                    marketKey: MARKET_KEYS.H2H,
                    selectionId: `nba-${game.id}-h2h-away`,
                    outcomeLabel: awayMlLabel,
                    odds: awayOdds,
                    lineValue: null,
                    gameName: `${game.away.abbr} @ ${game.home.abbr}`,
                    betType: 'Moneyline',
                    betTeam: game.away.name,
                  })
                }
              >
                <span className="block">{awayMlLabel}</span>
                <span className="block text-sb-blue">{awayOdds}</span>
              </button>
              <button
                type="button"
                className={pickButtonClass(
                  isSel(MARKET_KEYS.H2H, homeMlLabel),
                  closed,
                )}
                disabled={closed}
                onClick={() =>
                  fire({
                    gameId: String(game.id),
                    leagueId: 'nba',
                    sport: 'basketball',
                    marketKey: MARKET_KEYS.H2H,
                    selectionId: `nba-${game.id}-h2h-home`,
                    outcomeLabel: homeMlLabel,
                    odds: homeOdds,
                    lineValue: null,
                    gameName: `${game.away.abbr} @ ${game.home.abbr}`,
                    betType: 'Moneyline',
                    betTeam: game.home.name,
                  })
                }
              >
                <span className="block">{homeMlLabel}</span>
                <span className="block text-sb-blue">{homeOdds}</span>
              </button>
            </div>
          </div>
        )}

        {hasSpread && (
          <div className="flex flex-col gap-2">
            <span className="text-[0.65rem] font-bold text-sb-muted tracking-widest uppercase">
              Spread
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pickButtonClass(
                  isSel(
                    MARKET_KEYS.SPREADS,
                    `${game.away.abbr} ${formatSpreadLine(awaySpreadLine)}`,
                  ),
                  closed,
                )}
                disabled={closed}
                onClick={() =>
                  fire({
                    gameId: String(game.id),
                    leagueId: 'nba',
                    sport: 'basketball',
                    marketKey: MARKET_KEYS.SPREADS,
                    selectionId: `nba-${game.id}-spreads-away`,
                    outcomeLabel: `${game.away.abbr} ${formatSpreadLine(awaySpreadLine)}`,
                    odds: spreadAwayOdds,
                    lineValue: awaySpreadLine,
                    gameName: `${game.away.abbr} @ ${game.home.abbr}`,
                    betType: 'Spread',
                    betTeam: game.away.name,
                  })
                }
              >
                <span className="block">{game.away.abbr}</span>
                <span className="block">{formatSpreadLine(awaySpreadLine)}</span>
                <span className="block text-sb-blue">{spreadAwayOdds}</span>
              </button>
              <button
                type="button"
                className={pickButtonClass(
                  isSel(
                    MARKET_KEYS.SPREADS,
                    `${game.home.abbr} ${formatSpreadLine(homeSpreadLine)}`,
                  ),
                  closed,
                )}
                disabled={closed}
                onClick={() =>
                  fire({
                    gameId: String(game.id),
                    leagueId: 'nba',
                    sport: 'basketball',
                    marketKey: MARKET_KEYS.SPREADS,
                    selectionId: `nba-${game.id}-spreads-home`,
                    outcomeLabel: `${game.home.abbr} ${formatSpreadLine(homeSpreadLine)}`,
                    odds: spreadHomeOdds,
                    lineValue: homeSpreadLine,
                    gameName: `${game.away.abbr} @ ${game.home.abbr}`,
                    betType: 'Spread',
                    betTeam: game.home.name,
                  })
                }
              >
                <span className="block">{game.home.abbr}</span>
                <span className="block">{formatSpreadLine(homeSpreadLine)}</span>
                <span className="block text-sb-blue">{spreadHomeOdds}</span>
              </button>
            </div>
          </div>
        )}

        {hasTotal && (
          <div className="flex flex-col gap-2">
            <span className="text-[0.65rem] font-bold text-sb-muted tracking-widest uppercase">
              Total ({totalLine})
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pickButtonClass(
                  isSel(MARKET_KEYS.TOTALS, `Over ${totalLine}`),
                  closed,
                )}
                disabled={closed}
                onClick={() =>
                  fire({
                    gameId: String(game.id),
                    leagueId: 'nba',
                    sport: 'basketball',
                    marketKey: MARKET_KEYS.TOTALS,
                    selectionId: `nba-${game.id}-totals-over`,
                    outcomeLabel: `Over ${totalLine}`,
                    odds: overOdds,
                    lineValue: totalLine,
                    gameName: `${game.away.abbr} @ ${game.home.abbr}`,
                    betType: 'Over/Under',
                    betTeam: '',
                  })
                }
              >
                <span className="block">Over</span>
                <span className="block text-sb-blue">{overOdds}</span>
              </button>
              <button
                type="button"
                className={pickButtonClass(
                  isSel(MARKET_KEYS.TOTALS, `Under ${totalLine}`),
                  closed,
                )}
                disabled={closed}
                onClick={() =>
                  fire({
                    gameId: String(game.id),
                    leagueId: 'nba',
                    sport: 'basketball',
                    marketKey: MARKET_KEYS.TOTALS,
                    selectionId: `nba-${game.id}-totals-under`,
                    outcomeLabel: `Under ${totalLine}`,
                    odds: underOdds,
                    lineValue: totalLine,
                    gameName: `${game.away.abbr} @ ${game.home.abbr}`,
                    betType: 'Over/Under',
                    betTeam: '',
                  })
                }
              >
                <span className="block">Under</span>
                <span className="block text-sb-blue">{underOdds}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function NBABets() {
  const { toggleSelection, pruneSelectionsForGames, selections } =
    useGlobalBetSlip();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('games');
  const [statusFilter, setStatusFilter] = useState('all');
  const weekRangeLabel = useMemo(() => {
    const keys = getNbaWeekDateKeys(new Date());
    if (keys.length < 2) return '';
    const start = keys[0];
    const end = keys[6];
    const fmt = (ymd) => {
      const y = Number(ymd.slice(0, 4));
      const m = Number(ymd.slice(4, 6)) - 1;
      const day = Number(ymd.slice(6, 8));
      return new Date(y, m, day);
    };
    const a = fmt(start);
    const b = fmt(end);
    const sameMonth = a.getMonth() === b.getMonth();
    const left = a.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const right = b.toLocaleDateString(
      undefined,
      sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' },
    );
    return `${left} – ${right}`;
  }, []);

  useEffect(() => {
    let alive = true;
    async function load(isInitial) {
      if (isInitial) setLoading(true);
      setError('');
      try {
        const result = await fetchNbaScoreboardWeek();
        if (!alive) return;
        setGames(result);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        if (isInitial) setError('Failed to load NBA matchups from ESPN.');
      } finally {
        if (alive && isInitial) setLoading(false);
      }
    }
    load(true);
    // Live scores + status refresh every 60s
    const id = window.setInterval(() => load(false), 60000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (games.length > 0) {
      pruneSelectionsForGames(games);
    }
  }, [games, pruneSelectionsForGames]);

  const classifiedGames = useMemo(
    () => games.map((g) => ({ game: g, cls: classifyGameFromGame(g) })),
    [games],
  );

  const liveCount = useMemo(
    () => classifiedGames.filter(({ cls }) => cls === 'live').length,
    [classifiedGames],
  );

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classifiedGames
      .filter(({ game, cls }) => {
        const matchesStatus =
          statusFilter === 'all' || statusFilter === cls;
        const matchesSearch =
          !q ||
          game.home.abbr.toLowerCase().includes(q) ||
          game.away.abbr.toLowerCase().includes(q) ||
          game.home.name.toLowerCase().includes(q) ||
          game.away.name.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      })
      .map(({ game }) => game);
  }, [classifiedGames, search, statusFilter]);

  const gamesByDay = useMemo(() => {
    const sections = [];
    let currentKey = null;
    let bucket = [];
    for (const g of filteredGames) {
      const key = daySortKey(g.startDate) || 'unknown';
      if (key !== currentKey) {
        if (bucket.length) {
          sections.push({
            dayKey: currentKey,
            heading: formatDayHeading(bucket[0].startDate),
            games: bucket,
          });
        }
        currentKey = key;
        bucket = [g];
      } else {
        bucket.push(g);
      }
    }
    if (bucket.length) {
      sections.push({
        dayKey: currentKey,
        heading: formatDayHeading(bucket[0].startDate),
        games: bucket,
      });
    }
    return sections;
  }, [filteredGames]);

  return (
    <div className="text-sb-text pb-48">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-3xl font-extrabold tracking-wide">🏀 NBA</h1>
        <span className="text-[0.7rem] font-bold tracking-widest uppercase border border-sb-blue/50 text-sb-blue px-3 py-1.5 rounded-full bg-sb-bg/60">
          🔄 Live games & odds • ESPN + DraftKings
        </span>
        {weekRangeLabel ? (
          <span className="text-sb-muted text-sm font-semibold">
            {weekRangeLabel}
          </span>
        ) : null}
        {loading && <span className="text-sb-muted text-sm">Loading…</span>}
        {selections.length > 0 ? (
          <span className="text-[0.7rem] font-extrabold tracking-widest uppercase border border-[#00f6ff]/40 text-[#00f6ff] px-3 py-1.5 rounded-full bg-[#00f6ff]/10">
            Bet slip: {selections.length} pick
            {selections.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      {tab === 'games' && (
        <p className="text-sb-muted text-sm mb-4 m-0">
          Tap <span className="text-sb-text font-semibold">Moneyline</span>,{' '}
          <span className="text-sb-text font-semibold">Spread</span>, or{' '}
          <span className="text-sb-text font-semibold">Total</span> on a game —
          the bet slip opens at the bottom of the screen.
        </p>
      )}

      <div className="flex gap-2 mb-6 border-b border-sb-border flex-wrap">
        <button
          type="button"
          onClick={() => setTab('games')}
          className={
            tab === 'games'
              ? 'px-4 py-2 text-xs font-extrabold rounded-t-xl bg-sb-blue text-sb-dark border-x border-t border-sb-blue'
              : 'px-4 py-2 text-xs font-extrabold rounded-t-xl bg-transparent text-sb-muted hover:text-sb-blue hover:border-t hover:border-sb-blue border border-transparent'
          }
        >
          Matchups
        </button>
        <button
          type="button"
          onClick={() => setTab('futures')}
          className={
            tab === 'futures'
              ? 'px-4 py-2 text-xs font-extrabold rounded-t-xl bg-sb-blue text-sb-dark border-x border-t border-sb-blue'
              : 'px-4 py-2 text-xs font-extrabold rounded-t-xl bg-transparent text-sb-muted hover:text-sb-blue hover:border-t hover:border-sb-blue border border-transparent'
          }
        >
          Futures
        </button>
      </div>

      {tab === 'games' && (
        <>
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by team…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-sb-bg border border-sb-border rounded-xl px-4 py-2 text-sb-text text-sm outline-none focus:border-sb-blue focus:ring-1 focus:ring-sb-blue w-[260px]"
            />
            <div className="ml-auto text-sb-muted text-sm">
              {filteredGames.length} game{filteredGames.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'live', 'upcoming', 'finished'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  border: statusFilter === f ? '1px solid #00f6ff' : '1px solid #404040',
                  background: statusFilter === f ? 'rgba(0,246,255,0.1)' : '#11131a',
                  color: statusFilter === f ? '#00f6ff' : '#9ca3af',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.18s',
                  textTransform: 'capitalize',
                }}
              >
                {f === 'live' && liveCount > 0 ? `Live (${liveCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {error && <p className="text-sb-error">{error}</p>}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-sb-border bg-sb-bg/60 p-4 animate-pulse"
                >
                  <div className="h-4 w-[60%] bg-sb-muted/40 rounded mb-3" />
                  <div className="h-4 w-[80%] bg-sb-muted/30 rounded mb-2" />
                  <div className="h-20 w-full bg-sb-muted/20 rounded" />
                </div>
              ))}
            </div>
          ) : filteredGames.length === 0 ? (
            <p className="text-sb-muted">No matchups found.</p>
          ) : (
            <div className="flex flex-col gap-8">
              {gamesByDay.map(({ dayKey, heading, games: dayGames }) => (
                <section key={dayKey || heading}>
                  <h2 className="text-sm font-extrabold tracking-widest uppercase text-sb-muted border-b border-sb-border pb-2 mb-4">
                    {heading}
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {dayGames.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onToggleBet={toggleSelection}
                        selectedBets={selections}
                        bettingClosed={isBettingClosed(game)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'futures' && (
        <div className="flex flex-col gap-8">
          {NBA_FUTURES.map((category) => (
            <section key={category.key}>
              <h2 className="text-sm font-extrabold tracking-widest uppercase text-sb-muted border-b border-sb-border pb-2 mb-4">
                {category.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {category.picks.map((pick) => {
                  const isSelected = selections.some(
                    (s) => s.selectionId === pick.id,
                  );
                  return (
                    <button
                      key={pick.id}
                      type="button"
                      className={pickButtonClass(isSelected, false)}
                      onClick={() =>
                        toggleSelection({
                          gameId: `nba-futures-${category.key}`,
                          leagueId: 'nba',
                          sport: 'basketball',
                          marketKey: `futures_${category.key}`,
                          selectionId: pick.id,
                          outcomeLabel: pick.label,
                          odds: pick.odds,
                          lineValue: null,
                          gameName: category.title,
                          betType: 'Futures',
                          betTeam: pick.label,
                        })
                      }
                    >
                      <span className="block">{pick.label}</span>
                      <span className="block text-sb-blue">
                        {pick.odds.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
