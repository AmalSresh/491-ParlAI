import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const ESPN_NHL_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard";
const API_BASE = "/api";

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 4000);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 999,
        background: "#11131a",
        border: "1px solid #00f6ff",
        color: "#f3f4f6",
        padding: "0.85rem 1.2rem",
        borderRadius: "12px",
        fontSize: "0.84rem",
        lineHeight: 1.5,
        whiteSpace: "pre-line",
        boxShadow: "0 0 24px rgba(0,246,255,0.2)",
        maxWidth: "280px",
      }}
    >
      {message}
    </div>
  );
}

// ── BET MODAL ─────────────────────────────────────────────────────────────────
function BetModal({ bet, userBalance, onClose, onConfirm }) {
  const [stake, setStake] = useState(10);
  const payout = (stake * bet.odds).toFixed(2);
  const isInvalid = stake <= 0 || stake > userBalance;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#11131a",
          border: "1px solid #00f6ff",
          borderRadius: "16px",
          padding: "1.5rem",
          width: "320px",
          boxShadow: "0 0 40px rgba(0,246,255,0.2)",
        }}
      >
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            color: "#f3f4f6",
          }}
        >
          Place Bet
        </h3>
        <p
          style={{
            fontSize: "0.82rem",
            color: "#9ca3af",
            marginBottom: "0.3rem",
          }}
        >
          {bet.awayTeam} @ {bet.homeTeam}
        </p>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#f3f4f6",
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          <span style={{ color: "#00f6ff" }}>{bet.selection}</span>
        </p>

        <label
          style={{
            fontSize: "0.75rem",
            color: "#9ca3af",
            display: "block",
            marginBottom: "0.3rem",
          }}
        >
          Stake ($) — Balance: ${Number(userBalance).toFixed(2)}
        </label>
        <input
          type="number"
          min="1"
          max={userBalance}
          value={stake}
          onChange={(e) => setStake(Number(e.target.value))}
          style={{
            width: "100%",
            background: "#0d0f14",
            border: `1px solid ${isInvalid ? "#ff3d57" : "#404040"}`,
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            color: "#f3f4f6",
            fontSize: "1rem",
            outline: "none",
            marginBottom: "0.8rem",
            boxSizing: "border-box",
          }}
        />
        {stake > userBalance && (
          <p
            style={{
              fontSize: "0.72rem",
              color: "#ff3d57",
              marginBottom: "0.6rem",
              marginTop: "-0.6rem",
            }}
          >
            Exceeds your balance
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.8rem",
            color: "#9ca3af",
            marginBottom: "0.6rem",
          }}
        >
          <span>Odds</span>
          <span style={{ color: "#00f6ff", fontWeight: 700 }}>
            ×{bet.odds}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.8rem",
            color: "#9ca3af",
            marginBottom: "1.2rem",
          }}
        >
          <span>Potential Payout</span>
          <span style={{ color: "#00c853", fontWeight: 700 }}>${payout}</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "0.6rem",
              borderRadius: "8px",
              cursor: "pointer",
              background: "transparent",
              border: "1px solid #404040",
              color: "#9ca3af",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            Cancel
          </button>
          <button
            disabled={isInvalid}
            onClick={() => onConfirm({ ...bet, stake })}
            style={{
              padding: "0.6rem",
              borderRadius: "8px",
              cursor: isInvalid ? "not-allowed" : "pointer",
              background: isInvalid ? "#1f2430" : "#00f6ff",
              border: "none",
              color: isInvalid ? "#9ca3af" : "#000",
              fontWeight: 700,
              fontSize: "0.85rem",
              opacity: isInvalid ? 0.5 : 1,
            }}
          >
            Confirm Bet
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ODDS BUTTON ───────────────────────────────────────────────────────────────
function OddsButton({ label, value, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-3 py-2 rounded text-sm font-bold border transition-all duration-150
        ${
          active
            ? "bg-sb-blue text-sb-dark border-sb-blue shadow-[0_0_12px_rgba(0,246,255,0.4)]"
            : "bg-[#0a1520] text-sb-text border-[#1e3040] hover:border-sb-blue hover:text-sb-blue"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span className="block text-[10px] font-normal opacity-70 mb-0.5">
        {label}
      </span>
      <span>{value}</span>
    </button>
  );
}

// ── GAME CARD ─────────────────────────────────────────────────────────────────
function GameCard({ game, onBetRequest, betPlaced }) {
  const [selectedBet, setSelectedBet] = useState(null);

  const home = game.competitions?.[0]?.competitors?.find(
    (c) => c.homeAway === "home",
  );
  const away = game.competitions?.[0]?.competitors?.find(
    (c) => c.homeAway === "away",
  );
  const status = game.status?.type;
  const isLive = status?.state === "in";
  const isFinished = status?.state === "post";
  const isScheduled = status?.state === "pre";

  if (!home || !away) return null;

  const homeTeam = home.team;
  const awayTeam = away.team;
  const homeScore = home.score;
  const awayScore = away.score;
  const period = game.status?.period;
  const clock = game.status?.displayClock;

  // Seeded odds — stable per game, no flicker on re-render
  const seed = game.id ? game.id.charCodeAt(0) / 255 : 0.5;
  const homeOdds = (1.4 + seed * 1.4).toFixed(2);
  const awayOdds = (1.4 + (1 - seed) * 1.4).toFixed(2);
  const overOdds = "1.90";
  const underOdds = "1.90";

  const handleSelect = (type, selection, odds) => {
    if (betPlaced || isFinished) return;
    setSelectedBet(selectedBet?.type === type ? null : { type, selection, odds });
  };

  const handleBetClick = () => {
    if (!selectedBet) return;
    onBetRequest({
      gameId: game.id,
      homeTeam: homeTeam.displayName,
      awayTeam: awayTeam.displayName,
      betType: selectedBet.type.startsWith("ml") ? "moneyline" : "total_goals",
      selection: selectedBet.selection,
      odds: selectedBet.odds,
    });
  };

  return (
    <div
      className={`
        rounded-xl border p-4 mb-3 transition-all
        ${isLive ? "border-[#00f6ff44] bg-[#050e14] shadow-[0_0_20px_rgba(0,246,255,0.08)]" : "border-[#1a2535] bg-[#060c12]"}
        ${isFinished ? "opacity-60" : ""}
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
              {new Date(game.date).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
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

        <div className="text-center px-4">
          {isLive || isFinished ? (
            <div className="text-2xl font-black text-white tracking-tight">
              {awayScore}{" "}
              <span className="text-sb-muted text-lg">–</span> {homeScore}
            </div>
          ) : (
            <div className="text-lg font-bold text-sb-muted">VS</div>
          )}
        </div>

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
                      active={selectedBet?.type === "ml_away"}
                      onClick={() =>
                        handleSelect(
                          "ml_away",
                          `${awayTeam.displayName} ML`,
                          parseFloat(awayOdds),
                        )
                      }
                      disabled={false}
                    />
                    <OddsButton
                      label={homeTeam.abbreviation}
                      value={`×${homeOdds}`}
                      active={selectedBet?.type === "ml_home"}
                      onClick={() =>
                        handleSelect(
                          "ml_home",
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
                      active={selectedBet?.type === "total_over"}
                      onClick={() =>
                        handleSelect(
                          "total_over",
                          "Over 5.5 Goals",
                          parseFloat(overOdds),
                        )
                      }
                      disabled={false}
                    />
                    <OddsButton
                      label="Under 5.5"
                      value={`×${underOdds}`}
                      active={selectedBet?.type === "total_under"}
                      onClick={() =>
                        handleSelect(
                          "total_under",
                          "Under 5.5 Goals",
                          parseFloat(underOdds),
                        )
                      }
                      disabled={false}
                    />
                  </div>
                </div>
              </div>

              {selectedBet && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleBetClick}
                    className="bg-sb-blue text-sb-dark font-bold px-5 py-2 rounded text-sm hover:bg-sb-blue-light transition-colors"
                  >
                    Review Bet →
                  </button>
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
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [recentBets, setRecentBets] = useState([]);
  const [balance, setBalance] = useState(user?.balance ?? 1000);
  const [toast, setToast] = useState(null);
  const [pendingBet, setPendingBet] = useState(null);
  const [bettedGames, setBettedGames] = useState(new Set());

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ESPN_NHL_SCOREBOARD);
      if (!res.ok) throw new Error("Failed to fetch NHL games");
      const data = await res.json();
      setGames(data.events ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmBet(bet) {
    try {
      const res = await fetch(`${API_BASE}/nhl/bets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bet),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(`❌ ${data.error || "Failed to place bet"}`);
      } else {
        setBettedGames((prev) => new Set([...prev, bet.gameId]));
        setBalance(data.newBalance);
        setRecentBets((prev) =>
          [
            {
              label: bet.selection,
              stake: bet.stake,
              payout: data.potentialPayout,
            },
            ...prev,
          ].slice(0, 5),
        );
        setToast(
          `✅ Bet placed!\n${bet.awayTeam} @ ${bet.homeTeam}\n${bet.selection}\nPayout: $${data.potentialPayout}\nBalance: $${data.newBalance}`,
        );
      }
    } catch {
      setToast("❌ Failed to place bet. Please try again.");
    } finally {
      setPendingBet(null);
    }
  }

  const filteredGames = games.filter((g) => {
    const state = g.status?.type?.state;
    if (filter === "live") return state === "in";
    if (filter === "upcoming") return state === "pre";
    if (filter === "finished") return state === "post";
    return true;
  });

  const liveCount = games.filter(
    (g) => g.status?.type?.state === "in",
  ).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Bet Modal */}
      {pendingBet && (
        <BetModal
          bet={pendingBet}
          userBalance={balance}
          onClose={() => setPendingBet(null)}
          onConfirm={handleConfirmBet}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

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
            ${Number(balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
        {["all", "live", "upcoming", "finished"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all capitalize
              ${
                filter === f
                  ? "bg-sb-blue text-sb-dark border-sb-blue"
                  : "border-[#1a2535] text-sb-muted hover:border-sb-blue hover:text-sb-blue"
              }`}
          >
            {f === "live" && liveCount > 0
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
          Failed to load games: {error}.{" "}
          <button onClick={fetchGames} className="underline">
            Try again
          </button>
        </div>
      )}
      {!loading && !error && filteredGames.length === 0 && (
        <div className="text-center py-16 text-sb-muted">
          <p className="text-2xl mb-2">🏒</p>
          <p>No {filter === "all" ? "" : filter} games right now.</p>
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
            onBetRequest={setPendingBet}
            betPlaced={bettedGames.has(game.id)}
          />
        ))}
    </div>
  );
}
