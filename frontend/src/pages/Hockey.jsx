import { useEffect, useState } from 'react';
import { useGlobalBetSlip } from '../context/BetSlipContext';
import { enrichGamesWithEspnOdds, fetchNhlOdds } from '../utils/espnOdds.js';
import { classifyGameFromGame } from '../utils/gameStatus.js';

const API_BASE = '/api';

// ── TEAM COLORS ───────────────────────────────────────────────────────────────
const TEAM_COLORS = {
  EDM: '#FF4C00',
  COL: '#6F263D',
  TOR: '#003E7E',
  BOS: '#FFB81C',
  TBL: '#002868',
  NYR: '#0038A8',
  CAR: '#CC0000',
  FLA: '#C8102E',
  VGK: '#B4975A',
  DAL: '#006847',
  MIN: '#154734',
  WSH: '#041E42',
  PIT: '#FCB514',
  CHI: '#CF0A2C',
  MTL: '#AF1E2D',
  OTT: '#C52032',
  VAN: '#00843D',
  CGY: '#C8102E',
  WPG: '#004C97',
  ARI: '#8C2633',
  PHI: '#F74902',
  NJD: '#CE1126',
  NYI: '#00539B',
  DET: '#CE1126',
  STL: '#002F87',
  NSH: '#FFB81C',
  ANA: '#F47A38',
  LAK: '#111111',
  SJS: '#006D75',
  CBJ: '#002654',
  BUF: '#003399',
  SEA: '#001628',
};

// ── PROP LINE CALCULATOR ──────────────────────────────────────────────────────
function calcPropLine(value) {
  if (!value) return null;
  const projected = Math.round(value * 0.95);
  return projected + 0.5;
}

// ── FILTERS ───────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all', label: '🔥 All' },
  { key: 'C', label: 'Centers' },
  { key: 'LW', label: 'Left Wings' },
  { key: 'RW', label: 'Right Wings' },
  { key: 'D', label: 'Defense' },
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'points', label: 'Points' },
];

const TABS = [
  { key: 'games', label: 'Games' },
  { key: 'props', label: 'Player Props' },
];

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

// ── STAT DISPLAY HELPER ───────────────────────────────────────────────────────
function getDisplayStat(player, filter) {
  if (filter === 'goals')
    return player.goals
      ? { val: calcPropLine(player.goals), raw: player.goals, lbl: 'Season Goals', statType: 'goals' }
      : null;
  if (filter === 'assists')
    return player.assists
      ? { val: calcPropLine(player.assists), raw: player.assists, lbl: 'Season Assists', statType: 'assists' }
      : null;
  if (filter === 'points')
    return player.points
      ? { val: calcPropLine(player.points), raw: player.points, lbl: 'Season Points', statType: 'points' }
      : null;

  if (player.position === 'G')
    return player.goals
      ? { val: calcPropLine(player.goals), raw: player.goals, lbl: 'Season Goals', statType: 'goals' }
      : null;

  if (player.points)
    return { val: calcPropLine(player.points), raw: player.points, lbl: 'Season Points', statType: 'points' };
  if (player.goals)
    return { val: calcPropLine(player.goals), raw: player.goals, lbl: 'Season Goals', statType: 'goals' };
  if (player.assists)
    return { val: calcPropLine(player.assists), raw: player.assists, lbl: 'Season Assists', statType: 'assists' };

  return null;
}

// ── EXTRA STATS HELPER ────────────────────────────────────────────────────────
function getExtraStats(player, mainLbl) {
  const extras = [];
  if (player.goals && mainLbl !== 'Season Goals')
    extras.push({ val: calcPropLine(player.goals), lbl: 'Goals' });
  if (player.assists && mainLbl !== 'Season Assists')
    extras.push({ val: calcPropLine(player.assists), lbl: 'Assists' });
  if (player.points && mainLbl !== 'Season Points')
    extras.push({ val: calcPropLine(player.points), lbl: 'Points' });
  if (player.shots)
    extras.push({ val: calcPropLine(player.shots), lbl: 'Shots' });
  return extras;
}

// ── PLAYER CARD ───────────────────────────────────────────────────────────────
const NHL_LEAGUE_ID = 'nhl';

