import { useEffect, useState } from "react";

// ── SLEEPER API ───────────────────────────────────────────────────────────────
const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl";
const SLEEPER_STATS_URL   = (playerId) =>
  `https://api.sleeper.app/stats/nfl/player/${playerId}?season_type=regular&season=2025`;

// ── CACHE CONFIG ──────────────────────────────────────────────────────────────
const CACHE_KEY    = "sleeper_nfl_players";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── TEAM COLORS ───────────────────────────────────────────────────────────────
const TEAM_COLORS = {
  KC:  "#E31837", BUF: "#00338D", BAL: "#241773", CIN: "#FB4F14",
  PHI: "#004C54", DAL: "#003594", DET: "#0076B6", LAR: "#003594",
  SF:  "#AA0000", NYJ: "#125740", NO:  "#D3BC8D", MIA: "#008E97",
  MIN: "#4F2683", LAC: "#0080C6", GB:  "#203731", NE:  "#002244",
  ARI: "#97233F", ATL: "#A71930", CHI: "#C83803", HOU: "#03202F",
  SEA: "#002244", TB:  "#D50A0A", PIT: "#FFB612", WAS: "#5A1414",
  IND: "#002C5F", JAX: "#006778", DEN: "#FB4F14", LV:  "#A5ACAF",
  NYG: "#0B2265", TEN: "#0C2340", CAR: "#0085CA", CLE: "#FF3C00",
};

// ── FUTURES DATA ──────────────────────────────────────────────────────────────
const FUTURES = {
  superBowl: {
    title: "🏆 Super Bowl LXI Winner",
    subtitle: "2026–27 Projected Odds",
    items: [
      { label: "Kansas City Chiefs",      abbr: "KC",  odds: "+500"  },
      { label: "Philadelphia Eagles",     abbr: "PHI", odds: "+650"  },
      { label: "Buffalo Bills",           abbr: "BUF", odds: "+800"  },
      { label: "Baltimore Ravens",        abbr: "BAL", odds: "+900"  },
      { label: "San Francisco 49ers",     abbr: "SF",  odds: "+1000" },
      { label: "Detroit Lions",           abbr: "DET", odds: "+1100" },
      { label: "Seattle Seahawks",        abbr: "SEA", odds: "+1200" },
      { label: "Houston Texans",          abbr: "HOU", odds: "+1400" },
      { label: "Cincinnati Bengals",      abbr: "CIN", odds: "+1600" },
      { label: "Dallas Cowboys",          abbr: "DAL", odds: "+1800" },
    ],
  },
  mvp: {
    title: "🎖️ NFL MVP",
    subtitle: "2026–27 Projected Odds",
    items: [
      { label: "Josh Allen",          abbr: "BUF", odds: "+400"  },
      { label: "Patrick Mahomes",     abbr: "KC",  odds: "+500"  },
      { label: "Lamar Jackson",       abbr: "BAL", odds: "+600"  },
      { label: "Jalen Hurts",         abbr: "PHI", odds: "+900"  },
      { label: "Joe Burrow",          abbr: "CIN", odds: "+1000" },
      { label: "Jayden Daniels",      abbr: "WAS", odds: "+1200" },
      { label: "Caleb Williams",      abbr: "CHI", odds: "+1400" },
      { label: "C.J. Stroud",         abbr: "HOU", odds: "+1600" },
      { label: "Brock Purdy",         abbr: "SF",  odds: "+1800" },
      { label: "Justin Herbert",      abbr: "LAC", odds: "+2000" },
    ],
  },
  offensivePlayer: {
    title: "⚡ Offensive Player of the Year",
    subtitle: "2026–27 Projected Odds",
    items: [
      { label: "CeeDee Lamb",            abbr: "DAL", odds: "+500"  },
      { label: "Ja'Marr Chase",          abbr: "CIN", odds: "+600"  },
      { label: "Justin Jefferson",       abbr: "MIN", odds: "+700"  },
      { label: "Tyreek Hill",            abbr: "MIA", odds: "+900"  },
      { label: "Christian McCaffrey",    abbr: "SF",  odds: "+1000" },
      { label: "Saquon Barkley",         abbr: "PHI", odds: "+1200" },
      { label: "Marvin Harrison Jr.",    abbr: "ARI", odds: "+1400" },
      { label: "Amon-Ra St. Brown",      abbr: "DET", odds: "+1600" },
    ],
  },
  rushingTitle: {
    title: "🏃 Rushing Title",
    subtitle: "2026–27 Projected Odds",
    items: [
      { label: "Derrick Henry",          abbr: "NO",  odds: "+450"  },
      { label: "Saquon Barkley",         abbr: "PHI", odds: "+600"  },
      { label: "Christian McCaffrey",    abbr: "SF",  odds: "+700"  },
      { label: "Bijan Robinson",         abbr: "ATL", odds: "+900"  },
      { label: "Jahmyr Gibbs",           abbr: "DET", odds: "+1000" },
      { label: "Breece Hall",            abbr: "NYJ", odds: "+1200" },
      { label: "James Cook",             abbr: "BUF", odds: "+1400" },
      { label: "Jonathan Taylor",        abbr: "IND", odds: "+1600" },
    ],
  },
  receivingTitle: {
    title: "🎯 Receiving Title",
    subtitle: "2026–27 Projected Odds",
    items: [
      { label: "Tyreek Hill",            abbr: "MIA", odds: "+400"  },
      { label: "CeeDee Lamb",            abbr: "DAL", odds: "+500"  },
      { label: "Ja'Marr Chase",          abbr: "CIN", odds: "+650"  },
      { label: "Justin Jefferson",       abbr: "MIN", odds: "+700"  },
      { label: "Amon-Ra St. Brown",      abbr: "DET", odds: "+900"  },
      { label: "A.J. Brown",             abbr: "PHI", odds: "+1100" },
      { label: "Garrett Wilson",         abbr: "NYJ", odds: "+1300" },
      { label: "DK Metcalf",             abbr: "SEA", odds: "+1500" },
    ],
  },
};

