import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api.js';

function Stat({ label, value }) {
  return (
    <div className="border border-sb-border rounded-xl p-3 bg-sb-bg/80">
      <div className="text-sb-muted text-[0.75rem] uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1.5 font-extrabold text-sb-text text-lg">{value}</div>
    </div>
  );
}

function ActionCard({ title, desc, to }) {
  const content = (
    <>
      <div className="font-extrabold text-sb-text">{title}</div>
      <div className="mt-1.5 text-sb-muted text-xs leading-snug">{desc}</div>
    </>
  );
  const className =
    'text-left rounded-xl border border-sb-border bg-sb-bg/80 p-3 text-sb-text hover:border-sb-blue transition-colors cursor-pointer block w-full';
  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className}>
      {content}
    </button>
  );
}


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
    <span className={`text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded-full border ${cls}`}>
      {status ?? 'Pending'}
    </span>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [betsLoading, setBetsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiFetch('/api/bets?limit=10')
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setBets(data.bets ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setBetsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const won = bets.filter((b) => (b.status ?? '').toUpperCase() === 'WON').length;
    const settled = bets.filter((b) =>
      ['WON', 'LOST'].includes((b.status ?? '').toUpperCase()),
    ).length;
    const totalWagered = bets.reduce((s, b) => s + Number(b.stake ?? 0), 0);
    const netProfit = bets.reduce((s, b) => {
      const status = (b.status ?? '').toUpperCase();
      if (status === 'WON') return s + (Number(b.potentialPayout) - Number(b.stake));
      if (status === 'LOST') return s - Number(b.stake);
      return s;
    }, 0);
    return {
      winRate: settled > 0 ? won / settled : null,
      totalWagered,
      netProfit,
    };
  }, [bets]);

  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  const username = user?.email?.split('@')[0] ?? 'user';

  return (
    <div className="w-full min-w-0">
      {/* Hero */}
      <section className="rounded-xl border border-sb-border bg-sb-card p-4 mb-4 shadow-lg">
        <div className="flex gap-4 flex-wrap">
          <div
            className="w-[78px] h-[78px] rounded-[22px] border border-sb-border bg-sb-bg flex items-center justify-center flex-shrink-0"
            aria-hidden
          >
            <span className="font-extrabold text-sb-blue text-xl tracking-wide">
              {initials}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl leading-tight text-sb-text m-0 font-semibold">
                {user?.name ?? username}
              </h1>
              <span className="text-xs px-2.5 py-1.5 rounded-full border border-sb-border bg-sb-bg/80 text-sb-text">
                Member
              </span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap mt-1.5 text-sb-muted text-sm">
              <span>@{username}</span>
              {user?.provider && (
                <>
                  <span className="w-1 h-1 rounded-full bg-sb-muted" />
                  <span className="capitalize">{user.provider}</span>
                </>
              )}
            </div>

            <div className="flex gap-3 items-stretch flex-wrap mt-4">
              <div className="min-w-[160px] p-3 rounded-xl border border-sb-border bg-sb-bg/80">
                <div className="text-sb-muted text-xs">Balance</div>
                <div className="text-sb-text font-extrabold text-lg mt-1">
                  {formatMoney(user?.balance ?? 0)}
                </div>
              </div>
              <div className="min-w-[160px] p-3 rounded-xl border border-sb-border bg-sb-bg/80">
                <div className="text-sb-muted text-xs">Total bets placed</div>
                <div className="text-sb-text font-extrabold text-lg mt-1">
                  {betsLoading ? '…' : bets.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        {/* Performance panel */}
        <section className="rounded-xl border border-sb-border bg-sb-card p-4 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm uppercase tracking-wider text-sb-text font-semibold m-0">
              Performance
            </h2>
            {!betsLoading && (
              <span
                className={
                  stats.netProfit >= 0
                    ? 'text-xs px-2.5 py-1.5 rounded-full border border-sb-blue bg-sb-blue/10 text-sb-blue'
                    : 'text-xs px-2.5 py-1.5 rounded-full border border-sb-error bg-sb-error/10 text-sb-error'
                }
              >
                {stats.netProfit >= 0 ? 'Net +' : 'Net '}
                {formatMoney(stats.netProfit)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Stat
              label="Win rate"
              value={
                betsLoading
                  ? '…'
                  : stats.winRate !== null
                    ? `${Math.round(stats.winRate * 100)}%`
                    : '—'
              }
            />
            <Stat
              label="Total wagered"
              value={betsLoading ? '…' : formatMoney(stats.totalWagered)}
            />
            <Stat
              label="Balance"
              value={formatMoney(user?.balance ?? 0)}
            />
          </div>

          <div className="h-px bg-sb-border my-4" />

          <div className="text-xs uppercase tracking-widest text-sb-muted mb-2.5">
            Quick actions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <ActionCard
              title="Account"
              desc="Update info, email, and 2FA"
              to="/settings"
            />
            <ActionCard
              title="Limits"
              desc="Wager limits & responsible play"
              to="/settings"
            />
          </div>
        </section>

        {/* Tabs panel */}
        <section className="rounded-xl border border-sb-border bg-sb-card p-4 overflow-hidden">
          <div className="pb-3 border-b border-sb-border mb-3">
            <span className="text-sm uppercase tracking-wider text-sb-text font-semibold">
              Recent activity
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
              {betsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-sb-border bg-sb-bg/60 p-3 h-16 animate-pulse"
                  />
                ))
              ) : bets.length === 0 ? (
                <div className="text-sb-muted text-sm py-4 text-center">
                  No bets placed yet.{' '}
                  <Link to="/nba" className="text-sb-blue hover:underline">
                    Start betting →
                  </Link>
                </div>
              ) : (
                bets.slice(0, 5).map((bet) => {
                  const leg = bet.legs?.[0];
                  const title =
                    leg?.event
                      ? `${leg.event.homeTeam} vs ${leg.event.awayTeam}`
                      : leg?.outcomeLabel ?? `Bet #${bet.id}`;
                  const subtitle = [
                    leg?.event?.sport ?? leg?.event?.leagueName,
                    leg?.marketKey,
                  ]
                    .filter(Boolean)
                    .join(' • ');
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
                      className="flex gap-3 items-center justify-between border border-sb-border rounded-xl p-3 bg-sb-bg/80 flex-wrap"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-sb-text truncate">
                          {title}
                        </div>
                        <div className="flex gap-2 items-center flex-wrap mt-1.5 text-sb-muted text-xs">
                          {subtitle && <span>{subtitle}</span>}
                          {subtitle && <span className="w-1 h-1 rounded-full bg-sb-muted" />}
                          <StatusBadge status={bet.status} />
                          <span className="w-1 h-1 rounded-full bg-sb-muted" />
                          <span>{formatDate(bet.placedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-end gap-2.5 flex-shrink-0 flex-col sm:flex-row">
                        {pnl !== null ? (
                          <div
                            className={
                              pnl >= 0
                                ? 'font-extrabold text-sm text-sb-blue'
                                : 'font-extrabold text-sm text-sb-error'
                            }
                          >
                            {pnl >= 0 ? '+' : '-'}
                            {formatMoney(Math.abs(pnl))}
                          </div>
                        ) : (
                          <div className="font-extrabold text-sm text-sb-muted">
                            {formatMoney(bet.stake)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {bets.length > 5 && (
                <Link
                  to="/bets"
                  className="text-center text-xs text-sb-blue hover:underline py-2"
                >
                  View all {bets.length} bets →
                </Link>
              )}
            </div>
        </section>
      </div>
    </div>
  );
}
