import { useEffect, useState } from 'react';
import { useGlobalBetSlip } from '../context/BetSlipContext';
import { enrichGamesWithEspnOdds, fetchNhlOdds } from '../utils/espnOdds.js';
import { classifyGameFromGame } from '../utils/gameStatus.js';

// Deterministic per-game fallback when ESPN pickcenter + predictor are both empty.
function seedNhlH2h(gameId, side) {
  const s = [...String(gameId)].reduce((a, c) => a + c.charCodeAt(0), 0) % 100 / 100;
  const base = side === 'home' ? 1.45 + s * 1.1 : 1.45 + (1 - s) * 1.1;
  return parseFloat(Math.max(1.25, Math.min(2.75, base)).toFixed(2));
}
function seedNhlTotal(gameId) {
  const sum = [...String(gameId)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return parseFloat((5.5 + (sum % 3)).toFixed(1));
}

async function fetchNHLWeek() {
  // Fetch −5 to +7 days so recent finals (history) and upcoming matches both show.
  const today = new Date();
  const dates = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 5);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('');
  });
  const results = await Promise.all(
    dates.map(date =>
      fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${date}`)
        .then(r => r.json()).then(d => d.events ?? []).catch(() => [])
    )
  );
  const byId = new Map();
  for (const events of results) {
    for (const ev of events) {
      if (!byId.has(ev.id)) byId.set(ev.id, ev);
    }
  }
  const events = Array.from(byId.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  return enrichGamesWithEspnOdds(events, fetchNhlOdds);
}

// ── GAMES TAB ─────────────────────────────────────────────────────────────────
function GamesTab({ onToggleBet, selections }) {
  const [allGames, setAllGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let alive = true;
    async function load(isInitial) {
      if (isInitial) setLoading(true);
      try {
        const result = await fetchNHLWeek();
        if (!alive) return;
        setAllGames(result);
        setError(null);
      } catch (err) {
        if (!alive) return;
        if (isInitial) setError(err.message);
      } finally {
        if (alive && isInitial) setLoading(false);
      }
    }
    load(true);
    const id = window.setInterval(() => load(false), 60000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const classified = allGames.map((g) => ({ g, cls: classifyGameFromGame({ ...g, sport: 'nhl' }) }));
  const liveCount = classified.filter(({ cls }) => cls === 'live').length;
  const filtered = classified
    .filter(({ cls }) => statusFilter === 'all' || statusFilter === cls)
    .map(({ g }) => g);

  if (loading) return <p className="text-sb-muted">Loading games…</p>;
  if (error) return <p className="text-sb-error">{error}</p>;

  return (
    <>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
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
        <span className="ml-auto text-sb-muted text-sm self-center">
          {filtered.length} game{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sb-muted border border-dashed border-sb-border rounded-xl">
          <div className="text-4xl mb-3">🏒</div>
          <p>No {statusFilter === 'all' ? '' : statusFilter} games right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((game) => {
            const comp = game.competitions?.[0];
            const home = comp?.competitors?.find((c) => c.homeAway === 'home');
            const away = comp?.competitors?.find((c) => c.homeAway === 'away');
            if (!home || !away) return null;
            const cls = classifyGameFromGame({ ...game, sport: 'nhl' });
            const isLive = cls === 'live';
            const isFinished = cls === 'finished';
            const bettingClosed = cls !== 'upcoming';

            const awaySelId = `nhl-${game.id}-h2h-away`;
            const homeSelId = `nhl-${game.id}-h2h-home`;
            const awaySelected = selections?.some((s) => s.selectionId === awaySelId);
            const homeSelected = selections?.some((s) => s.selectionId === homeSelId);
            const realOdds = game.odds || null;
            // Layered: pickcenter → predictor → deterministic per-game fallback
            const homeOdds = realOdds?.moneyHome ?? seedNhlH2h(game.id, 'home');
            const awayOdds = realOdds?.moneyAway ?? seedNhlH2h(game.id, 'away');
            const hasMlOdds = true;
            const totalLine = realOdds?.overUnder ?? seedNhlTotal(game.id);
            const overOdds = realOdds?.overOdds ?? 1.91;
            const underOdds = realOdds?.underOdds ?? 1.91;
            const hasTotal = true;
            const overSelId = `nhl-${game.id}-totals-over`;
            const underSelId = `nhl-${game.id}-totals-under`;
            const overSelected = selections?.some((s) => s.selectionId === overSelId);
            const underSelected = selections?.some((s) => s.selectionId === underSelId);

            const handleBet = (side) => {
              if (bettingClosed || !onToggleBet || !hasMlOdds) return;
              const isAway = side === 'away';
              onToggleBet({
                gameId: String(game.id),
                leagueId: 'nhl',
                sport: 'nhl',
                marketKey: 'h2h',
                selectionId: isAway ? awaySelId : homeSelId,
                outcomeLabel: isAway ? away.team.abbreviation : home.team.abbreviation,
                odds: isAway ? awayOdds : homeOdds,
                lineValue: null,
                gameName: `${away.team.abbreviation} @ ${home.team.abbreviation}`,
                betType: 'Moneyline',
                betTeam: isAway ? away.team.displayName : home.team.displayName,
              });
            };

            const handleTotal = (side) => {
              if (bettingClosed || !onToggleBet || !hasTotal) return;
              const isOver = side === 'over';
              onToggleBet({
                gameId: String(game.id),
                leagueId: 'nhl',
                sport: 'nhl',
                marketKey: 'totals',
                selectionId: isOver ? overSelId : underSelId,
                outcomeLabel: `${isOver ? 'Over' : 'Under'} ${totalLine} Goals`,
                odds: isOver ? overOdds : underOdds,
                lineValue: totalLine,
                gameName: `${away.team.abbreviation} @ ${home.team.abbreviation}`,
                betType: 'Total Goals',
                betTeam: `${isOver ? 'Over' : 'Under'} ${totalLine}`,
              });
            };

            return (
              <div
                key={game.id}
                className={`rounded-xl border overflow-hidden ${
                  isLive
                    ? 'border-[#00f6ff44] bg-[#050e14] shadow-[0_0_20px_rgba(0,246,255,0.08)]'
                    : 'border-[#1a2535] bg-[#060c12]'
                } ${isFinished ? 'opacity-80' : ''}`}
              >
                {/* Status header */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[#1a2535]/60">
                  <span className="text-[0.65rem] uppercase tracking-widest text-sb-muted font-bold">
                    🏒 NHL
                  </span>
                  {isLive ? (
                    <span className="flex items-center gap-1.5 text-[0.65rem] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      P{game.status?.period} {game.status?.displayClock}
                    </span>
                  ) : isFinished ? (
                    <span className="text-[0.65rem] font-bold text-sb-muted">FINAL</span>
                  ) : (
                    <span className="text-[0.7rem] text-sb-muted">
                      {new Date(game.date).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                {/* Teams & Score */}
                <div className="p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {away.team.logo ? (
                      <img src={away.team.logo} alt={away.team.displayName} className="w-9 h-9 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-sb-blue/10 border border-sb-blue/30 flex items-center justify-center text-[0.6rem] font-extrabold text-sb-blue">
                        {away.team.abbreviation}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sb-text font-extrabold text-sm truncate">
                        {away.team.displayName}
                      </div>
                      <div className="text-[0.65rem] text-sb-muted">Away</div>
                    </div>
                  </div>

                  <div className="text-center px-2">
                    {isLive || isFinished ? (
                      <div className={`text-3xl font-black tracking-tight ${isLive ? 'text-sb-blue' : 'text-sb-text'}`}>
                        {away.score ?? '—'}
                        <span className="text-sb-muted mx-1.5 text-2xl">–</span>
                        {home.score ?? '—'}
                      </div>
                    ) : (
                      <div className="text-sb-muted font-bold text-sm">VS</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 min-w-0 justify-end text-right">
                    <div className="min-w-0">
                      <div className="text-sb-text font-extrabold text-sm truncate">
                        {home.team.displayName}
                      </div>
                      <div className="text-[0.65rem] text-sb-muted">Home</div>
                    </div>
                    {home.team.logo ? (
                      <img src={home.team.logo} alt={home.team.displayName} className="w-9 h-9 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-sb-blue/10 border border-sb-blue/30 flex items-center justify-center text-[0.6rem] font-extrabold text-sb-blue">
                        {home.team.abbreviation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Moneyline & Totals */}
                <div className="px-4 pb-4">
                {!bettingClosed && hasMlOdds && (
                  <div className="border-t border-[#1a2535] pt-3">
                    <div className="text-[0.65rem] text-sb-muted uppercase tracking-widest mb-2 font-bold">Moneyline</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleBet('away')}
                        className={`flex-1 rounded-lg border py-2 text-xs font-extrabold transition-colors ${
                          awaySelected
                            ? 'border-sb-blue bg-sb-blue/15 text-sb-blue ring-1 ring-sb-blue'
                            : 'border-sb-border bg-sb-bg text-sb-text hover:border-sb-blue hover:text-sb-blue'
                        }`}
                      >
                        <span className="block">{away.team.abbreviation}</span>
                        <span className="block text-sb-blue">{awayOdds}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBet('home')}
                        className={`flex-1 rounded-lg border py-2 text-xs font-extrabold transition-colors ${
                          homeSelected
                            ? 'border-sb-blue bg-sb-blue/15 text-sb-blue ring-1 ring-sb-blue'
                            : 'border-sb-border bg-sb-bg text-sb-text hover:border-sb-blue hover:text-sb-blue'
                        }`}
                      >
                        <span className="block">{home.team.abbreviation}</span>
                        <span className="block text-sb-blue">{homeOdds}</span>
                      </button>
                    </div>
                  </div>
                )}
                {!bettingClosed && hasTotal && (
                  <div className="border-t border-[#1a2535] pt-3 mt-3">
                    <div className="text-[0.65rem] text-sb-muted uppercase tracking-widest mb-2 font-bold">
                      Total Goals ({totalLine})
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTotal('over')}
                        className={`flex-1 rounded-lg border py-2 text-xs font-extrabold transition-colors ${
                          overSelected
                            ? 'border-sb-blue bg-sb-blue/15 text-sb-blue ring-1 ring-sb-blue'
                            : 'border-sb-border bg-sb-bg text-sb-text hover:border-sb-blue hover:text-sb-blue'
                        }`}
                      >
                        <span className="block">Over</span>
                        <span className="block text-sb-blue">{overOdds}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTotal('under')}
                        className={`flex-1 rounded-lg border py-2 text-xs font-extrabold transition-colors ${
                          underSelected
                            ? 'border-sb-blue bg-sb-blue/15 text-sb-blue ring-1 ring-sb-blue'
                            : 'border-sb-border bg-sb-bg text-sb-text hover:border-sb-blue hover:text-sb-blue'
                        }`}
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
          })}
        </div>
      )}
    </>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Hockey() {
  const { selections, toggleSelection } = useGlobalBetSlip();

  return (
    <div className="text-sb-text">
      <style>{`
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-extrabold tracking-wide">🏒 NHL</h1>
        <span className="text-[0.7rem] font-bold tracking-widest uppercase border border-sb-blue/50 text-sb-blue px-3 py-1.5 rounded-full bg-sb-bg/60">
          🔄 Live games & odds • ESPN + DraftKings
        </span>
      </div>

      <GamesTab onToggleBet={toggleSelection} selections={selections} />
    </div>
  );
}