// ── TOP PLAYERS ───────────────────────────────────────────────────────────────
const TARGET_PLAYERS = [
  "Patrick Mahomes", "Josh Allen", "Lamar Jackson", "Joe Burrow",
  "Jalen Hurts", "Dak Prescott", "Jared Goff", "Brock Purdy",
  "Justin Herbert", "Tua Tagovailoa", "Jordan Love", "C.J. Stroud",
  "Caleb Williams", "Jayden Daniels", "Trevor Lawrence", "Kyler Murray",
  "Christian McCaffrey", "Saquon Barkley", "Derrick Henry", "Bijan Robinson",
  "Jahmyr Gibbs", "De'Von Achane", "Breece Hall", "Jonathan Taylor",
  "Josh Jacobs", "James Cook", "Isiah Pacheco", "Travis Etienne",
  "Kyren Williams", "Najee Harris",
  "Tyreek Hill", "CeeDee Lamb", "Ja'Marr Chase", "Justin Jefferson",
  "Amon-Ra St. Brown", "A.J. Brown", "Davante Adams", "DK Metcalf",
  "Jaylen Waddle", "Garrett Wilson", "Stefon Diggs", "Mike Evans",
  "Tee Higgins", "Puka Nacua", "DeVonta Smith", "Marvin Harrison",
  "George Pickens", "Rashee Rice", "Drake London", "Chris Olave",
];

// ── FILTERS ───────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all",       label: "🔥 All"      },
  { key: "QB",        label: "QBs"         },
  { key: "RB",        label: "RBs"         },
  { key: "WR",        label: "WRs"         },
  { key: "passing",   label: "Pass Yards"  },
  { key: "rushing",   label: "Rush Yards"  },
  { key: "receiving", label: "Rec Yards"   },
];

// ── PAGE TABS ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "props",   label: "Player Props" },
  { key: "futures", label: "Futures & Awards" },
];

