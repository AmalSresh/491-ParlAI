import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ESPN_NHL_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard';

function OddsButton({ label, value, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-3 py-2 rounded text-sm font-bold border transition-all duration-150
        ${active
          ? 'bg-sb-blue text-sb-dark border-sb-blue shadow-[0_0_12px_rgba(0,246,255,0.4)]'
          : 'bg-[#0a1520] text-sb-text border-[#1e3040] hover:border-sb-blue hover:text-sb-blue'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className="block text-[10px] font-normal opacity-70 mb-0.5">{label}</span>
      <span>{value}</span>
    </button>
  );
}

function GameCard({ game, onBet, userBalance }) {
  const [selectedBet, setSelectedBet] = useState(null);
  const [stakeInput, setStakeInput] = useState('');
  const [betPlaced, setBetPlaced] = useState(false);

  const home = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home');
  const away = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away');
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

  // Mock odds (in a real app these would come from an odds API)
  // Seeded from game id so they don't change on every re-render
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
    onBet({ gameId: game.id, ...selectedBet, stake, payout: (stake * selectedBet.odds).toFixed(2) });
    setBetPlaced(true);
    setSelectedBet(null);
    setStakeInput('');
  };

  const potentialPayout = selectedBet && stakeInput
    ? (parseFloat(stakeInput) * selectedBet.odds).toFixed(2)
    : null;

  return (
    <div className={`
      rounded-xl border p-4 mb-3 transition-all
      ${isLive ? 'border-[#00f6ff44] bg-[#050e14] shadow-[0_0_20px_rgba(0,246,255,0.08)]' : 'border-[#1a2535] bg-[#060c12]'}
      ${isFinished ? 'opacity-60' : ''}
    `}>
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
                weekday: 'short', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit'
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
            <img src={awayTeam.logo} alt={awayTeam.displayName} className="w-10 h-10 object-contain" />
          )}
          <div>
            <div className="font-bold text-sb-text text-sm">{awayTeam.displayName}</div>
            <div className="text-xs text-sb-muted">{awayTeam.abbreviation} · Away</div>
          </div>
        </div>

        {/* Score / VS */}
        <div className="text-center px-4">
          {(isLive || isFinished) ? (
            <div className="text-2xl font-black text-white tracking-tight">
              {awayScore} <span className="text-sb-muted text-lg">–</span> {homeScore}
            </div>
          ) : (
            <div className="text-lg font-bold text-sb-muted">VS</div>
          )}
        </div>

        {/* Home Team */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <div className="font-bold text-sb-text text-sm">{homeTeam.displayName}</div>
            <div className="text-xs text-sb-muted">{homeTeam.abbreviation} · Home</div>
          </div>
          {homeTeam.logo && (
            <img src={homeTeam.logo} alt={homeTeam.displayName} className="w-10 h-10 object-contain" />
          )}
        </div>
      </div>

      {/* Betting Options */}
      {!isFinished && (
        <div className="border-t border-[#1a2535] pt-3">
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <div className="text-[10px] text-sb-muted uppercase tracking-widest mb-1.5">Moneyline</div>
              <div className="flex gap-2">
                <OddsButton
                  label={awayTeam.abbreviation}
                  value={`×${awayOdds}`}
                  active={selectedBet?.type === 'ml_away'}
                  onClick={() => handleSelectBet('ml_away', `${awayTeam.displayName} ML`, parseFloat(awayOdds))}
                  disabled={isFinished}
                />
                <OddsButton
                  label={homeTeam.abbreviation}
                  value={`×${homeOdds}`}
                  active={selectedBet?.type === 'ml_home'}
                  onClick={() => handleSelectBet('ml_home', `${homeTeam.displayName} ML`, parseFloat(homeOdds))}
                  disabled={isFinished}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-sb-muted uppercase tracking-widest mb-1.5">Total Goals</div>
              <div className="flex gap-2">
                <OddsButton
                  label="Over 5.5"
                  value={`×${overOdds}`}
                  active={selectedBet?.type === 'total_over'}
                  onClick={() => handleSelectBet('total_over', 'Over 5.5 Goals', parseFloat(overOdds))}
                  disabled={isFinished}
                />
                <OddsButton
                  label="Under 5.5"
                  value={`×${underOdds}`}
                  active={selectedBet?.type === 'total_under'}
                  onClick={() => handleSelectBet('total_under', 'Under 5.5 Goals', parseFloat(underOdds))}
                  disabled={isFinished}
                />
              </div>
            </div>
          </div>

          {/* Stake Input */}
          {selectedBet && (
            <div className="bg-[#071018] rounded-lg border border-sb-blue/30 p-3 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-sb-muted">Selected: <span className="text-sb-blue font-semibold">{selectedBet.label}</span></span>
                <span className="text-xs text-sb-muted">Odds: <span className="text-white font-bold">×{selectedBet.odds}</span></span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-muted font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    max={userBalance}
                    value={stakeInput}
                    onChange={e => setStakeInput(e.target.value)}
                    placeholder="Stake"
                    className="w-full bg-[#0a1822] border border-[#1e3040] rounded pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-sb-blue"
                  />
                </div>
                {potentialPayout && (
                  <div className="text-xs text-center">
                    <div className="text-sb-muted">Win</div>
                    <div className="text-green-400 font-bold">${potentialPayout}</div>
                  </div>
                )}
                <button
                  onClick={handlePlaceBet}
                  disabled={!stakeInput || parseFloat(stakeInput) <= 0 || parseFloat(stakeInput) > userBalance}
                  className="bg-sb-blue text-sb-dark font-bold px-4 py-2 rounded text-sm hover:bg-sb-blue-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Place Bet
                </button>
              </div>
              {parseFloat(stakeInput) > userBalance && (
                <p className="text-sb-error text-xs mt-1">Insufficient balance</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Hockey() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'live' | 'upcoming' | 'finished'
  const [recentBets, setRecentBets] = useState([]);
  const [balance, setBalance] = useState(user?.balance ?? 1000);
  const [toast, setToast] = useState(null);

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
    setBalance(prev => prev - betInfo.stake);
    setRecentBets(prev => [betInfo, ...prev].slice(0, 5));
    showToast(`Bet placed: ${betInfo.label} · $${betInfo.stake} to win $${betInfo.payout}`);
  }

  function showToast(msg) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }

  const filteredGames = games.filter(g => {
    const state = g.status?.type?.state;
    if (filter === 'live') return state === 'in';
    if (filter === 'upcoming') return state === 'pre';
    if (filter === 'finished') return state === 'post';
    return true;
  });

  const liveCount = games.filter(g => g.status?.type?.state === 'in').length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-sb-dark border border-sb-blue/50 text-sb-blue px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-auth-spin" style={{ animation: 'none' }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🏒</span>
          <h1 className="text-3xl font-black text-white tracking-tight">NHL Hockey</h1>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              {liveCount} LIVE
            </span>
          )}
        </div>
        <p className="text-sb-muted text-sm">Bet on NHL games using your virtual balance. Live scores powered by ESPN.</p>
      </div>

      {/* Balance + Recent Bets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#060c12] border border-[#1a2535] rounded-xl p-4">
          <div className="text-xs text-sb-muted uppercase tracking-widest mb-1">Your Balance</div>
          <div className="text-2xl font-black text-sb-blue">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="md:col-span-2 bg-[#060c12] border border-[#1a2535] rounded-xl p-4">
          <div className="text-xs text-sb-muted uppercase tracking-widest mb-2">Recent Bets</div>
          {recentBets.length === 0 ? (
            <p className="text-sb-muted text-sm">No bets placed yet this session.</p>
          ) : (
            <div className="space-y-1">
              {recentBets.slice(0, 3).map((b, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-sb-text">{b.label}</span>
                  <span className="text-green-400 font-semibold">+${b.payout}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'live', 'upcoming', 'finished'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all capitalize
              ${filter === f
                ? 'bg-sb-blue text-sb-dark border-sb-blue'
                : 'border-[#1a2535] text-sb-muted hover:border-sb-blue hover:text-sb-blue'
              }`}
          >
            {f === 'live' && liveCount > 0 ? `Live (${liveCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
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
          Failed to load games: {error}. <button onClick={fetchGames} className="underline">Try again</button>
        </div>
      )}
      {!loading && !error && filteredGames.length === 0 && (
        <div className="text-center py-16 text-sb-muted">
          <p className="text-2xl mb-2">🏒</p>
          <p>No {filter === 'all' ? '' : filter} games right now.</p>
          <p className="text-sm mt-1">Check back during the NHL season for live matchups.</p>
        </div>
      )}
      {!loading && !error && filteredGames.map(game => (
        <GameCard
          key={game.id}
          game={game}
          onBet={handleBet}
          userBalance={balance}
        />
      ))}
    </div>
  );
}
