import { useEffect, useMemo, useState } from "react";
import { fetchNbaScoreboardWeek, getNbaWeekDateKeys } from "../api/nba/nbaBetsClient";

function formatKickoff(iso) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function formatDayHeading(iso) {
  if (!iso) return "Date TBA";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "Date TBA";
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function daySortKey(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toDateString();
}

function getStatusLabel(state) {
  switch (state) {
    case "pre":
    case "post":
    case "in":
      return state.toUpperCase();
    default:
      return state ? String(state).toUpperCase() : "—";
  }
}

function GameCard({ game }) {
  const homeScore = game.home.score ?? null;
  const awayScore = game.away.score ?? null;
  // ESPN uses type.state "post" for finished games (not "final" / "completed").
  const isFinal = game.status?.typeState === "post";

  return (
    <div className="rounded-xl border border-sb-border bg-sb-bg/60 overflow-hidden">
      <div className="p-4 border-b border-sb-border flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-widest text-sb-muted font-bold">
            {game.league} • {game.seasonDisplay}
          </div>
          <div className="text-sb-text font-extrabold text-lg mt-1">
            {game.away.abbr} @ {game.home.abbr}
          </div>
          <div className="text-sb-muted text-sm mt-1">
            {formatKickoff(game.startDate)} • {getStatusLabel(game.status?.typeState)}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sb-muted text-xs font-bold">{game.home.abbr}</div>
            <div className={`text-2xl font-extrabold ${isFinal ? "text-sb-text" : "text-sb-blue"}`}>
              {homeScore !== null ? homeScore : "—"}
            </div>
          </div>
          <div className="text-left">
            <div className="text-sb-muted text-xs font-bold">{game.away.abbr}</div>
            <div className={`text-2xl font-extrabold ${isFinal ? "text-sb-text" : "text-sb-blue"}`}>
              {awayScore !== null ? awayScore : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-sb-text font-extrabold text-sm">{game.away.name} vs {game.home.name}</div>
          <div className="text-sb-muted text-xs mt-1">
            {game.status?.clock ? `Clock: ${game.status.clock}` : "Tip-off clock not provided"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-sb-border bg-sb-bg px-3 py-2 text-xs font-extrabold text-sb-text hover:border-sb-blue hover:text-sb-blue transition-colors cursor-pointer"
            disabled
            title="Connect your Odds API to show moneyline/spread/total lines."
          >
            Moneyline
          </button>
          <button
            type="button"
            className="rounded-lg border border-sb-border bg-sb-bg px-3 py-2 text-xs font-extrabold text-sb-text hover:border-sb-blue hover:text-sb-blue transition-colors cursor-pointer"
            disabled
            title="Connect your Odds API to show spread line."
          >
            Spread
          </button>
          <button
            type="button"
            className="rounded-lg border border-sb-border bg-sb-bg px-3 py-2 text-xs font-extrabold text-sb-text hover:border-sb-blue hover:text-sb-blue transition-colors cursor-pointer"
            disabled
            title="Connect your Odds API to show total line."
          >
            Total
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NBABets() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("games");
  const weekRangeLabel = useMemo(() => {
    const keys = getNbaWeekDateKeys(new Date());
    if (keys.length < 2) return "";
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
    const left = a.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const right = b.toLocaleDateString(
      undefined,
      sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" },
    );
    return `${left} – ${right}`;
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await fetchNbaScoreboardWeek();
        if (!alive) return;
        setGames(result);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError("Failed to load NBA matchups from ESPN.");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => {
      return (
        g.home.abbr.toLowerCase().includes(q) ||
        g.away.abbr.toLowerCase().includes(q) ||
        g.home.name.toLowerCase().includes(q) ||
        g.away.name.toLowerCase().includes(q)
      );
    });
  }, [games, search]);

  const gamesByDay = useMemo(() => {
    const sections = [];
    let currentKey = null;
    let bucket = [];
    for (const g of filteredGames) {
      const key = daySortKey(g.startDate) || "unknown";
      if (key !== currentKey) {
        if (bucket.length) {
          sections.push({ dayKey: currentKey, heading: formatDayHeading(bucket[0].startDate), games: bucket });
        }
        currentKey = key;
        bucket = [g];
      } else {
        bucket.push(g);
      }
    }
    if (bucket.length) {
      sections.push({ dayKey: currentKey, heading: formatDayHeading(bucket[0].startDate), games: bucket });
    }
    return sections;
  }, [filteredGames]);

  return (
    <div className="text-sb-text">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-3xl font-extrabold tracking-wide">🏀 NBA</h1>
        <span className="text-[0.7rem] font-bold tracking-widest uppercase border border-sb-blue/50 text-sb-blue px-3 py-1.5 rounded-full bg-sb-bg/60">
          🔎 This week (Sun–Sat) • ESPN
        </span>
        {weekRangeLabel ? (
          <span className="text-sb-muted text-sm font-semibold">{weekRangeLabel}</span>
        ) : null}
        {loading && <span className="text-sb-muted text-sm">Loading…</span>}
      </div>

      <div className="flex gap-2 mb-6 border-b border-sb-border flex-wrap">
        <button
          type="button"
          onClick={() => setTab("games")}
          className={
            tab === "games"
              ? "px-4 py-2 text-xs font-extrabold rounded-t-xl bg-sb-blue text-sb-dark border-x border-t border-sb-blue"
              : "px-4 py-2 text-xs font-extrabold rounded-t-xl bg-transparent text-sb-muted hover:text-sb-blue hover:border-t hover:border-sb-blue border border-transparent"
          }
        >
          Matchups
        </button>
        <button
          type="button"
          onClick={() => setTab("futures")}
          className={
            tab === "futures"
              ? "px-4 py-2 text-xs font-extrabold rounded-t-xl bg-sb-blue text-sb-dark border-x border-t border-sb-blue"
              : "px-4 py-2 text-xs font-extrabold rounded-t-xl bg-transparent text-sb-muted hover:text-sb-blue hover:border-t hover:border-sb-blue border border-transparent"
          }
        >
          Futures
        </button>
      </div>

      {tab === "games" && (
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
              {filteredGames.length} game{filteredGames.length === 1 ? "" : "s"}
            </div>
          </div>

          {error && <p className="text-sb-error">{error}</p>}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-sb-border bg-sb-bg/60 p-4 animate-pulse">
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
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "futures" && (
        <div className="rounded-xl border border-sb-border bg-sb-bg/60 p-5">
          <h2 className="text-lg font-extrabold text-sb-text m-0">Futures & awards</h2>
          <p className="text-sb-muted text-sm mt-2 m-0">
            ESPN’s NBA scoreboard endpoint provides matchups and scores, but it doesn’t include futures/awards markets.
            Connect your existing odds API (or futures endpoint) and we’ll render them here.
          </p>
        </div>
      )}
    </div>
  );
}

