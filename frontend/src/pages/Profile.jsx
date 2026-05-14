import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  const profileUser = useMemo(
    () => ({
      name: user?.name ?? 'Guest',
      username: user?.email?.split('@')[0] ?? 'user',
      tier: 'Silver',
      memberSince: '2026',
      balance: user?.balance ?? 0,
    }),
    [user?.name, user?.email, user?.balance],
  );

  const formatMoney = (n) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  const initials = profileUser.name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

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
                {profileUser.name}
              </h1>
              <span className="text-xs px-2.5 py-1.5 rounded-full border border-sb-border bg-sb-bg/80 text-sb-text">
                {profileUser.tier} Tier
              </span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap mt-1.5 text-sb-muted text-sm">
              <span>@{profileUser.username}</span>
              <span className="w-1 h-1 rounded-full bg-sb-muted" />
              <span>Member since {profileUser.memberSince}</span>
            </div>

            <div className="flex gap-3 items-stretch flex-wrap mt-4">
              <div className="min-w-[160px] p-3 rounded-xl border border-sb-border bg-sb-bg/80">
                <div className="text-sb-muted text-xs">Balance</div>
                <div className="text-sb-text font-extrabold text-lg mt-1">
                  {formatMoney(profileUser.balance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        {/* Recent Activity */}
        <section className="rounded-xl border border-sb-border bg-sb-card p-4">
          <h2 className="text-sm uppercase tracking-wider text-sb-text font-semibold mb-3">
            Recent Activity
          </h2>
          <p className="text-sb-muted text-sm mb-4">
            View your full betting history and track your results.
          </p>
          <Link
            to="/bets"
            className="rounded-xl bg-sb-blue text-sb-dark px-4 py-2 text-sm font-extrabold no-underline hover:opacity-90 inline-block"
          >
            View My Bets →
          </Link>
        </section>
      </div>
    </div>
  );
}