// ── STAT DISPLAY HELPER ───────────────────────────────────────────────────────
function getDisplayStat(stats, pos, filter) {
  if (!stats) return null;
  if (filter === "passing")   return stats.pass_yd ? { val: stats.pass_yd, lbl: "2025 Pass Yards" } : null;
  if (filter === "rushing")   return stats.rush_yd ? { val: stats.rush_yd, lbl: "2025 Rush Yards" } : null;
  if (filter === "receiving") return stats.rec_yd  ? { val: stats.rec_yd,  lbl: "2025 Rec Yards"  } : null;
  if (pos === "QB" && stats.pass_yd) return { val: stats.pass_yd, lbl: "2025 Pass Yards" };
  if (pos === "RB" && stats.rush_yd) return { val: stats.rush_yd, lbl: "2025 Rush Yards" };
  if (pos === "WR" && stats.rec_yd)  return { val: stats.rec_yd,  lbl: "2025 Rec Yards"  };
  if (pos === "TE" && stats.rec_yd)  return { val: stats.rec_yd,  lbl: "2025 Rec Yards"  };
  if (stats.pass_yd) return { val: stats.pass_yd, lbl: "2025 Pass Yards" };
  if (stats.rush_yd) return { val: stats.rush_yd, lbl: "2025 Rush Yards" };
  if (stats.rec_yd)  return { val: stats.rec_yd,  lbl: "2025 Rec Yards"  };
  return null;
}

// ── FETCH WITH CACHE ──────────────────────────────────────────────────────────
async function fetchAllPlayers() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL_MS) return data;
    }
  } catch {}
  const res = await fetch(SLEEPER_PLAYERS_URL);
  if (!res.ok) throw new Error("Failed to fetch Sleeper players");
  const data = await res.json();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {}
  return data;
}

async function fetchPlayerStats(playerId) {
  try {
    const res = await fetch(SLEEPER_STATS_URL(playerId));
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: "2rem", right: "2rem", zIndex: 999,
      background: "#11131a", border: "1px solid #00f6ff",
      color: "#f3f4f6", padding: "0.85rem 1.2rem", borderRadius: "12px",
      fontSize: "0.84rem", lineHeight: 1.5, whiteSpace: "pre-line",
      boxShadow: "0 0 24px rgba(0,246,255,0.2)", maxWidth: "280px",
      animation: "fadeSlideIn 0.3s ease",
    }}>{message}</div>
  );
}

