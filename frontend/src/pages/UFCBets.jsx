import { useEffect, useMemo, useState } from "react";
import { fetchUfcFightsWeek, getUfcWeekDateKeys } from "../api/ufc/ufcBetsClient";

function formatStart(iso) {
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

function FightCard({ fight }) {
  const redScore = fight.home.score ?? null;
  const blueScore = fight.away.score ?? null;
  const isFinal = fight.status?.typeState === "post";

  return (
    <div className="rounded-xl border border-sb-border bg-sb-bg/60 overflow-hidden">
      <div className="p-4 border-b border-sb-border flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-widest text-sb-muted font-bold">
            {fight.league} • {fight.seasonDisplay}
          </div>
          <div className="text-sb-text font-extrabold text-lg mt-1">
            {fight.away.abbr} vs {fight.home.abbr}
          </div>
          <div className="text-sb-muted text-sm mt-1">
            {formatStart(fight.startDate)} • {getStatusLabel(fight.status?.typeState)}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sb-muted text-xs font-bold">{fight.home.abbr}</div>
            <div className={`text-2xl font-extrabold ${isFinal ? "text-sb-text" : "text-sb-blue"}`}>
              {redScore !== null ? redScore : "—"}
            </div>
          </div>
          <div className="text-left">
            <div className="text-sb-muted text-xs font-bold">{fight.away.abbr}</div>
            <div className={`text-2xl font-extrabold ${isFinal ? "text-sb-text" : "text-sb-blue"}`}>
              {blueScore !== null ? blueScore : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-sb-text font-extrabold text-sm">
            {fight.away.name} vs {fight.home.name}
          </div>
          <div className="text-sb-muted text-xs mt-1">
            {fight.status?.clock
              ? `Status: ${fight.status.clock}`
              : "Round / clock not provided"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-sb-border bg-sb-bg px-3 py-2 text-xs font-extrabold text-sb-text hover:border-sb-blue hover:text-sb-blue transition-colors cursor-pointer"
            disabled
            title="Connect your Odds API to show moneyline lines."
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

export default function UFCBets() {
  const [fights, setFights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("fights");
  const dataConfigured = Boolean((import.meta.env.VITE_UFC_BETS_DATA_URL || "").trim());

  const weekRangeLabel = useMemo(() => {
    const keys = getUfcWeekDateKeys(new Date());
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
        const result = await fetchUfcFightsWeek();
        if (!alive) return;
        setFights(result);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError("Failed to load UFC matchups from your configured data URL.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const filteredFights = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fights;
    return fights.filter((f) => {
      return (
        f.home.abbr.toLowerCase().includes(q) ||
        f.away.abbr.toLowerCase().includes(q) ||
        f.home.name.toLowerCase().includes(q) ||
        f.away.name.toLowerCase().includes(q)
      );
    });
  }, [fights, search]);

  const fightsByDay = useMemo(() => {
    const sections = [];
    let currentKey = null;
    let bucket = [];
    for (const f of filteredFights) {
      const key = daySortKey(f.startDate) || "unknown";
      if (key !== currentKey) {
        if (bucket.length) {
          sections.push({ dayKey: currentKey, heading: formatDayHeading(bucket[0].startDate), fights: bucket });
        }
        currentKey = key;
        bucket = [f];
      } else {
        bucket.push(f);
      }
    }
    if (bucket.length) {
      sections.push({ dayKey: currentKey, heading: formatDayHeading(bucket[0].startDate), fights: bucket });
    }
    return sections;
  }, [filteredFights]);

  return (
    <div className="text-sb-text">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-3xl font-extrabold tracking-wide">🥊 UFC</h1>
        <span className="text-[0.7rem] font-bold tracking-widest uppercase border border-sb-blue/50 text-sb-blue px-3 py-1.5 rounded-full bg-sb-bg/60">
          🔎 This week (Sun–Sat)
        </span>
        {weekRangeLabel ? (
          <span className="text-sb-muted text-sm font-semibold">{weekRangeLabel}</span>
        ) : null}
        {loading && <span className="text-sb-muted text-sm">Loading…</span>}
      </div>

      {!dataConfigured && !loading && (
        <p className="text-sb-muted text-sm mb-4">
          Set <code className="text-sb-text">VITE_UFC_BETS_DATA_URL</code> in <code className="text-sb-text">.env</code>{" "}
          and return JSON the page can parse, or map your API in{" "}
          <code className="text-sb-text">ufcBetsClient.js</code> (<code className="text-sb-text">normalizeUfcFight</code>
          ).
        </p>
      )}

      <div className="flex gap-2 mb-6 border-b border-sb-border flex-wrap">
        <button
          type="button"
          onClick={() => setTab("fights")}
          className={
            tab === "fights"
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

      {tab === "fights" && (
        <>
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by fighter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-sb-bg border border-sb-border rounded-xl px-4 py-2 text-sb-text text-sm outline-none focus:border-sb-blue focus:ring-1 focus:ring-sb-blue w-[260px]"
            />

            <div className="ml-auto text-sb-muted text-sm">
              {filteredFights.length} fight{filteredFights.length === 1 ? "" : "s"}
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
          ) : filteredFights.length === 0 ? (
            <p className="text-sb-muted">No matchups found.</p>
          ) : (
            <div className="flex flex-col gap-8">
              {fightsByDay.map(({ dayKey, heading, fights: dayFights }) => (
                <section key={dayKey || heading}>
                  <h2 className="text-sm font-extrabold tracking-widest uppercase text-sb-muted border-b border-sb-border pb-2 mb-4">
                    {heading}
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {dayFights.map((fight) => (
                      <FightCard key={fight.id} fight={fight} />
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
          <h2 className="text-lg font-extrabold text-sb-text m-0">Futures & specials</h2>
          <p className="text-sb-muted text-sm mt-2 m-0">
            Wire your odds API (title fights, P4P, season specials) the same way as matchups—extend{" "}
            <code className="text-sb-text">ufcBetsClient.js</code> and this tab can list those markets.
          </p>
        </div>
      )}
    </div>
  );
}
