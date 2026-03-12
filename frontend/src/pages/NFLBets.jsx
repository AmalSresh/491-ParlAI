import { useState, useEffect } from "react";

const TEAM_COLORS = {
  KC: "#E31837", BUF: "#00338D", BAL: "#241773", CIN: "#FB4F14",
  PHI: "#004C54", DAL: "#003594", DET: "#0076B6", LAR: "#003594",
  SF:  "#AA0000", NYJ: "#125740", NO:  "#D3BC8D", MIA: "#008E97",
  MIN: "#4F2683", LAC: "#0080C6", GB:  "#203731", NE:  "#002244",
  ARI: "#97233F", ATL: "#A71930", CHI: "#C83803", HOU: "#03202F",
  SEA: "#002244", TB:  "#D50A0A", PIT: "#FFB612", WAS: "#5A1414",
  IND: "#002C5F", JAX: "#006778", DEN: "#FB4F14",
};

const PLAYER_DATA = [
  // ── Top QBs ──
  { name: "Patrick Mahomes",   abbr: "KC",  pos: "QB", pop: "2.1K", passing: 4650.5, passing_tds: 28.5, rushing: 280.5 },
  { name: "Josh Allen",        abbr: "BUF", pos: "QB", pop: "1.8K", passing: 4200.5, passing_tds: 32.5, rushing: 720.5 },
  { name: "Lamar Jackson",     abbr: "BAL", pos: "QB", pop: "1.6K", passing: 3900.5, passing_tds: 26.5, rushing: 850.5 },
  { name: "Joe Burrow",        abbr: "CIN", pos: "QB", pop: "1.1K", passing: 4174.5, passing_tds: 27.5, rushing: 140.5 },
  { name: "Jalen Hurts",       abbr: "PHI", pos: "QB", pop: "1.2K", passing: 3750.5, passing_tds: 24.5, rushing: 680.5 },
  { name: "Dak Prescott",      abbr: "DAL", pos: "QB", pop: "1.4K", passing: 4024.5, passing_tds: 28.5, rushing: 180.5 },
  { name: "Jared Goff",        abbr: "DET", pos: "QB", pop: "812",  passing: 4074.5, passing_tds: 27.5, rushing: 95.5  },
  { name: "Brock Purdy",       abbr: "SF",  pos: "QB", pop: "1.0K", passing: 3900.5, passing_tds: 25.5, rushing: 95.5  },
  { name: "Justin Herbert",    abbr: "LAC", pos: "QB", pop: "950",  passing: 4100.5, passing_tds: 26.5, rushing: 140.5 },
  { name: "Tua Tagovailoa",    abbr: "MIA", pos: "QB", pop: "870",  passing: 4050.5, passing_tds: 27.5, rushing: 95.5  },
  { name: "Jordan Love",       abbr: "GB",  pos: "QB", pop: "920",  passing: 3950.5, passing_tds: 26.5, rushing: 220.5 },
  { name: "C.J. Stroud",       abbr: "HOU", pos: "QB", pop: "940",  passing: 3950.5, passing_tds: 25.5, rushing: 180.5 },
  { name: "Caleb Williams",    abbr: "CHI", pos: "QB", pop: "980",  passing: 3600.5, passing_tds: 22.5, rushing: 380.5 },
  { name: "Jayden Daniels",    abbr: "WAS", pos: "QB", pop: "890",  passing: 3750.5, passing_tds: 23.5, rushing: 580.5 },
  { name: "Trevor Lawrence",   abbr: "JAX", pos: "QB", pop: "760",  passing: 3850.5, passing_tds: 24.5, rushing: 310.5 },
  { name: "Kyler Murray",      abbr: "ARI", pos: "QB", pop: "750",  passing: 3700.5, passing_tds: 23.5, rushing: 480.5 },

  // ── Top RBs ──
  { name: "Christian McCaffrey", abbr: "SF",  pos: "RB", pop: "1.9K", rushing: 1350.5, receiving: 650.5, rushing_tds: 14.5, receptions: 68.5 },
  { name: "Saquon Barkley",      abbr: "PHI", pos: "RB", pop: "1.1K", rushing: 1280.5, receiving: 380.5, rushing_tds: 11.5, receptions: 42.5 },
  { name: "Derrick Henry",       abbr: "NO",  pos: "RB", pop: "780",  rushing: 1100.5, receiving: 220.5, rushing_tds: 12.5, receptions: 26.5 },
  { name: "Bijan Robinson",      abbr: "ATL", pos: "RB", pop: "890",  rushing: 1200.5, receiving: 420.5, rushing_tds: 10.5, receptions: 46.5 },
  { name: "Jahmyr Gibbs",        abbr: "DET", pos: "RB", pop: "860",  rushing: 1180.5, receiving: 440.5, rushing_tds: 10.5, receptions: 48.5 },
  { name: "De'Von Achane",       abbr: "MIA", pos: "RB", pop: "810",  rushing: 1050.5, receiving: 480.5, rushing_tds: 9.5,  receptions: 52.5 },
  { name: "Breece Hall",         abbr: "NYJ", pos: "RB", pop: "920",  rushing: 1150.5, receiving: 520.5, rushing_tds: 9.5,  receptions: 54.5 },
  { name: "Jonathan Taylor",     abbr: "IND", pos: "RB", pop: "740",  rushing: 1100.5, receiving: 280.5, rushing_tds: 9.5,  receptions: 32.5 },
  { name: "Josh Jacobs",         abbr: "GB",  pos: "RB", pop: "680",  rushing: 1050.5, receiving: 320.5, rushing_tds: 9.5,  receptions: 36.5 },
  { name: "James Cook",          abbr: "BUF", pos: "RB", pop: "720",  rushing: 1080.5, receiving: 340.5, rushing_tds: 9.5,  receptions: 38.5 },
  { name: "Isiah Pacheco",       abbr: "KC",  pos: "RB", pop: "650",  rushing: 1020.5, receiving: 260.5, rushing_tds: 9.5,  receptions: 30.5 },
  { name: "Travis Etienne",      abbr: "JAX", pos: "RB", pop: "610",  rushing: 1000.5, receiving: 360.5, rushing_tds: 8.5,  receptions: 40.5 },
  { name: "Kyren Williams",      abbr: "LAR", pos: "RB", pop: "700",  rushing: 1080.5, receiving: 320.5, rushing_tds: 10.5, receptions: 36.5 },
  { name: "Najee Harris",        abbr: "PIT", pos: "RB", pop: "520",  rushing: 980.5,  receiving: 260.5, rushing_tds: 8.5,  receptions: 30.5 },

  // ── Top WRs ──
  { name: "Tyreek Hill",         abbr: "MIA", pos: "WR", pop: "1.5K", receiving: 1450.5, receptions: 118.5, receiving_tds: 10.5 },
  { name: "CeeDee Lamb",         abbr: "DAL", pos: "WR", pop: "1.7K", receiving: 1380.5, receptions: 112.5, receiving_tds: 11.5 },
  { name: "Ja'Marr Chase",       abbr: "CIN", pos: "WR", pop: "1.3K", receiving: 1320.5, receptions: 102.5, receiving_tds: 10.5 },
  { name: "Justin Jefferson",    abbr: "MIN", pos: "WR", pop: "1.1K", receiving: 1280.5, receptions: 98.5,  receiving_tds: 9.5  },
  { name: "Amon-Ra St. Brown",   abbr: "DET", pos: "WR", pop: "980",  receiving: 1250.5, receptions: 108.5, receiving_tds: 8.5  },
  { name: "A.J. Brown",          abbr: "PHI", pos: "WR", pop: "1.0K", receiving: 1220.5, receptions: 88.5,  receiving_tds: 9.5  },
  { name: "Davante Adams",       abbr: "LV",  pos: "WR", pop: "860",  receiving: 1150.5, receptions: 94.5,  receiving_tds: 8.5  },
  { name: "DK Metcalf",          abbr: "SEA", pos: "WR", pop: "880",  receiving: 1120.5, receptions: 82.5,  receiving_tds: 8.5  },
  { name: "Jaylen Waddle",       abbr: "MIA", pos: "WR", pop: "820",  receiving: 1120.5, receptions: 94.5,  receiving_tds: 8.5  },
  { name: "Garrett Wilson",      abbr: "NYJ", pos: "WR", pop: "840",  receiving: 1100.5, receptions: 90.5,  receiving_tds: 7.5  },
  { name: "Stefon Diggs",        abbr: "NE",  pos: "WR", pop: "720",  receiving: 1050.5, receptions: 88.5,  receiving_tds: 7.5  },
  { name: "Mike Evans",          abbr: "TB",  pos: "WR", pop: "750",  receiving: 1050.5, receptions: 76.5,  receiving_tds: 9.5  },
  { name: "Tee Higgins",         abbr: "CIN", pos: "WR", pop: "760",  receiving: 1050.5, receptions: 78.5,  receiving_tds: 7.5  },
  { name: "Puka Nacua",          abbr: "LAR", pos: "WR", pop: "760",  receiving: 1080.5, receptions: 98.5,  receiving_tds: 7.5  },
  { name: "DeVonta Smith",       abbr: "PHI", pos: "WR", pop: "780",  receiving: 1080.5, receptions: 86.5,  receiving_tds: 7.5  },
  { name: "Marvin Harrison Jr.", abbr: "ARI", pos: "WR", pop: "840",  receiving: 1080.5, receptions: 84.5,  receiving_tds: 8.5  },
  { name: "George Pickens",      abbr: "PIT", pos: "WR", pop: "680",  receiving: 1000.5, receptions: 74.5,  receiving_tds: 7.5  },
  { name: "Rashee Rice",         abbr: "KC",  pos: "WR", pop: "720",  receiving: 1020.5, receptions: 82.5,  receiving_tds: 7.5  },
  { name: "Drake London",        abbr: "ATL", pos: "WR", pop: "650",  receiving: 1000.5, receptions: 82.5,  receiving_tds: 7.5  },
  { name: "Chris Olave",         abbr: "NO",  pos: "WR", pop: "690",  receiving: 1020.5, receptions: 82.5,  receiving_tds: 7.5  },
];

