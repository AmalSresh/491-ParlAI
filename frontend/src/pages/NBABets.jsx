import { useEffect, useMemo, useState } from 'react';
import { useGlobalBetSlip } from '../context/BetSlipContext';
import {
  MARKET_KEYS,
  formatSpreadLine,
  isBettingClosed,
} from '../utils/betPayload.js';

function formatKickoff(isoOrDate) {
  if (!isoOrDate) return '—';
  const dt = new Date(isoOrDate);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDayHeading(isoOrDate) {
  if (!isoOrDate) return 'Date TBA';
  const dt = new Date(isoOrDate);
  if (Number.isNaN(dt.getTime())) return 'Date TBA';
  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function daySortKey(isoOrDate) {
  if (!isoOrDate) return '';
  const dt = new Date(isoOrDate);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toDateString();
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

function toAbbr(teamName) {
  if (!teamName) return '—';
  const parts = String(teamName).trim().split(/\s+/);
  const last = parts[parts.length - 1] || '';
  return last.length <= 4 ? last.toUpperCase() : last.slice(0, 3).toUpperCase();
}

function formatDecimalOdds(odds) {
  const n = Number(odds);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return n.toFixed(2);
}

function getMarket(game, key) {
  return (game.markets || []).find((m) => m.type === key) || null;
}

function getSelections(market) {
  return Array.isArray(market?.selections) ? market.selections : [];
}

function GameCard({ game, onToggleBet, selectedBets, bettingClosed }) {
  const homeScore = game.scores?.home ?? null;
  const awayScore = game.scores?.away ?? null;
  const isFinal = String(game.status || '').toLowerCase() === 'completed';
  const closed = bettingClosed || isFinal;

  const awayAbbr = toAbbr(game.awayTeam);
  const homeAbbr = toAbbr(game.homeTeam);

  const isSel = (marketKey, selectionId) =>
    selectedBets.some(
      (b) =>
        b.gameId === game.id &&
        b.marketKey === marketKey &&
        String(b.selectionId) === String(selectionId),
    );

  const fire = (payload) => {
    if (closed || !onToggleBet) return;
    onToggleBet(payload);
  };

  const h2h = getMarket(game, MARKET_KEYS.H2H);
  const spreads = getMarket(game, MARKET_KEYS.SPREADS);
  const totals = getMarket(game, MARKET_KEYS.TOTALS);

  const h2hSel = getSelections(h2h);
  const spreadsSel = getSelections(spreads);
  const totalsSel = getSelections(totals);

  const h2hAway = h2hSel.find((s) => s.label === game.awayTeam) || null;
  const h2hHome = h2hSel.find((s) => s.label === game.homeTeam) || null;

  const spreadAway = spreadsSel.find((s) => s.label === game.awayTeam) || null;
  const spreadHome = spreadsSel.find((s) => s.label === game.homeTeam) || null;

  const totalOver =
    totalsSel.find((s) =>
      String(s.label || '')
        .toLowerCase()
        .includes('over'),
    ) || null;
  const totalUnder =
    totalsSel.find((s) =>
      String(s.label || '')
        .toLowerCase()
        .includes('under'),
    ) || null;
  const totalLine = totalOver?.lineValue ?? totalUnder?.lineValue ?? null;

  return (
    <div className="rounded-xl border border-sb-border bg-sb-bg/60 overflow-hidden">
      <div className="p-4 border-b border-sb-border flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-widest text-sb-muted font-bold">
            {game.league?.name || 'NBA'}
          </div>
          <div className="text-sb-text font-extrabold text-lg mt-1">
            {awayAbbr} @ {homeAbbr}
          </div>
          <div className="text-sb-muted text-sm mt-1">
            {formatKickoff(game.startTime)} •{' '}
            {String(game.status || '—').toUpperCase()}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sb-muted text-xs font-bold">{homeAbbr}</div>
            <div
              className={`text-2xl font-extrabold ${isFinal ? 'text-sb-text' : 'text-sb-blue'}`}
            >
              {homeScore !== null ? homeScore : '—'}
            </div>
          </div>
          <div className="text-left">
            <div className="text-sb-muted text-xs font-bold">{awayAbbr}</div>
            <div
              className={`text-2xl font-extrabold ${isFinal ? 'text-sb-text' : 'text-sb-blue'}`}
            >
              {awayScore !== null ? awayScore : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-sb-border/80">
        <div className="text-sb-text font-extrabold text-sm">
          {game.awayTeam} vs {game.homeTeam}
        </div>
        <div className="text-sb-muted text-xs mt-1">
          Tip-off: {formatKickoff(game.startTime)}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[0.65rem] font-bold text-sb-muted tracking-widest uppercase">
            Moneyline
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={pickButtonClass(
                isSel(MARKET_KEYS.H2H, h2hAway?.id),
                closed || !h2hAway,
              )}
              disabled={closed || !h2hAway}
              onClick={() =>
                h2hAway
                  ? fire({
                      gameId: game.id,
                      leagueId: game.league?.id,
                      sport: game.league?.sport || 'basketball',
                      marketKey: MARKET_KEYS.H2H,
                      selectionId: h2hAway.id,
                      outcomeLabel: h2hAway.label,
                      odds: Number(h2hAway.odds),
                      lineValue: null,
                      gameName: `${awayAbbr} @ ${homeAbbr}`,
                      betType: 'Moneyline',
                      betTeam: game.awayTeam,
                    })
                  : null
              }
            >
              <span className="block">{awayAbbr}</span>
              <span className="block text-sb-blue">
                {formatDecimalOdds(h2hAway?.odds)}
              </span>
            </button>
            <button
              type="button"
              className={pickButtonClass(
                isSel(MARKET_KEYS.H2H, h2hHome?.id),
                closed || !h2hHome,
              )}
              disabled={closed || !h2hHome}
              onClick={() =>
                h2hHome
                  ? fire({
                      gameId: game.id,
                      leagueId: game.league?.id,
                      sport: game.league?.sport || 'basketball',
                      marketKey: MARKET_KEYS.H2H,
                      selectionId: h2hHome.id,
                      outcomeLabel: h2hHome.label,
                      odds: Number(h2hHome.odds),
                      lineValue: null,
                      gameName: `${awayAbbr} @ ${homeAbbr}`,
                      betType: 'Moneyline',
                      betTeam: game.homeTeam,
                    })
                  : null
              }
            >
              <span className="block">{homeAbbr}</span>
              <span className="block text-sb-blue">
                {formatDecimalOdds(h2hHome?.odds)}
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[0.65rem] font-bold text-sb-muted tracking-widest uppercase">
            Spread
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={pickButtonClass(
                isSel(MARKET_KEYS.SPREADS, spreadAway?.id),
                closed || !spreadAway,
              )}
              disabled={closed || !spreadAway}
              onClick={() =>
                spreadAway
                  ? fire({
                      gameId: game.id,
                      leagueId: game.league?.id,
                      sport: game.league?.sport || 'basketball',
                      marketKey: MARKET_KEYS.SPREADS,
                      selectionId: spreadAway.id,
                      outcomeLabel: `${awayAbbr} ${formatSpreadLine(spreadAway.lineValue)}`,
                      odds: Number(spreadAway.odds),
                      lineValue: spreadAway.lineValue ?? null,
                      gameName: `${awayAbbr} @ ${homeAbbr}`,
                      betType: 'Spread',
                      betTeam: game.awayTeam,
                    })
                  : null
              }
            >
              <span className="block">{awayAbbr}</span>
              <span className="block">
                {spreadAway?.lineValue != null
                  ? formatSpreadLine(spreadAway.lineValue)
                  : '—'}
              </span>
              <span className="block text-sb-blue">
                {formatDecimalOdds(spreadAway?.odds)}
              </span>
            </button>
            <button
              type="button"
              className={pickButtonClass(
                isSel(MARKET_KEYS.SPREADS, spreadHome?.id),
                closed || !spreadHome,
              )}
              disabled={closed || !spreadHome}
              onClick={() =>
                spreadHome
                  ? fire({
                      gameId: game.id,
                      leagueId: game.league?.id,
                      sport: game.league?.sport || 'basketball',
                      marketKey: MARKET_KEYS.SPREADS,
                      selectionId: spreadHome.id,
                      outcomeLabel: `${homeAbbr} ${formatSpreadLine(spreadHome.lineValue)}`,
                      odds: Number(spreadHome.odds),
                      lineValue: spreadHome.lineValue ?? null,
                      gameName: `${awayAbbr} @ ${homeAbbr}`,
                      betType: 'Spread',
                      betTeam: game.homeTeam,
                    })
                  : null
              }
            >
              <span className="block">{homeAbbr}</span>
              <span className="block">
                {spreadHome?.lineValue != null
                  ? formatSpreadLine(spreadHome.lineValue)
                  : '—'}
              </span>
              <span className="block text-sb-blue">
                {formatDecimalOdds(spreadHome?.odds)}
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[0.65rem] font-bold text-sb-muted tracking-widest uppercase">
            Total{totalLine != null ? ` (${totalLine})` : ''}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={pickButtonClass(
                isSel(MARKET_KEYS.TOTALS, totalOver?.id),
                closed || !totalOver,
              )}
              disabled={closed || !totalOver}
              onClick={() =>
                totalOver
                  ? fire({
                      gameId: game.id,
                      leagueId: game.league?.id,
                      sport: game.league?.sport || 'basketball',
                      marketKey: MARKET_KEYS.TOTALS,
                      selectionId: totalOver.id,
                      outcomeLabel:
                        totalLine != null
                          ? `Over ${totalLine}`
                          : totalOver.label,
                      odds: Number(totalOver.odds),
                      lineValue: totalOver.lineValue ?? null,
                      gameName: `${awayAbbr} @ ${homeAbbr}`,
                      betType: 'Over/Under',
                      betTeam: '',
                    })
                  : null
              }
            >
              <span className="block">Over</span>
              <span className="block text-sb-blue">
                {formatDecimalOdds(totalOver?.odds)}
              </span>
            </button>
            <button
              type="button"
              className={pickButtonClass(
                isSel(MARKET_KEYS.TOTALS, totalUnder?.id),
                closed || !totalUnder,
              )}
              disabled={closed || !totalUnder}
              onClick={() =>
                totalUnder
                  ? fire({
                      gameId: game.id,
                      leagueId: game.league?.id,
                      sport: game.league?.sport || 'basketball',
                      marketKey: MARKET_KEYS.TOTALS,
                      selectionId: totalUnder.id,
                      outcomeLabel:
                        totalLine != null
                          ? `Under ${totalLine}`
                          : totalUnder.label,
                      odds: Number(totalUnder.odds),
                      lineValue: totalUnder.lineValue ?? null,
                      gameName: `${awayAbbr} @ ${homeAbbr}`,
                      betType: 'Over/Under',
                      betTeam: '',
                    })
                  : null
              }
            >
              <span className="block">Under</span>
              <span className="block text-sb-blue">
                {formatDecimalOdds(totalUnder?.odds)}
              </span>
            </button>
          </div>
        </div>
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
  const weekRangeLabel = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 2);
    const end = new Date();
    end.setDate(end.getDate() + 14);
    const left = start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const right = end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    return `${left} – ${right}`;
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const start = new Date();
        start.setDate(start.getDate() - 2);
        const end = new Date();
        end.setDate(end.getDate() + 14);

        const qs = [
          `leagueName=${encodeURIComponent('NBA')}`,
          `sport=${encodeURIComponent('basketball')}`,
          `startDate=${encodeURIComponent(start.toISOString())}`,
          `endDate=${encodeURIComponent(end.toISOString())}`,
        ].join('&');

        const res = await fetch(`/api/getGames?${qs}`);
        if (!res.ok)
          throw new Error(`Failed to load NBA games (${res.status})`);
        const result = await res.json();
        if (!alive) return;
        setGames(result);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError(e?.message || 'Failed to load NBA games.');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (games.length > 0) {
      pruneSelectionsForGames(games);
    }
  }, [games, pruneSelectionsForGames]);

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => {
      return (
        String(g.homeTeam || '')
          .toLowerCase()
          .includes(q) ||
        String(g.awayTeam || '')
          .toLowerCase()
          .includes(q) ||
        String(g.league?.name || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [games, search]);

  const gamesByDay = useMemo(() => {
    const sections = [];
    let currentKey = null;
    let bucket = [];
    for (const g of filteredGames) {
      const key = daySortKey(g.startTime) || 'unknown';
      if (key !== currentKey) {
        if (bucket.length) {
          sections.push({
            dayKey: currentKey,
            heading: formatDayHeading(bucket[0].startTime),
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
        heading: formatDayHeading(bucket[0].startTime),
        games: bucket,
      });
    }
    return sections;
  }, [filteredGames]);

  return (
    <div className={`text-sb-text ${tab === 'games' ? 'pb-48' : ''}`}>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-3xl font-extrabold tracking-wide">🏀 NBA</h1>
        <span className="text-[0.7rem] font-bold tracking-widest uppercase border border-sb-blue/50 text-sb-blue px-3 py-1.5 rounded-full bg-sb-bg/60">
          🔎 This week (Sun–Sat) • ESPN
        </span>
        {weekRangeLabel ? (
          <span className="text-sb-muted text-sm font-semibold">
            {weekRangeLabel}
          </span>
        ) : null}
        {loading && <span className="text-sb-muted text-sm">Loading…</span>}
      </div>

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
        <div className="rounded-xl border border-sb-border bg-sb-bg/60 p-5">
          <h2 className="text-lg font-extrabold text-sb-text m-0">
            Futures & awards
          </h2>
          <p className="text-sb-muted text-sm mt-2 m-0">
            ESPN’s NBA scoreboard endpoint provides matchups and scores, but it
            doesn’t include futures/awards markets. Connect your existing odds
            API (or futures endpoint) and we’ll render them here.
          </p>
        </div>
      )}
    </div>
  );
}
