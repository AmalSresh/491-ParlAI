import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api.js';

function formatMoney(n) {
  return Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const s = (status ?? '').toUpperCase();
  const cls =
    s === 'WON'
      ? 'text-sb-blue border-sb-blue bg-sb-blue/10'
      : s === 'LOST'
        ? 'text-sb-error border-sb-error bg-sb-error/10'
        : 'text-sb-muted border-sb-border bg-sb-bg/80';
  return (
    <span
      className={`text-[0.65rem] font-bold uppercase px-2.5 py-1 rounded-full border ${cls}`}
    >
      {status ?? 'Pending'}
    </span>
  );
}

const FILTERS = ['All', 'PENDING', 'WON', 'LOST', 'SETTLED'];

export default function MyBets() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    apiFetch('/api/bets?limit=100')
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setBets(data.bets ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setError('Failed to load bets. Please try again.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return <div className="p-8 text-sb-muted">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full min-w-0 p-4 sm:p-8 flex flex-col items-center text-center gap-4 mt-12">
        <h1 className="text-2xl font-extrabold text-sb-text">My Bets</h1>
        <p className="text-sb-muted">Sign in to view your bet history.</p>
        <Link
          to="/login"
          className="rounded-xl bg-sb-blue text-sb-dark px-5 py-2.5 font-extrabold text-sm no-underline hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const filtered =
    filter === 'All'
      ? bets
      : bets.filter((b) => (b.status ?? '').toUpperCase() === filter);

  return (
    <div className="w-full min-w-0 p-4 sm:p-8">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-3xl font-extrabold text-sb-text">My Bets</h1>
        {!loading && (
          <span className="text-sb-muted text-sm">{bets.length} total</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? 'rounded-full px-3 py-1.5 text-xs font-extrabold bg-sb-blue text-sb-dark border border-sb-blue'
                : 'rounded-full px-3 py-1.5 text-xs font-extrabold bg-sb-bg text-sb-muted border border-sb-border hover:border-sb-blue'
            }
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="text-sb-error mb-4">{error}</p>}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-sb-border bg-sb-bg/60 p-4 animate-pulse h-[72px]"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-sb-border bg-sb-bg/60 p-10 text-center text-sb-muted">
          {bets.length === 0
            ? "You haven't placed any bets yet. Head to a sport page to get started."
            : 'No bets match this filter.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((bet) => {
            const leg = bet.legs?.[0];
            const gameName =
              leg?.event
                ? `${leg.event.homeTeam} vs ${leg.event.awayTeam}`
                : leg?.outcomeLabel ?? `Bet #${bet.id}`;
            const sport = leg?.event?.sport ?? leg?.event?.leagueName ?? '';
            const betStatus = (bet.status ?? '').toUpperCase();
            const pnl =
              betStatus === 'WON'
                ? bet.potentialPayout - bet.stake
                : betStatus === 'LOST'
                  ? -bet.stake
                  : null;

            return (
              <div
                key={bet.id}
                className="rounded-xl border border-sb-border bg-sb-bg/60 p-4 flex flex-wrap gap-4 items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-sb-text truncate">
                    {gameName}
                  </div>
                  <div className="text-sb-muted text-xs mt-1 flex gap-2 flex-wrap items-center">
                    {sport && (
                      <>
                        <span className="uppercase">{sport}</span>
                        <span>•</span>
                      </>
                    )}
                    <span className="capitalize">
                      {bet.wagerKind?.toLowerCase() ?? 'straight'}
                    </span>
                    {bet.legs?.length > 1 && (
                      <span className="border border-sb-border rounded px-1.5 py-0.5 text-[0.6rem] font-bold">
                        {bet.legs.length} legs
                      </span>
                    )}
                    <span>•</span>
                    <span>{formatDate(bet.placedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-[0.65rem] text-sb-muted uppercase tracking-wider">
                      Stake
                    </div>
                    <div className="font-extrabold text-sb-text text-sm">
                      {formatMoney(bet.stake)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[0.65rem] text-sb-muted uppercase tracking-wider">
                      To win
                    </div>
                    <div className="font-extrabold text-sb-text text-sm">
                      {formatMoney(bet.potentialPayout)}
                    </div>
                  </div>
                  {pnl !== null && (
                    <div
                      className={`font-extrabold text-sm ${pnl >= 0 ? 'text-sb-blue' : 'text-sb-error'}`}
                    >
                      {pnl >= 0 ? '+' : ''}
                      {formatMoney(pnl)}
                    </div>
                  )}
                  <StatusBadge status={bet.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