const FILTERS = [
  { key: "all",         label: "🔥 Popular"  },
  { key: "passing",     label: "Pass Yards"  },
  { key: "receiving",   label: "Rec Yards"   },
  { key: "rushing",     label: "Rush Yards"  },
  { key: "passing_tds", label: "Pass TDs"    },
  { key: "rushing_tds", label: "Rush TDs"    },
  { key: "receptions",  label: "Receptions"  },
];

function getStatForFilter(player, filter) {
  switch (filter) {
    case "passing":     return player.passing     ? { val: player.passing,     lbl: "SZN Pass Yards" } : null;
    case "receiving":   return player.receiving   ? { val: player.receiving,   lbl: "SZN Rec Yards"  } : null;
    case "rushing":     return player.rushing     ? { val: player.rushing,     lbl: "SZN Rush Yards" } : null;
    case "passing_tds": return player.passing_tds ? { val: player.passing_tds, lbl: "SZN Pass TDs"   } : null;
    case "rushing_tds": return player.rushing_tds ? { val: player.rushing_tds, lbl: "SZN Rush TDs"   } : null;
    case "receptions":  return player.receptions  ? { val: player.receptions,  lbl: "SZN Receptions" } : null;
    default:
      if (player.passing)   return { val: player.passing,   lbl: "SZN Pass Yards" };
      if (player.rushing)   return { val: player.rushing,   lbl: "SZN Rush Yards" };
      if (player.receiving) return { val: player.receiving, lbl: "SZN Rec Yards"  };
      return null;
  }
}

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
    }}>
      {message}
    </div>
  );
}