// ── PLAYER CARD ───────────────────────────────────────────────────────────────
function PlayerCard({ player, filter, onBet }) {
  const stat = getDisplayStat(player.stats, player.pos, filter);
  if (!stat) return null;
  const color    = TEAM_COLORS[player.team] || "#00f6ff";
  const initials = player.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const extraStats = [];
  if (player.stats) {
    if (player.stats.pass_yd && stat.lbl !== "2025 Pass Yards") extraStats.push({ val: player.stats.pass_yd, lbl: "Pass Yards" });
    if (player.stats.pass_td) extraStats.push({ val: player.stats.pass_td, lbl: "Pass TDs" });
    if (player.stats.rush_yd && stat.lbl !== "2025 Rush Yards") extraStats.push({ val: player.stats.rush_yd, lbl: "Rush Yards" });
    if (player.stats.rush_td) extraStats.push({ val: player.stats.rush_td, lbl: "Rush TDs" });
    if (player.stats.rec_yd  && stat.lbl !== "2025 Rec Yards")  extraStats.push({ val: player.stats.rec_yd,  lbl: "Rec Yards" });
    if (player.stats.rec)     extraStats.push({ val: player.stats.rec,     lbl: "Receptions" });
    if (player.stats.rec_td)  extraStats.push({ val: player.stats.rec_td,  lbl: "Rec TDs" });
  }
  return (
    <div style={{ background: "#11131a", border: "1px solid #1f2430", borderRadius: "14px", overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#00f6ff"; e.currentTarget.style.boxShadow = "0 0 20px rgba(0,246,255,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1f2430"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ background: `linear-gradient(135deg, ${color}22 0%, #11131a 100%)`, padding: "1.2rem 1rem 0.9rem", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: `${color}18`, border: `2px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.6rem" }}>
          <span style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{initials}</span>
        </div>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00f6ff", letterSpacing: "1px", textTransform: "uppercase" }}>{player.team} – {player.pos}</span>
        <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f3f4f6", marginTop: 2, textAlign: "center" }}>{player.name}</span>
        <span style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: 3 }}>2025 Season Stats</span>
      </div>
      <div style={{ padding: "0.9rem 1rem", borderTop: "1px solid #1f2430" }}>
        <div style={{ textAlign: "center", marginBottom: "0.6rem" }}>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f3f4f6", lineHeight: 1 }}>{Math.round(stat.val)}</div>
          <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 2 }}>{stat.lbl}</div>
        </div>
        {extraStats.length > 0 && (
          <div style={{ marginBottom: "0.7rem" }}>
            {extraStats.slice(0, 3).map((s) => (
              <div key={s.lbl} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid #1f243033" }}>
                <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{s.lbl}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7494" }}>{Math.round(s.val)}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <button onClick={() => onBet(`${player.name} ↓ Less ${Math.round(stat.val)} ${stat.lbl}`)}
            style={{ padding: "0.5rem", borderRadius: "8px", cursor: "pointer", background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)", color: "#ff3d57", fontSize: "0.78rem", fontWeight: 700, transition: "background 0.18s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,61,87,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,61,87,0.1)"}
          >↓ Less</button>
          <button onClick={() => onBet(`${player.name} ↑ More ${Math.round(stat.val)} ${stat.lbl}`)}
            style={{ padding: "0.5rem", borderRadius: "8px", cursor: "pointer", background: "rgba(0,246,255,0.08)", border: "1px solid rgba(0,246,255,0.3)", color: "#00f6ff", fontSize: "0.78rem", fontWeight: 700, transition: "background 0.18s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,246,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,246,255,0.08)"}
          >↑ More</button>
        </div>
      </div>
    </div>
  );
}

// ── FUTURES TABLE ─────────────────────────────────────────────────────────────
function FuturesTable({ category, onBet }) {
  const { title, subtitle, items } = FUTURES[category];
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div className="flex items-center gap-3 mb-3">
        <div>
          <span className="text-xs font-bold tracking-widest text-sb-muted uppercase">{title}</span>
          <span style={{ marginLeft: "0.5rem", fontSize: "0.65rem", color: "#ffc107", background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.25)", padding: "2px 8px", borderRadius: "10px" }}>
            Projected
          </span>
        </div>
        <div className="flex-1 h-px bg-[#1f2430]" />
      </div>
      <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginBottom: "0.8rem" }}>{subtitle}</p>
      <div style={{ borderRadius: "12px", border: "1px solid #1f2430", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1f2430" }}>
              {["#", "Name", "Odds", ""].map((h) => (
                <th key={h} style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const color = TEAM_COLORS[item.abbr] || "#00f6ff";
              return (
                <tr key={item.label}
                  style={{ borderBottom: i < items.length - 1 ? "1px solid #1f2430" : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#151820"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "0.7rem 1rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.85rem" }}>{i + 1}</td>
                  <td style={{ padding: "0.7rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color }}>
                        {item.abbr}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{item.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.7rem 1rem", color: "#00f6ff", fontWeight: 700, fontFamily: "monospace", fontSize: "1rem" }}>{item.odds}</td>
                  <td style={{ padding: "0.7rem 1rem" }}>
                    <button
                      onClick={() => onBet(`${item.label} — ${title} @ ${item.odds}`)}
                      style={{ padding: "0.3rem 0.9rem", borderRadius: "6px", cursor: "pointer", background: "rgba(0,246,255,0.08)", border: "1px solid #00f6ff", color: "#00f6ff", fontSize: "0.75rem", fontWeight: 700, transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#00f6ff"; e.currentTarget.style.color = "#000"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,246,255,0.08)"; e.currentTarget.style.color = "#00f6ff"; }}
                    >Bet</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── SKELETON CARD ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: "#11131a", border: "1px solid #1f2430", borderRadius: "14px", overflow: "hidden" }}>
      <div style={{ height: 160, background: "linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      <div style={{ padding: "0.9rem 1rem" }}>
        <div style={{ height: 12, width: "60%", borderRadius: 6, background: "linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginBottom: 8 }} />
        <div style={{ height: 36, width: "70%", margin: "0 auto 10px", borderRadius: 6, background: "linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 12, width: "80%", borderRadius: 6, background: "linear-gradient(90deg, #1a1e2a 25%, #1f2435 50%, #1a1e2a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function NFLBets() {
  const [players,     setPlayers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all");
  const [toast,       setToast]       = useState(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [tab,         setTab]         = useState("props");
  const [fromCache,   setFromCache]   = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL_MS) setFromCache(true);
          }
        } catch {}

        const allPlayers = await fetchAllPlayers();
        const targets = [];
        Object.entries(allPlayers).forEach(([id, p]) => {
          if (!p.full_name || !p.position || !p.team) return;
          if (!["QB", "RB", "WR", "TE"].includes(p.position)) return;
          const isTarget = TARGET_PLAYERS.some(name =>
            p.full_name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(p.full_name.toLowerCase())
          );
          if (!isTarget) return;
          targets.push({ id, name: p.full_name, pos: p.position, team: p.team });
        });

        const results = await Promise.allSettled(
          targets.map(async (p) => {
            const stats = await fetchPlayerStats(p.id);
            setLoadedCount(c => c + 1);
            return { ...p, stats: stats?.stats ?? null };
          })
        );

        const loaded = results
          .filter(r => r.status === "fulfilled" && r.value.stats)
          .map(r => r.value)
          .sort((a, b) => {
            const getMain = (p) => p.stats?.pass_yd || p.stats?.rush_yd || p.stats?.rec_yd || 0;
            return getMain(b) - getMain(a);
          });

        setPlayers(loaded);
      } catch (err) {
        console.error("Sleeper fetch error:", err);
        setError("Failed to load NFL stats. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all"       ? true :
      filter === "QB"        ? p.pos === "QB" :
      filter === "RB"        ? p.pos === "RB" :
      filter === "WR"        ? p.pos === "WR" :
      filter === "passing"   ? !!p.stats?.pass_yd :
      filter === "rushing"   ? !!p.stats?.rush_yd :
      filter === "receiving" ? !!p.stats?.rec_yd  : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="text-sb-text">
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-extrabold tracking-wide">🏈 NFL</h1>
        <span style={{ background: "rgba(0,246,255,0.08)", color: "#00f6ff", border: "1px solid rgba(0,246,255,0.3)", fontSize: "0.7rem", fontWeight: 600, padding: "4px 12px", borderRadius: "20px" }}>
          📊 2025 Season Stats
        </span>
        {fromCache && !loading && <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>⚡ Cached</span>}
        {loading && <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Loading players… {loadedCount}/{TARGET_PLAYERS.length}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #1f2430", paddingBottom: "0" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: "0.5rem 1.2rem", background: "transparent", border: "none",
              borderBottom: tab === t.key ? "2px solid #00f6ff" : "2px solid transparent",
              color: tab === t.key ? "#00f6ff" : "#9ca3af",
              fontSize: "0.88rem", fontWeight: 600, cursor: "pointer",
              transition: "all 0.18s", marginBottom: "-1px",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── PLAYER PROPS TAB ── */}
      {tab === "props" && (
        <>
          {/* Search */}
          <div className="mb-4">
            <input type="text" placeholder="Search player or team…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: "#11131a", border: "1px solid #404040", borderRadius: "10px", padding: "0.5rem 1rem", color: "#f3f4f6", fontSize: "0.88rem", outline: "none", width: "260px", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#00f6ff"}
              onBlur={e  => e.target.style.borderColor = "#404040"}
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: "0.4rem 1rem", borderRadius: "20px", border: filter === f.key ? "1px solid #00f6ff" : "1px solid #404040", background: filter === f.key ? "rgba(0,246,255,0.1)" : "#11131a", color: filter === f.key ? "#00f6ff" : "#9ca3af", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap" }}
              >{f.label}</button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-widest text-sb-muted uppercase">
              Player Props — {loading ? "loading…" : `${filtered.length} players`}
            </span>
            <div className="flex-1 h-px bg-[#1f2430]" />
          </div>

          {error && <p className="text-sb-error">{error}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
              : filtered.length === 0
                ? <p className="text-sb-muted">No players found.</p>
                : filtered.map((p) => (
                    <PlayerCard key={p.id} player={p} filter={filter} onBet={msg => setToast(`✅ Added to slip:\n${msg}`)} />
                  ))
            }
          </div>
        </>
      )}

      {/* ── FUTURES & AWARDS TAB ── */}
      {tab === "futures" && (
        <div>
          {/* Disclaimer */}
          <div style={{ background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.2)", borderRadius: "10px", padding: "0.7rem 1rem", marginBottom: "1.8rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1rem" }}>⚠️</span>
            <span style={{ fontSize: "0.78rem", color: "#ffc107" }}>
              These are <strong>projected odds</strong> for the 2026–27 NFL season. Live odds will be available when the season opens.
            </span>
          </div>

          {Object.keys(FUTURES).map((cat) => (
            <FuturesTable key={cat} category={cat} onBet={msg => setToast(`✅ Added to slip:\n${msg}`)} />
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}