function PlayerCard({ player, filter, onToggleBet, selections }) {
  const stat = getDisplayStat(player, filter);
  if (!stat) return null;

  const color = TEAM_COLORS[player.team] || '#00f6ff';
  const initials = player.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  const extras = getExtraStats(player, stat.lbl);

  const overId = `${player.id}_${stat.statType}_over`;
  const underId = `${player.id}_${stat.statType}_under`;
  const overSelected = selections.some(
    (s) => s.gameId === String(player.id) && s.selectionId === overId,
  );
  const underSelected = selections.some(
    (s) => s.gameId === String(player.id) && s.selectionId === underId,
  );

  const handleBet = (direction) => {
    const selectionId = direction === 'more' ? overId : underId;
    onToggleBet({
      gameId: String(player.id),
      leagueId: NHL_LEAGUE_ID,
      sport: 'nhl',
      marketKey: 'player_prop',
      selectionId,
      outcomeLabel: `${player.name} ${direction === 'more' ? 'Over' : 'Under'} ${stat.val} ${stat.lbl}`,
      odds: 1.9,
      lineValue: stat.val,
      gameName: `${player.name} - ${stat.lbl}`,
      betType: 'Player Prop',
      betTeam: player.name,
    });
  };

  return (
    <div
      style={{
        background: '#11131a',
        border: '1px solid #1f2430',
        borderRadius: '14px',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#00f6ff';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(0,246,255,0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1f2430';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${color}22 0%, #11131a 100%)`,
          padding: '1.2rem 1rem 0.9rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: `${color}18`,
            border: `2px solid ${color}55`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.6rem',
          }}
        >
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color }}>
            {initials}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#00f6ff',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          {player.team} – {player.position}
        </span>
        <span
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#f3f4f6',
            marginTop: 2,
            textAlign: 'center',
          }}
        >
          {player.name}
        </span>
        <span style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 3 }}>
          2025 Season Projection
        </span>
      </div>

      <div style={{ padding: '0.9rem 1rem', borderTop: '1px solid #1f2430' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#f3f4f6',
              lineHeight: 1,
            }}
          >
            {stat.val}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>
            {stat.lbl}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#6b7494', marginTop: 4 }}>
            2024 actual: {Math.round(stat.raw)}
          </div>
        </div>

        {extras.length > 0 && (
          <div style={{ marginBottom: '0.7rem' }}>
            {extras.slice(0, 3).map((s) => (
              <div
                key={s.lbl}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '2px 0',
                  borderBottom: '1px solid #1f243033',
                }}
              >
                <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
                  {s.lbl}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#6b7494',
                  }}
                >
                  {s.val}
                </span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
          }}
        >
          <button
            onClick={() => handleBet('less')}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              background: underSelected ? 'rgba(255,61,87,0.25)' : 'rgba(255,61,87,0.1)',
              border: underSelected ? '1px solid #ff3d57' : '1px solid rgba(255,61,87,0.3)',
              color: '#ff3d57',
              fontSize: '0.78rem',
              fontWeight: 700,
              transition: 'background 0.18s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,61,87,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = underSelected ? 'rgba(255,61,87,0.25)' : 'rgba(255,61,87,0.1)')}
          >
            ↓ Less
          </button>
          <button
            onClick={() => handleBet('more')}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              background: overSelected ? 'rgba(0,246,255,0.2)' : 'rgba(0,246,255,0.08)',
              border: overSelected ? '1px solid #00f6ff' : '1px solid rgba(0,246,255,0.3)',
              color: '#00f6ff',
              fontSize: '0.78rem',
              fontWeight: 700,
              transition: 'background 0.18s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,246,255,0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = overSelected ? 'rgba(0,246,255,0.2)' : 'rgba(0,246,255,0.08)')}
          >
            ↑ More
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SKELETON CARD ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: '#11131a',
        border: '1px solid #1f2430',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 160,
          background:
            'linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }}
      />
      <div style={{ padding: '0.9rem 1rem' }}>
        {[60, 80, 100].map((w) => (
          <div
            key={w}
            style={{
              height: 12,
              width: `${w}%`,
              borderRadius: 6,
              background:
                'linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              marginBottom: 8,
            }}
          />
        ))}
      </div>
    </div>
  );
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
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('games');

  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetch(`${API_BASE}/nhl/players`);
        if (!res.ok) throw new Error('Failed to fetch NHL players');
        const data = await res.json();
        setPlayers(
          data.sort((a, b) => {
            const getMain = (p) => p.points || p.goals || p.assists || 0;
            return getMain(b) - getMain(a);
          }),
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, []);

  const filtered = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'goals'
          ? !!p.goals
          : filter === 'assists'
            ? !!p.assists
            : filter === 'points'
              ? !!p.points
              : p.position === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="text-sb-text">
      <style>{`
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-extrabold tracking-wide">🏒 NHL</h1>
        <span
          style={{
            background: 'rgba(0,246,255,0.08)',
            color: '#00f6ff',
            border: '1px solid rgba(0,246,255,0.3)',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '20px',
          }}
        >
          🔮 2025 Season Projections
        </span>
        {loading && tab === 'props' && (
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Loading…
          </span>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #1f2430',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.5rem 1.2rem',
              background: 'transparent',
              border: 'none',
              borderBottom:
                tab === t.key ? '2px solid #00f6ff' : '2px solid transparent',
              color: tab === t.key ? '#00f6ff' : '#9ca3af',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Player Props Tab */}
      {tab === 'props' && (
        <>
          <div
            style={{
              background: 'rgba(0,246,255,0.05)',
              border: '1px solid rgba(0,246,255,0.15)',
              borderRadius: '10px',
              padding: '0.7rem 1rem',
              marginBottom: '1.2rem',
              fontSize: '0.75rem',
              color: '#9ca3af',
            }}
          >
            📊 Prop lines are{' '}
            <strong style={{ color: '#00f6ff' }}>
              2025 season projections
            </strong>{' '}
            based on 2024 actual stats.
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search player or team…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: '#11131a',
                border: '1px solid #404040',
                borderRadius: '10px',
                padding: '0.5rem 1rem',
                color: '#f3f4f6',
                fontSize: '0.88rem',
                outline: 'none',
                width: '260px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#00f6ff')}
              onBlur={(e) => (e.target.style.borderColor = '#404040')}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  border:
                    filter === f.key
                      ? '1px solid #00f6ff'
                      : '1px solid #404040',
                  background:
                    filter === f.key ? 'rgba(0,246,255,0.1)' : '#11131a',
                  color: filter === f.key ? '#00f6ff' : '#9ca3af',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-widest text-sb-muted uppercase">
              Player Props —{' '}
              {loading ? 'loading…' : `${filtered.length} players`}
            </span>
            <div className="flex-1 h-px bg-[#1f2430]" />
          </div>

          {error && <p className="text-sb-error">{error}</p>}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <p className="text-sb-muted">No players found.</p>
            ) : (
              filtered.map((p) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  filter={filter}
                  onToggleBet={toggleSelection}
                  selections={selections}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Games Tab */}
      {tab === 'games' && (
        <GamesTab onToggleBet={toggleSelection} selections={selections} />
      )}
    </div>
  );
}
