import { useEffect, useState } from 'react';

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
  { key: 'props', label: 'Player Props' },
  { key: 'scores', label: 'Live Scores' },
];

// ── STAT DISPLAY HELPER ───────────────────────────────────────────────────────
function getDisplayStat(player, filter) {
  if (filter === 'goals')
    return player.goals
      ? { val: calcPropLine(player.goals), raw: player.goals, lbl: '2025 Goals' }
      : null;
  if (filter === 'assists')
    return player.assists
      ? { val: calcPropLine(player.assists), raw: player.assists, lbl: '2025 Assists' }
      : null;
  if (filter === 'points')
    return player.points
      ? { val: calcPropLine(player.points), raw: player.points, lbl: '2025 Points' }
      : null;

  // Default by position
  if (player.position === 'G')
    return player.goals
      ? { val: calcPropLine(player.goals), raw: player.goals, lbl: '2025 Goals' }
      : null;

  if (player.points)
    return { val: calcPropLine(player.points), raw: player.points, lbl: '2025 Points' };
  if (player.goals)
    return { val: calcPropLine(player.goals), raw: player.goals, lbl: '2025 Goals' };
  if (player.assists)
    return { val: calcPropLine(player.assists), raw: player.assists, lbl: '2025 Assists' };

  return null;
}

// ── EXTRA STATS HELPER ────────────────────────────────────────────────────────
function getExtraStats(player, mainLbl) {
  const extras = [];
  if (player.goals && mainLbl !== '2025 Goals')
    extras.push({ val: calcPropLine(player.goals), lbl: 'Goals' });
  if (player.assists && mainLbl !== '2025 Assists')
    extras.push({ val: calcPropLine(player.assists), lbl: 'Assists' });
  if (player.points && mainLbl !== '2025 Points')
    extras.push({ val: calcPropLine(player.points), lbl: 'Points' });
  if (player.shots)
    extras.push({ val: calcPropLine(player.shots), lbl: 'Shots' });
  return extras;
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 4000);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 999,
        background: '#11131a',
        border: '1px solid #00f6ff',
        color: '#f3f4f6',
        padding: '0.85rem 1.2rem',
        borderRadius: '12px',
        fontSize: '0.84rem',
        lineHeight: 1.5,
        whiteSpace: 'pre-line',
        boxShadow: '0 0 24px rgba(0,246,255,0.2)',
        maxWidth: '280px',
      }}
    >
      {message}
    </div>
  );
}

// ── BET MODAL ─────────────────────────────────────────────────────────────────
function BetModal({ bet, onClose, onConfirm }) {
  const [stake, setStake] = useState(10);
  const odds = 1.9;
  const payout = (stake * odds).toFixed(2);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#11131a',
          border: '1px solid #00f6ff',
          borderRadius: '16px',
          padding: '1.5rem',
          width: '320px',
          boxShadow: '0 0 40px rgba(0,246,255,0.2)',
        }}
      >
        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: '#f3f4f6',
          }}
        >
          Place Bet
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
          {bet.playerName}
        </p>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#f3f4f6',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          {bet.direction === 'more' ? '↑ More' : '↓ Less'} than{' '}
          <span style={{ color: '#00f6ff' }}>{bet.statValue}</span> {bet.statLabel}
        </p>

        <p
          style={{
            fontSize: '0.7rem',
            color: '#9ca3af',
            marginBottom: '1rem',
            background: '#0d0f14',
            padding: '6px 10px',
            borderRadius: '6px',
          }}
        >
          📊 2024 actual: {Math.round(bet.rawValue)} {bet.statLabel.replace('2025 ', '')}
        </p>

        <label
          style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            display: 'block',
            marginBottom: '0.3rem',
          }}
        >
          Stake ($)
        </label>
        <input
          type="number"
          min="1"
          value={stake}
          onChange={(e) => setStake(Number(e.target.value))}
          style={{
            width: '100%',
            background: '#0d0f14',
            border: '1px solid #404040',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            color: '#f3f4f6',
            fontSize: '1rem',
            outline: 'none',
            marginBottom: '0.8rem',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#9ca3af',
            marginBottom: '0.6rem',
          }}
        >
          <span>Odds</span>
          <span style={{ color: '#00f6ff', fontWeight: 700 }}>{odds} (~-110)</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#9ca3af',
            marginBottom: '1.2rem',
          }}
        >
          <span>Potential Payout</span>
          <span style={{ color: '#00c853', fontWeight: 700 }}>${payout}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem',
              borderRadius: '8px',
              cursor: 'pointer',
              background: 'transparent',
              border: '1px solid #404040',
              color: '#9ca3af',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ ...bet, stake })}
            style={{
              padding: '0.6rem',
              borderRadius: '8px',
              cursor: 'pointer',
              background: '#00f6ff',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            Confirm Bet
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PLAYER CARD ───────────────────────────────────────────────────────────────
function PlayerCard({ player, filter, onBet }) {
  const stat = getDisplayStat(player, filter);
  if (!stat) return null;

  const color = TEAM_COLORS[player.team] || '#00f6ff';
  const initials = player.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  const extras = getExtraStats(player, stat.lbl);

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
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{initials}</span>
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
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f3f4f6', lineHeight: 1 }}>
            {stat.val}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{stat.lbl}</div>
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
                <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{s.lbl}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7494' }}>
                  {s.val}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            onClick={() =>
              onBet({
                playerName: player.name,
                statLabel: stat.lbl,
                statValue: stat.val,
                rawValue: stat.raw,
                direction: 'less',
              })
            }
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              background: 'rgba(255,61,87,0.1)',
              border: '1px solid rgba(255,61,87,0.3)',
              color: '#ff3d57',
              fontSize: '0.78rem',
              fontWeight: 700,
              transition: 'background 0.18s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,61,87,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,61,87,0.1)')}
          >
            ↓ Less
          </button>
          <button
            onClick={() =>
              onBet({
                playerName: player.name,
                statLabel: stat.lbl,
                statValue: stat.val,
                rawValue: stat.raw,
                direction: 'more',
              })
            }
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              background: 'rgba(0,246,255,0.08)',
              border: '1px solid rgba(0,246,255,0.3)',
              color: '#00f6ff',
              fontSize: '0.78rem',
              fontWeight: 700,
              transition: 'background 0.18s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,246,255,0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,246,255,0.08)')}
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
          background: 'linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)',
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
              background: 'linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)',
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