function PlayerCard({ player, filter, onBet }) {
  const stat = getStatForFilter(player, filter);
  if (!stat) return null;

  const color = TEAM_COLORS[player.abbr] || "#00f6ff";
  const initials = player.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <div
      style={{
        background: "#11131a", border: "1px solid #1f2430",
        borderRadius: "14px", overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#00f6ff";
        e.currentTarget.style.boxShadow = "0 0 20px rgba(0,246,255,0.15)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#1f2430";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top */}
      <div style={{
        background: `linear-gradient(135deg, ${color}22 0%, #11131a 100%)`,
        padding: "1.2rem 1rem 0.9rem",
        display: "flex", flexDirection: "column", alignItems: "center",
        position: "relative",
      }}>
        <span style={{ position: "absolute", top: 10, right: 10, fontSize: "0.7rem", fontWeight: 700, color: "#ffc107" }}>
          🔥 {player.pop}
        </span>
        <div style={{
          width: 68, height: 68, borderRadius: "50%",
          background: `${color}18`, border: `2px solid ${color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "0.6rem",
        }}>
          <span style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{initials}</span>
        </div>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00f6ff", letterSpacing: "1px", textTransform: "uppercase" }}>
          {player.abbr} – {player.pos}
        </span>
        <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f3f4f6", marginTop: 2, textAlign: "center" }}>
          {player.name}
        </span>
        <span style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: 3 }}>
          2025–26 Season Projection
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "0.9rem 1rem", borderTop: "1px solid #1f2430" }}>
        <div style={{ textAlign: "center", marginBottom: "0.8rem" }}>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f3f4f6", lineHeight: 1 }}>{stat.val}</div>
          <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 3 }}>{stat.lbl}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <button
            onClick={() => onBet(`${player.name} ↓ Less ${stat.val} ${stat.lbl}`)}
            style={{
              padding: "0.5rem", borderRadius: "8px", cursor: "pointer",
              background: "rgba(255,61,87,0.1)", border: "1px solid rgba(255,61,87,0.3)",
              color: "#ff3d57", fontSize: "0.78rem", fontWeight: 700, transition: "background 0.18s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,61,87,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,61,87,0.1)"}
          >↓ Less</button>
          <button
            onClick={() => onBet(`${player.name} ↑ More ${stat.val} ${stat.lbl}`)}
            style={{
              padding: "0.5rem", borderRadius: "8px", cursor: "pointer",
              background: "rgba(0,246,255,0.08)", border: "1px solid rgba(0,246,255,0.3)",
              color: "#00f6ff", fontSize: "0.78rem", fontWeight: 700, transition: "background 0.18s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,246,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,246,255,0.08)"}
          >↑ More</button>
        </div>
      </div>
    </div>
  );
}

export default function NFLBets() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast]   = useState(null);

  const filtered = PLAYER_DATA.filter((p) => {
    const hasStat = getStatForFilter(p, filter) !== null;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.abbr.toLowerCase().includes(search.toLowerCase());
    return hasStat && matchesSearch;
  });

  return (
    <div className="text-sb-text">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-extrabold tracking-wide">🏈 NFL</h1>
        <span style={{
          background: "rgba(255,193,7,0.12)", color: "#ffc107",
          border: "1px solid rgba(255,193,7,0.3)",
          fontSize: "0.7rem", fontWeight: 600,
          padding: "4px 12px", borderRadius: "20px",
        }}>⏳ Offseason 2025–26</span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search player or team…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: "#11131a", border: "1px solid #404040",
            borderRadius: "10px", padding: "0.5rem 1rem",
            color: "#f3f4f6", fontSize: "0.88rem", outline: "none",
            width: "260px", transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "#00f6ff"}
          onBlur={e => e.target.style.borderColor = "#404040"}
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "0.4rem 1rem", borderRadius: "20px",
              border: filter === f.key ? "1px solid #00f6ff" : "1px solid #404040",
              background: filter === f.key ? "rgba(0,246,255,0.1)" : "#11131a",
              color: filter === f.key ? "#00f6ff" : "#9ca3af",
              fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap",
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold tracking-widest text-sb-muted uppercase">
          Player Season Props — {filtered.length} players
        </span>
        <div className="flex-1 h-px bg-[#1f2430]" />
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <p className="text-sb-muted">No players found.</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: "1rem",
        }}>
          {filtered.map((p) => (
            <PlayerCard
              key={p.name}
              player={p}
              filter={filter}
              onBet={msg => setToast(`✅ Added to slip:\n${msg}`)}
            />
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}