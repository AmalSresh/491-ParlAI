import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function formatMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

function formatWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Settings() {
  const { user, setUser } = useAuth();
  const [bets, setBets] = useState([]);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsError, setBetsError] = useState('');
  const [betsTab, setBetsTab] = useState('pending');

  const sectionCard = 'rounded-xl border border-sb-border bg-sb-card p-5 mb-6';
  const labelClass = 'block text-sb-text font-semibold text-[0.95rem] mb-2';
  const inputClass =
    'w-full max-w-xs bg-sb-bg border border-sb-border rounded-lg py-2.5 px-3 text-sb-text text-[0.95rem] focus:outline-none focus:border-sb-blue focus:ring-1 focus:ring-sb-blue';
  const selectClass =
    'w-full max-w-xs bg-sb-bg border border-sb-border rounded-lg py-2.5 px-3 text-sb-text text-[0.95rem] focus:outline-none focus:border-sb-blue cursor-pointer';

  useEffect(() => {
    let alive = true;
    (async () => {
      setBetsLoading(true);
      setBetsError('');
      try {
        // silently refresh balance on settings open
        const balRes = await fetch('/api/user/balance');
        const bal = await balRes.json();
        if (alive && balRes.ok && bal?.balance != null) {
          setUser((prev) => ({ ...prev, balance: bal.balance }));
        }

        const res = await fetch('/api/bets?limit=200');
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || `Failed to load bets (${res.status})`);
        if (!alive) return;
        setBets(Array.isArray(data?.bets) ? data.bets : []);
      } catch (e) {
        if (!alive) return;
        setBetsError(e?.message || 'Failed to load bet history.');
      } finally {
        if (alive) setBetsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [setUser]);

  const pendingBets = useMemo(
    () =>
      bets.filter((b) => String(b.status || '').toUpperCase() === 'PENDING'),
    [bets],
  );
  const settledBets = useMemo(
    () =>
      bets.filter((b) => String(b.status || '').toUpperCase() !== 'PENDING'),
    [bets],
  );

  return (
    <div className="w-full min-w-0">
      <h1 className="text-2xl leading-tight text-sb-blue m-0 mb-1">Settings</h1>
      <p className="text-sb-muted text-[0.95rem] m-0 mb-6">
        View your wallet balance, account details, betting history.
      </p>

      {/* Balance + bets */}
      <section className={sectionCard}>
        <h2 className="text-lg font-bold text-sb-text m-0 mb-4 border-b border-sb-border pb-2">
          Wallet & bet history
        </h2>

        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="text-sb-muted text-xs">Balance</div>
            <div className="text-sb-text font-extrabold text-xl">
              {formatMoney(user?.balance)}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setBetsTab('pending')}
              className={
                betsTab === 'pending'
                  ? 'px-4 py-2 text-xs font-extrabold rounded-xl bg-sb-blue text-sb-dark border border-sb-blue'
                  : 'px-4 py-2 text-xs font-extrabold rounded-xl bg-transparent text-sb-muted hover:text-sb-blue border border-sb-border'
              }
            >
              Current (Pending) • {pendingBets.length}
            </button>
            <button
              type="button"
              onClick={() => setBetsTab('settled')}
              className={
                betsTab === 'settled'
                  ? 'px-4 py-2 text-xs font-extrabold rounded-xl bg-sb-blue text-sb-dark border border-sb-blue'
                  : 'px-4 py-2 text-xs font-extrabold rounded-xl bg-transparent text-sb-muted hover:text-sb-blue border border-sb-border'
              }
            >
              Finished • {settledBets.length}
            </button>
          </div>
        </div>

        {betsError ? (
          <p className="text-sb-error m-0 mb-3">{betsError}</p>
        ) : null}

        {betsLoading ? (
          <div className="text-sb-muted">Loading bets…</div>
        ) : (
          <div className="space-y-3">
            {(betsTab === 'pending' ? pendingBets : settledBets)
              .slice(0, 50)
              .map((bet) => (
                <div
                  key={bet.id}
                  className="rounded-xl border border-sb-border bg-sb-bg/60 p-4"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-sb-text font-extrabold">
                        {String(bet.wagerKind || '').toUpperCase()} •{' '}
                        {String(bet.status || '').toUpperCase()}
                      </div>
                      <div className="text-sb-muted text-xs mt-1">
                        Placed: {formatWhen(bet.placedAt)}{' '}
                        {bet.settledAt
                          ? `• Settled: ${formatWhen(bet.settledAt)}`
                          : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sb-muted text-xs">Stake</div>
                      <div className="text-sb-text font-extrabold">
                        {formatMoney(bet.stake)}
                      </div>
                    </div>
                  </div>

                  {Array.isArray(bet.legs) && bet.legs.length > 0 ? (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {bet.legs.slice(0, 10).map((leg) => (
                        <div
                          key={leg.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-sb-border/70 bg-sb-bg/40 p-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sb-text text-sm font-bold truncate">
                              {leg.event?.awayTeam && leg.event?.homeTeam
                                ? `${leg.event.awayTeam} vs ${leg.event.homeTeam}`
                                : `Event ${leg.eventId}`}
                            </div>
                            <div className="text-sb-muted text-xs mt-1">
                              {leg.marketKey ? `${leg.marketKey} • ` : ''}
                              {leg.outcomeLabel || '—'}
                              {leg.lineValue != null
                                ? ` (${leg.lineValue})`
                                : ''}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sb-muted text-[0.7rem] uppercase tracking-widest">
                              Odds
                            </div>
                            <div className="text-sb-text text-sm font-extrabold">
                              {leg.odds ?? '—'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sb-muted text-sm mt-3">
                      No legs found.
                    </div>
                  )}
                </div>
              ))}

            {(betsTab === 'pending' ? pendingBets : settledBets).length ===
            0 ? (
              <p className="text-sb-muted m-0">No bets to show.</p>
            ) : null}
          </div>
        )}
      </section>

      {/* Account */}
      <section className={sectionCard}>
        <h2 className="text-lg font-bold text-sb-text m-0 mb-4 border-b border-sb-border pb-2">
          Account
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <p className="text-sb-muted text-[0.95rem] m-0">
              {user?.email ?? 'Not signed in'}
            </p>
          </div>
          <div>
            <label className={labelClass}>Display name</label>
            <input
              type="text"
              className={inputClass}
              placeholder={user?.name ?? user?.email ?? 'Your name'}
              readOnly
              disabled
            />
            <p className="text-sb-muted text-[0.8rem] mt-1">
              Managed by your sign-in provider.
            </p>
          </div>
        </div>
      </section>

      

  
    </div>
  );
}