// ── LIVE SCORES TAB ───────────────────────────────────────────────────────────
const ESPN_NHL_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard';

function LiveScores() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(ESPN_NHL_SCOREBOARD);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setGames(data.events ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-sb-muted">Loading scores...</p>;
  if (error) return <p className="text-sb-error">{error}</p>;
  if (games.length === 0)
    return <p className="text-sb-muted">No games scheduled today.</p>;

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const comp = game.competitions?.[0];
        const home = comp?.competitors?.find((c) => c.homeAway === 'home');
        const away = comp?.competitors?.find((c) => c.homeAway === 'away');
        if (!home || !away) return null;
        const isLive = game.status?.type?.state === 'in';
        const isFinished = game.status?.type?.state === 'post';

        return (
          <div
            key={game.id}
            className={`rounded-xl border p-4 ${isLive ? 'border-[#00f6ff44] bg-[#050e14]' : 'border-[#1a2535] bg-[#060c12]'} ${isFinished ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {away.team.logo && (
                  <img src={away.team.logo} alt={away.team.displayName} className="w-8 h-8 object-contain" />
                )}
                <span className="font-bold text-sb-text text-sm">{away.team.displayName}</span>
              </div>
              <div className="text-center px-4">
                {isLive || isFinished ? (
                  <span className="text-xl font-black text-white">
                    {away.score} – {home.score}
                  </span>
                ) : (
                  <span className="text-sb-muted text-sm">
                    {new Date(game.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-1 justify-end">
                <span className="font-bold text-sb-text text-sm">{home.team.displayName}</span>
                {home.team.logo && (
                  <img src={home.team.logo} alt={home.team.displayName} className="w-8 h-8 object-contain" />
                )}
              </div>
            </div>
            {isLive && (
              <div className="mt-2 flex justify-center">
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  LIVE · P{game.status?.period} {game.status?.displayClock}
                </span>
              </div>
            )}
            {isFinished && (
              <div className="mt-2 flex justify-center">
                <span className="text-xs text-sb-muted font-bold">FINAL</span>
              </div>
            )}
          </div>
        );
      })}
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ESPN_NHL_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard';

function OddsButton({ label, value, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-3 py-2 rounded text-sm font-bold border transition-all duration-150
        ${
          active
            ? 'bg-sb-blue text-sb-dark border-sb-blue shadow-[0_0_12px_rgba(0,246,255,0.4)]'
            : 'bg-[#0a1520] text-sb-text border-[#1e3040] hover:border-sb-blue hover:text-sb-blue'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className="block text-[10px] font-normal opacity-70 mb-0.5">
        {label}
      </span>
      <span>{value}</span>
    </button>
  );
}

function GameCard({ game, onBet, userBalance, betPlaced, onBetPlaced }) {
  const [selectedBet, setSelectedBet] = useState(null);
  const [stakeInput, setStakeInput] = useState('');

  const home = game.competitions?.[0]?.competitors?.find(
    (c) => c.homeAway === 'home',
  );
  const away = game.competitions?.[0]?.competitors?.find(
    (c) => c.homeAway === 'away',
  );
  const status = game.status?.type;
  const isLive = status?.state === 'in';
  const isFinished = status?.state === 'post';
  const isScheduled = status?.state === 'pre';

  if (!home || !away) return null;

  const homeTeam = home.team;
  const awayTeam = away.team;
  const homeScore = home.score;
  const awayScore = away.score;
  const period = game.status?.period;
  const clock = game.status?.displayClock;

  // Seeded from game id so odds stay stable per session
  const seed = game.id ? game.id.charCodeAt(0) / 255 : 0.5;
  const homeOdds = (1.4 + seed * 1.4).toFixed(2);
  const awayOdds = (1.4 + (1 - seed) * 1.4).toFixed(2);
  const overOdds = '1.90';
  const underOdds = '1.90';

  const handleSelectBet = (type, label, odds) => {
    if (betPlaced || isFinished) return;
    setSelectedBet(selectedBet?.type === type ? null : { type, label, odds });
    setStakeInput('');
  };

  const handlePlaceBet = () => {
    const stake = parseFloat(stakeInput);
    if (!stake || stake <= 0 || stake > userBalance) return;
    onBet({
      gameId: game.id,
      ...selectedBet,
      stake,
      payout: (stake * selectedBet.odds).toFixed(2),
    });
    onBetPlaced(game.id);
    setSelectedBet(null);
    setStakeInput('');
  };

  const potentialPayout =
    selectedBet && stakeInput
      ? (parseFloat(stakeInput) * selectedBet.odds).toFixed(2)
      : null;

  return (
    <div
      className={`
      rounded-xl border p-4 mb-3 transition-all
      ${isLive ? 'border-[#00f6ff44] bg-[#050e14] shadow-[0_0_20px_rgba(0,246,255,0.08)]' : 'border-[#1a2535] bg-[#060c12]'}
      ${isFinished ? 'opacity-60' : ''}
    `}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              LIVE · P{period} {clock}
            </span>
          )}
          {isScheduled && (
            <span className="text-xs text-sb-muted">
              {new Date(game.date).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
          {isFinished && (
            <span className="text-xs text-sb-muted font-bold">FINAL</span>
          )}
        </div>
        {betPlaced && (
          <span className="text-xs text-sb-blue font-bold bg-sb-blue/10 px-2 py-0.5 rounded-full border border-sb-blue/20">
            ✓ Bet Placed
          </span>
        )}
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between mb-4">
        {/* Away Team */}
        <div className="flex items-center gap-3 flex-1">
          {awayTeam.logo && (
            <img
              src={awayTeam.logo}
              alt={awayTeam.displayName}
              className="w-10 h-10 object-contain"
            />
          )}
          <div>
            <div className="font-bold text-sb-text text-sm">
              {awayTeam.displayName}
            </div>
            <div className="text-xs text-sb-muted">
              {awayTeam.abbreviation} · Away
            </div>
          </div>
        </div>

        {/* Score / VS */}
        <div className="text-center px-4">
          {isLive || isFinished ? (
            <div className="text-2xl font-black text-white tracking-tight">
              {awayScore} <span className="text-sb-muted text-lg">–</span>{' '}
              {homeScore}
            </div>
          ) : (
            <div className="text-lg font-bold text-sb-muted">VS</div>
          )}
        </div>

        {/* Home Team */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <div className="font-bold text-sb-text text-sm">
              {homeTeam.displayName}
            </div>
            <div className="text-xs text-sb-muted">
              {homeTeam.abbreviation} · Home
            </div>
          </div>
          {homeTeam.logo && (
            <img
              src={homeTeam.logo}
              alt={homeTeam.displayName}
              className="w-10 h-10 object-contain"
            />
          )}
        </div>
      </div>

      {/* Betting Options */}
      {!isFinished && (
        <div className="border-t border-[#1a2535] pt-3">
          {betPlaced ? (
            <p className="text-xs text-sb-muted text-center py-2">
              You have already placed a bet on this game.
            </p>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <div className="text-[10px] text-sb-muted uppercase tracking-widest mb-1.5">
                    Moneyline
                  </div>
                  <div className="flex gap-2">
                    <OddsButton
                      label={awayTeam.abbreviation}
                      value={`×${awayOdds}`}
                      active={selectedBet?.type === 'ml_away'}
                      onClick={() =>
                        handleSelectBet(
                          'ml_away',
                          `${awayTeam.displayName} ML`,
                          parseFloat(awayOdds),
                        )
                      }
                      disabled={false}
                    />
                    <OddsButton
                      label={homeTeam.abbreviation}
                      value={`×${homeOdds}`}
                      active={selectedBet?.type === 'ml_home'}
                      onClick={() =>
                        handleSelectBet(
                          'ml_home',
                          `${homeTeam.displayName} ML`,
                          parseFloat(homeOdds),
                        )
                      }
                      disabled={false}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-sb-muted uppercase tracking-widest mb-1.5">
                    Total Goals
                  </div>
                  <div className="flex gap-2">
                    <OddsButton
                      label="Over 5.5"
                      value={`×${overOdds}`}
                      active={selectedBet?.type === 'total_over'}
                      onClick={() =>
                        handleSelectBet(
                          'total_over',
                          'Over 5.5 Goals',
                          parseFloat(overOdds),
                        )
                      }
                      disabled={false}
                    />
                    <OddsButton
                      label="Under 5.5"
                      value={`×${underOdds}`}
                      active={selectedBet?.type === 'total_under'}
                      onClick={() =>
                        handleSelectBet(
                          'total_under',
                          'Under 5.5 Goals',
                          parseFloat(underOdds),
                        )
                      }
                      disabled={false}
                    />
                  </div>
                </div>
              </div>

              {/* Stake Input */}
              {selectedBet && (
                <div className="bg-[#071018] rounded-lg border border-sb-blue/30 p-3 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-sb-muted">
                      Selected:{' '}
                      <span className="text-sb-blue font-semibold">
                        {selectedBet.label}
                      </span>
                    </span>
                    <span className="text-xs text-sb-muted">
                      Odds:{' '}
                      <span className="text-white font-bold">
                        ×{selectedBet.odds}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-muted font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        max={userBalance}
                        value={stakeInput}
                        onChange={(e) => setStakeInput(e.target.value)}
                        placeholder="Stake"
                        className="w-full bg-[#0a1822] border border-[#1e3040] rounded pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-sb-blue"
                      />
                    </div>
                    {potentialPayout && (
                      <div className="text-xs text-center">
                        <div className="text-sb-muted">Win</div>
                        <div className="text-green-400 font-bold">
                          ${potentialPayout}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handlePlaceBet}
                      disabled={
                        !stakeInput ||
                        parseFloat(stakeInput) <= 0 ||
                        parseFloat(stakeInput) > userBalance
                      }
                      className="bg-sb-blue text-sb-dark font-bold px-4 py-2 rounded text-sm hover:bg-sb-blue-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Place Bet
                    </button>
                  </div>
                  {parseFloat(stakeInput) > userBalance && (
                    <p className="text-sb-error text-xs mt-1">
                      Insufficient balance
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Hockey() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('props');
  const [pendingBet, setPendingBet] = useState(null);

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

  async function handleConfirmBet(bet) {
    try {
      const res = await fetch(`${API_BASE}/nhl/bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bet),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(`❌ ${data.error || 'Failed to place bet'}`);
      } else {
        setToast(
          `✅ Bet placed!\n${bet.playerName}\n${bet.direction === 'more' ? '↑ More' : '↓ Less'} ${bet.statValue} ${bet.statLabel}\nPayout: $${data.potentialPayout}\nBalance: $${data.newBalance}`,
        );
      }
    } catch {
      setToast('❌ Failed to place bet. Please try again.');
    } finally {
      setPendingBet(null);
    }
  }

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
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Loading…</span>
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
              borderBottom: tab === t.key ? '2px solid #00f6ff' : '2px solid transparent',
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
            <strong style={{ color: '#00f6ff' }}>2025 season projections</strong> based
            on 2024 actual stats.
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
                  border: filter === f.key ? '1px solid #00f6ff' : '1px solid #404040',
                  background: filter === f.key ? 'rgba(0,246,255,0.1)' : '#11131a',
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
              Player Props — {loading ? 'loading…' : `${filtered.length} players`}
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
                <PlayerCard key={p.id} player={p} filter={filter} onBet={setPendingBet} />
              ))
            )}
          </div>
        </>
      )}

      {/* Live Scores Tab */}
      {tab === 'scores' && <LiveScores />}

      {/* Bet Modal */}
      {pendingBet && (
        <BetModal
          bet={pendingBet}
          onClose={() => setPendingBet(null)}
          onConfirm={handleConfirmBet}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
export default function Hockey() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [recentBets, setRecentBets] = useState([]);
  const [balance, setBalance] = useState(user?.balance ?? 1000);
  const [toast, setToast] = useState(null);
  // Track which game IDs have already been bet on this session
  const [bettedGames, setBettedGames] = useState(new Set());

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ESPN_NHL_SCOREBOARD);
      if (!res.ok) throw new Error('Failed to fetch NHL games');
      const data = await res.json();
      setGames(data.events ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBet(betInfo) {
    setBalance((prev) => prev - betInfo.stake);
    setRecentBets((prev) => [betInfo, ...prev].slice(0, 5));
    showToast(
      `Bet placed: ${betInfo.label} · $${betInfo.stake} to win $${betInfo.payout}`,
    );
  }

  function handleBetPlaced(gameId) {
    setBettedGames((prev) => new Set([...prev, gameId]));
  }

  function showToast(msg) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }

  const filteredGames = games.filter((g) => {
    const state = g.status?.type?.state;
    if (filter === 'live') return state === 'in';
    if (filter === 'upcoming') return state === 'pre';
    if (filter === 'finished') return state === 'post';
    return true;
  });

  const liveCount = games.filter((g) => g.status?.type?.state === 'in').length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-sb-dark border border-sb-blue/50 text-sb-blue px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🏒</span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            NHL Hockey
          </h1>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              {liveCount} LIVE
            </span>
          )}
        </div>
        <p className="text-sb-muted text-sm">
          Bet on NHL games using your virtual balance. Live scores powered by
          ESPN.
        </p>
      </div>

      {/* Balance + Recent Bets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#060c12] border border-[#1a2535] rounded-xl p-4">
          <div className="text-xs text-sb-muted uppercase tracking-widest mb-1">
            Your Balance
          </div>
          <div className="text-2xl font-black text-sb-blue">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="md:col-span-2 bg-[#060c12] border border-[#1a2535] rounded-xl p-4">
          <div className="text-xs text-sb-muted uppercase tracking-widest mb-2">
            Recent Bets
          </div>
          {recentBets.length === 0 ? (
            <p className="text-sb-muted text-sm">
              No bets placed yet this session.
            </p>
          ) : (
            <div className="space-y-1">
              {recentBets.slice(0, 3).map((b, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-sb-text">{b.label}</span>
                  <span className="text-green-400 font-semibold">
                    +${b.payout}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'live', 'upcoming', 'finished'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all capitalize
              ${
                filter === f
                  ? 'bg-sb-blue text-sb-dark border-sb-blue'
                  : 'border-[#1a2535] text-sb-muted hover:border-sb-blue hover:text-sb-blue'
              }`}
          >
            {f === 'live' && liveCount > 0
              ? `Live (${liveCount})`
              : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button
          onClick={fetchGames}
          className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold border border-[#1a2535] text-sb-muted hover:border-sb-blue hover:text-sb-blue transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Games */}
      {loading && (
        <div className="text-center py-16 text-sb-muted">
          <div className="text-3xl mb-3 animate-spin inline-block">🏒</div>
          <p>Loading NHL games...</p>
        </div>
      )}
      {error && (
        <div className="bg-sb-error-bg border border-sb-error/30 text-sb-error rounded-xl p-4 text-sm">
          Failed to load games: {error}.{' '}
          <button onClick={fetchGames} className="underline">
            Try again
          </button>
        </div>
      )}
      {!loading && !error && filteredGames.length === 0 && (
        <div className="text-center py-16 text-sb-muted">
          <p className="text-2xl mb-2">🏒</p>
          <p>No {filter === 'all' ? '' : filter} games right now.</p>
          <p className="text-sm mt-1">
            Check back during the NHL season for live matchups.
          </p>
        </div>
      )}
      {!loading &&
        !error &&
        filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onBet={handleBet}
            userBalance={balance}
            betPlaced={bettedGames.has(game.id)}
            onBetPlaced={handleBetPlaced}
          />
        ))}
    </div>
  );
}
