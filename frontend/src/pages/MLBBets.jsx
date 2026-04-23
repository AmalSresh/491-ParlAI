import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// ── ESPN API ──────────────────────────────────────────────────────────────────
const ESPN_MLB_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';


// ── ODDS GENERATOR ────────────────────────────────────────────────────────────
// Seeded from game ID so odds don't flicker on re-render
function generateOdds(gameId, homeAway) {
  const seed = gameId
    ? [...gameId].reduce((a, c) => a + c.charCodeAt(0), 0) / 10000
    : 0.5;
  const base = homeAway === 'home' ? 1.4 + seed * 0.8 : 1.4 + (1 - seed) * 0.8;
  return Math.max(1.25, Math.min(2.8, base)).toFixed(2);
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3500);
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
        maxWidth: '300px',
        animation: 'fadeSlideIn 0.3s ease',
      }}
    >
      {message}
    </div>
  );
}

// ── BET MODAL ─────────────────────────────────────────────────────────────────
function BetModal({ bet, balance, onClose, onConfirm }) {
  const [stake, setStake] = useState(10);
  const payout = (stake * bet.odds).toFixed(2);
  const insufficient = stake > balance;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
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
            marginBottom: '0.4rem',
            color: '#f3f4f6',
          }}
        >
          Place Bet
        </h3>
        <p
          style={{
            fontSize: '0.82rem',
            color: '#9ca3af',
            marginBottom: '0.3rem',
          }}
        >
          {bet.gameLabel}
        </p>
        <p
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#f3f4f6',
            marginBottom: '1rem',
          }}
        >
          {bet.label} <span style={{ color: '#00f6ff' }}>×{bet.odds}</span>
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
            border: `1px solid ${insufficient ? '#ff3d57' : '#404040'}`,
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            color: '#f3f4f6',
            fontSize: '1rem',
            outline: 'none',
            marginBottom: '0.4rem',
          }}
        />
        {insufficient && (
          <p
            style={{
              fontSize: '0.72rem',
              color: '#ff3d57',
              marginBottom: '0.6rem',
            }}
          >
            Insufficient balance
          </p>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#9ca3af',
            marginBottom: '0.5rem',
          }}
        >
          <span>Odds</span>
          <span style={{ color: '#00f6ff', fontWeight: 700 }}>×{bet.odds}</span>
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
          }}
        >
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
            onClick={() => onConfirm({ ...bet, stake, payout })}
            disabled={insufficient || stake <= 0}
            style={{
              padding: '0.6rem',
              borderRadius: '8px',
              cursor: insufficient ? 'not-allowed' : 'pointer',
              background: insufficient ? '#1a1e2a' : '#00f6ff',
              border: 'none',
              color: insufficient ? '#6b7494' : '#000',
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

// ── GAME CARD ─────────────────────────────────────────────────────────────────
function GameCard({ game, onBet, placedBets }) {
  const comp = game.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === 'home');
  const away = comp?.competitors?.find((c) => c.homeAway === 'away');
  const status = game.status?.type;

  if (!home || !away) return null;

  const isLive = status?.state === 'in';
  const isFinished = status?.state === 'post';
  const isScheduled = status?.state === 'pre';

  const homeTeam = home.team;
  const awayTeam = away.team;
  const homeScore = home.score;
  const awayScore = away.score;
  const inning = game.status?.period;
  const clock = game.status?.displayClock;

  const homeOdds = generateOdds(game.id, 'home');
  const awayOdds = generateOdds(game.id, 'away');
  const overOdds = '1.90';
  const underOdds = '1.90';
  const totalLine = '8.5';

  const homeColor = game.homeColor || '#00f6ff';
  const awayColor = game.awayColor || '#00f6ff';

  const alreadyBet = placedBets.includes(game.id);

  const gameLabel = `${awayTeam.displayName} @ ${homeTeam.displayName}`;

  return (
    <div
      style={{
        background: '#11131a',
        border: `1px solid ${isLive ? 'rgba(0,246,255,0.3)' : '#1f2430'}`,
        borderRadius: '14px',
        padding: '1.2rem',
        marginBottom: '1rem',
        boxShadow: isLive ? '0 0 20px rgba(0,246,255,0.05)' : 'none',
        opacity: isFinished ? 0.7 : 1,
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div>
          {isLive && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#00c853',
                background: 'rgba(0,200,83,0.1)',
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(0,200,83,0.2)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#00c853',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              LIVE · Inning {inning} {clock}
            </span>
          )}
          {isScheduled && (
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
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
            <span
              style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af' }}
            >
              FINAL
            </span>
          )}
        </div>
        {alreadyBet && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#00f6ff',
              background: 'rgba(0,246,255,0.08)',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(0,246,255,0.2)',
            }}
          >
            ✓ Bet Placed
          </span>
        )}
      </div>

      {/* Teams & Score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        {/* Away */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flex: 1,
          }}
        >
          {awayTeam.logo ? (
            <img
              src={awayTeam.logo}
              alt={awayTeam.displayName}
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `${awayColor}22`,
                border: `2px solid ${awayColor}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 800,
                color: awayColor,
              }}
            >
              {awayTeam.abbreviation}
            </div>
          )}
          <div>
            <div
              style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f3f4f6' }}
            >
              {awayTeam.displayName}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
              {awayTeam.abbreviation} · Away
            </div>
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', padding: '0 1rem' }}>
          {isLive || isFinished ? (
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                color: '#f3f4f6',
                letterSpacing: '-1px',
              }}
            >
              {awayScore}{' '}
              <span style={{ color: '#9ca3af', fontSize: '1.2rem' }}>–</span>{' '}
              {homeScore}
            </div>
          ) : (
            <div
              style={{ fontSize: '1.2rem', fontWeight: 700, color: '#9ca3af' }}
            >
              VS
            </div>
          )}
        </div>

        {/* Home */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flex: 1,
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div
              style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f3f4f6' }}
            >
              {homeTeam.displayName}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
              {homeTeam.abbreviation} · Home
            </div>
          </div>
          {homeTeam.logo ? (
            <img
              src={homeTeam.logo}
              alt={homeTeam.displayName}
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `${homeColor}22`,
                border: `2px solid ${homeColor}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 800,
                color: homeColor,
              }}
            >
              {homeTeam.abbreviation}
            </div>
          )}
        </div>
      </div>

      {/* Betting Markets */}
      {!isFinished && (
        <div style={{ borderTop: '1px solid #1f2430', paddingTop: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            {/* Moneyline */}
            <div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginBottom: '0.5rem',
                }}
              >
                Moneyline
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() =>
                    !alreadyBet &&
                    onBet({
                      gameId: game.id,
                      gameLabel,
                      label: `${awayTeam.displayName} ML`,
                      odds: parseFloat(awayOdds),
                    })
                  }
                  disabled={alreadyBet}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    cursor: alreadyBet ? 'not-allowed' : 'pointer',
                    background: 'rgba(0,246,255,0.06)',
                    border: '1px solid rgba(0,246,255,0.2)',
                    color: '#f3f4f6',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    opacity: alreadyBet ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!alreadyBet)
                      e.currentTarget.style.borderColor = '#00f6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,246,255,0.2)';
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: '#9ca3af',
                      marginBottom: 2,
                    }}
                  >
                    {awayTeam.abbreviation}
                  </div>
                  ×{awayOdds}
                </button>
                <button
                  onClick={() =>
                    !alreadyBet &&
                    onBet({
                      gameId: game.id,
                      gameLabel,
                      label: `${homeTeam.displayName} ML`,
                      odds: parseFloat(homeOdds),
                    })
                  }
                  disabled={alreadyBet}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    cursor: alreadyBet ? 'not-allowed' : 'pointer',
                    background: 'rgba(0,246,255,0.06)',
                    border: '1px solid rgba(0,246,255,0.2)',
                    color: '#f3f4f6',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    opacity: alreadyBet ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!alreadyBet)
                      e.currentTarget.style.borderColor = '#00f6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,246,255,0.2)';
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: '#9ca3af',
                      marginBottom: 2,
                    }}
                  >
                    {homeTeam.abbreviation}
                  </div>
                  ×{homeOdds}
                </button>
              </div>
            </div>

            {/* Total Runs */}
            <div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginBottom: '0.5rem',
                }}
              >
                Total Runs ({totalLine})
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() =>
                    !alreadyBet &&
                    onBet({
                      gameId: game.id,
                      gameLabel,
                      label: `Over ${totalLine} Runs`,
                      odds: parseFloat(overOdds),
                    })
                  }
                  disabled={alreadyBet}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    cursor: alreadyBet ? 'not-allowed' : 'pointer',
                    background: 'rgba(0,200,83,0.06)',
                    border: '1px solid rgba(0,200,83,0.2)',
                    color: '#f3f4f6',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    opacity: alreadyBet ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!alreadyBet)
                      e.currentTarget.style.borderColor = '#00c853';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,200,83,0.2)';
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: '#9ca3af',
                      marginBottom: 2,
                    }}
                  >
                    Over
                  </div>
                  ×{overOdds}
                </button>
                <button
                  onClick={() =>
                    !alreadyBet &&
                    onBet({
                      gameId: game.id,
                      gameLabel,
                      label: `Under ${totalLine} Runs`,
                      odds: parseFloat(underOdds),
                    })
                  }
                  disabled={alreadyBet}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    cursor: alreadyBet ? 'not-allowed' : 'pointer',
                    background: 'rgba(255,61,87,0.06)',
                    border: '1px solid rgba(255,61,87,0.2)',
                    color: '#f3f4f6',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    opacity: alreadyBet ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!alreadyBet)
                      e.currentTarget.style.borderColor = '#ff3d57';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,61,87,0.2)';
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: '#9ca3af',
                      marginBottom: 2,
                    }}
                  >
                    Under
                  </div>
                  ×{underOdds}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFinished && (
        <div
          style={{
            borderTop: '1px solid #1f2430',
            paddingTop: '0.8rem',
            fontSize: '0.75rem',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          Game finished — betting closed
        </div>
      )}
    </div>
  );
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: '#11131a',
        border: '1px solid #1f2430',
        borderRadius: '14px',
        padding: '1.2rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          height: 12,
          width: '30%',
          borderRadius: 6,
          background:
            'linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
          marginBottom: 16,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            height: 40,
            width: '35%',
            borderRadius: 8,
            background:
              'linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }}
        />
        <div
          style={{
            height: 40,
            width: '20%',
            borderRadius: 8,
            background:
              'linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }}
        />
        <div
          style={{
            height: 40,
            width: '35%',
            borderRadius: 8,
            background:
              'linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }}
        />
      </div>
      <div
        style={{
          height: 60,
          borderRadius: 8,
          background:
            'linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }}
      />
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function MLBBets() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [balance, setBalance] = useState(user?.balance ?? 1000);
  const [recentBets, setRecentBets] = useState([]);
  const [placedBets, setPlacedBets] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('mlb_placed_bets') || '[]');
    } catch {
      return [];
    }
  });
  const [pendingBet, setPendingBet] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ESPN_MLB_SCOREBOARD);
      if (!res.ok) throw new Error('Failed to fetch MLB games');
      const data = await res.json();
      setGames(data.events ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBetClick(betInfo) {
    setPendingBet(betInfo);
  }

  function handleConfirmBet(bet) {
    const stake = parseFloat(bet.stake);
    const payout = parseFloat(bet.payout);
    setBalance((prev) => prev - stake);
    const newPlaced = [...placedBets, bet.gameId];
    setPlacedBets(newPlaced);
    try {
      window.localStorage.setItem('mlb_placed_bets', JSON.stringify(newPlaced));
    } catch (e) {
      console.warn(e);
    }
    setRecentBets((prev) => [bet, ...prev].slice(0, 5));
    setPendingBet(null);
    setToast(
      `✅ Bet placed!\n${bet.label}\nStake: $${stake} · To win: $${payout.toFixed(2)}`,
    );
  }

  const liveCount = games.filter((g) => g.status?.type?.state === 'in').length;

  const filtered = games.filter((g) => {
    const state = g.status?.type?.state;
    const matchesFilter =
      filter === 'live'
        ? state === 'in'
        : filter === 'upcoming'
          ? state === 'pre'
          : filter === 'finished'
            ? state === 'post'
            : true;

    const home = g.competitions?.[0]?.competitors?.find(
      (c) => c.homeAway === 'home',
    );
    const away = g.competitions?.[0]?.competitors?.find(
      (c) => c.homeAway === 'away',
    );
    const matchesSearch =
      search === '' ||
      home?.team?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      away?.team?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      home?.team?.abbreviation?.toLowerCase().includes(search.toLowerCase()) ||
      away?.team?.abbreviation?.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="text-sb-text">
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span style={{ fontSize: '2rem' }}>⚾</span>
        <h1 className="text-3xl font-extrabold tracking-wide">MLB</h1>
        {liveCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#00c853',
              background: 'rgba(0,200,83,0.1)',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(0,200,83,0.2)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#00c853',
                animation: 'pulse 1.5s infinite',
              }}
            />
            {liveCount} LIVE
          </span>
        )}
      </div>
      <p
        style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1.5rem' }}
      >
        Bet on MLB games using your virtual balance. Live scores powered by
        ESPN.
      </p>

      {/* Balance + Recent Bets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: '#11131a',
            border: '1px solid #1f2430',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: 6,
            }}
          >
            Your Balance
          </div>
          <div
            style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00f6ff' }}
          >
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div
          style={{
            background: '#11131a',
            border: '1px solid #1f2430',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: 6,
            }}
          >
            Recent Bets
          </div>
          {recentBets.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
              No bets placed yet this session.
            </p>
          ) : (
            recentBets.slice(0, 3).map((b, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  marginBottom: 4,
                }}
              >
                <span style={{ color: '#f3f4f6' }}>{b.label}</span>
                <span style={{ color: '#00c853', fontWeight: 700 }}>
                  +${parseFloat(b.payout).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search team…"
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

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {['all', 'live', 'upcoming', 'finished'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer',
              border: filter === f ? '1px solid #00f6ff' : '1px solid #404040',
              background: filter === f ? 'rgba(0,246,255,0.1)' : '#11131a',
              color: filter === f ? '#00f6ff' : '#9ca3af',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.18s',
              textTransform: 'capitalize',
            }}
          >
            {f === 'live' && liveCount > 0
              ? `Live (${liveCount})`
              : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button
          onClick={fetchGames}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            cursor: 'pointer',
            border: '1px solid #404040',
            background: '#11131a',
            color: '#9ca3af',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginLeft: 'auto',
            transition: 'all 0.18s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00f6ff';
            e.currentTarget.style.color = '#00f6ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#404040';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold tracking-widest text-sb-muted uppercase">
          {loading
            ? 'Loading games…'
            : `${filtered.length} game${filtered.length !== 1 ? 's' : ''}`}
        </span>
        <div className="flex-1 h-px bg-[#1f2430]" />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'rgba(248,160,160,0.1)',
            border: '1px solid rgba(248,160,160,0.3)',
            borderRadius: '10px',
            padding: '0.8rem 1rem',
            fontSize: '0.85rem',
            color: '#f8a0a0',
            marginBottom: '1rem',
          }}
        >
          Failed to load games: {error}.{' '}
          <button
            onClick={fetchGames}
            style={{
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: '#f8a0a0',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Games */}
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
      ) : filtered.length === 0 ? (
        <div
          style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚾</div>
          <p>No {filter === 'all' ? '' : filter} games right now.</p>
          <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
            Check back during the MLB season for live matchups.
          </p>
        </div>
      ) : (
        filtered.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onBet={handleBetClick}
            placedBets={placedBets}
          />
        ))
      )}

      {/* Bet Modal */}
      {pendingBet && (
        <BetModal
          bet={pendingBet}
          balance={balance}
          onClose={() => setPendingBet(null)}
          onConfirm={handleConfirmBet}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
