const API_BASE = "/api";
const ENV_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();
const RESOLVED_API_BASE = ENV_API_BASE_URL || API_BASE;
const ENDPOINTS = {
  placeBet: `${RESOLVED_API_BASE}/ufc/bets`,
};

function toYYYYMMDD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Week is Sunday → Saturday (local calendar), for labels and future query params.
 * @param {Date} [refDate]
 * @returns {string[]}
 */
export function getUfcWeekDateKeys(refDate = new Date()) {
  const d = new Date(refDate);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  sunday.setHours(12, 0, 0, 0);
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(sunday);
    x.setDate(sunday.getDate() + i);
    keys.push(toYYYYMMDD(x));
  }
  return keys;
}

/**
 * When your API already returns the shape the UFC page expects, pass it through.
 * Extend this as you wire a real response format.
 * @param {object} x
 * @returns {object | null}
 */
export function normalizeUfcFight(x) {
  if (!x || typeof x !== "object") return null;
  if (x.id && x.home && x.away && x.league) return x;
  return null;
}

function parseUfcPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map(normalizeUfcFight).filter(Boolean);
  }
  if (Array.isArray(payload?.fights)) {
    return payload.fights.map(normalizeUfcFight).filter(Boolean);
  }
  if (Array.isArray(payload?.events)) {
    return payload.events.map(normalizeUfcFight).filter(Boolean);
  }
  return [];
}

/**
 * Fetches the current week of UFC cards. Set `VITE_UFC_BETS_DATA_URL` to a GET endpoint
 * that returns JSON (array, `{ fights: [...] }`, or `{ events: [...] }` with normalized fights).
 * Without it, returns an empty list so the UI still loads.
 */
export async function fetchUfcFightsWeek() {
  const url = (import.meta.env.VITE_UFC_BETS_DATA_URL || "").trim();
  if (!url) {
    return [];
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`UFC schedule failed (${res.status})`);
  }
  const payload = await res.json();
  const list = parseUfcPayload(payload);
  return list.sort((a, b) => {
    const ta = a.startDate ? new Date(a.startDate).getTime() : 0;
    const tb = b.startDate ? new Date(b.startDate).getTime() : 0;
    return ta - tb;
  });
}

export async function placeUfcBet(bet) {
  const res = await fetch(ENDPOINTS.placeBet, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bet),
  });

  if (!res.ok) {
    let data = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }
    throw new Error(data?.error || `Bet failed (${res.status})`);
  }

  return res.json();
}
