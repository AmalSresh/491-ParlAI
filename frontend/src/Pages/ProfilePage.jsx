import React, { useMemo, useState } from 'react';

export default function ProfilePage() {
  const user = useMemo(
    () => ({
      name: 'Rafaan Hyder',
      username: 'rafaan',
      tier: 'Silver',
      memberSince: '2026',
      balance: 124.75,
      bonus: 20.0,
      winRate: 0.54,
      totalWagered: 840.25,
      netProfit: 72.4,
    }),
    []
  );

  const [activeTab, setActiveTab] = useState('activity');

  const activity = useMemo(
    () => [
      {
        id: 'a1',
        title: 'Warriors vs Lakers',
        subtitle: 'Moneyline • GSW',
        amount: -10.0,
        status: 'Settled',
        time: 'Today • 11:04 AM',
      },
      {
        id: 'a2',
        title: 'Chelsea vs Arsenal',
        subtitle: 'Over 2.5 Goals',
        amount: +18.5,
        status: 'Won',
        time: 'Yesterday • 7:22 PM',
      },
      {
        id: 'a3',
        title: 'NFL Sunday Parlay',
        subtitle: '3-leg • +420',
        amount: -5.0,
        status: 'Lost',
        time: 'Feb 10 • 3:11 PM',
      },
    ],
    []
  );

  const formatMoney = (n) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  const netIsPositive = user.netProfit >= 0;

  return (
    <div className="w-full">
      {/* Page layout: thin ad columns left/right + main content */}
      <div className="grid grid-cols-[140px_1fr_140px] gap-5">
        {/* Left ad column */}
        <aside className="hidden lg:flex h-full min-h-[calc(100vh-140px)] items-start justify-center pt-10 text-sm text-sb-text/35 bg-sb-nav/70 border-r border-sb-blue/10">
          Ad Space
        </aside>

        {/* Main content */}
        <div className="w-full min-w-0">
          {/* Top panel header */}
          <header className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl border border-sb-blue/20 bg-white/10" aria-hidden />
              <div className="min-w-0">
                <div className="text-xs font-extrabold tracking-[0.18em] text-sb-text">
                  SPORTSBOOK
                </div>
                <div className="text-xs text-sb-muted">Profile</div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                className="px-4 py-2 rounded-full border border-sb-blue/20 bg-sb-nav/90 text-sb-text font-semibold text-sm hover:border-sb-blue/50 hover:shadow-[0_0_10px_rgba(0,246,255,0.20)] transition"
              >
                Support
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-sb-blue text-black font-extrabold text-sm hover:opacity-90 transition"
              >
                Log out
              </button>
            </div>
          </header>

          {/* Hero */}
          <section className="rounded-2xl border border-sb-blue/15 bg-sb-dark shadow-[0_12px_28px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="p-5 md:p-6 bg-[radial-gradient(800px_420px_at_80%_-20%,rgba(0,246,255,0.10),transparent_60%)]">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="h-20 w-20 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                  <span className="font-black tracking-widest">{initials}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="m-0 text-2xl font-black tracking-tight text-sb-text">
                      {user.name}
                    </h1>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full border border-white/20 bg-black/20 text-sb-text">
                      {user.tier} Tier
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 flex-wrap text-sm text-sb-text/70">
                    <span>@{user.username}</span>
                    <span className="h-1 w-1 rounded-full bg-white/35" />
                    <span>Member since {user.memberSince}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-stretch gap-3">
                    <MoneyBox label="Balance" value={formatMoney(user.balance)} />
                    <MoneyBox label="Bonus" value={formatMoney(user.bonus)} />

                    <div className="ml-auto flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-full bg-sb-blue text-black font-extrabold text-sm hover:opacity-90 transition"
                      >
                        Deposit
                      </button>
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-full border border-sb-blue/35 text-sb-text font-extrabold text-sm hover:border-sb-blue hover:shadow-[0_0_10px_rgba(0,246,255,0.25)] transition"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Main grid */}
          <main className="mt-5 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
            {/* Performance */}
            <section className="rounded-2xl border border-sb-blue/12 bg-sb-dark p-5 shadow-[0_12px_28px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="m-0 text-xs font-extrabold tracking-[0.16em] uppercase text-sb-text/90">
                  Performance
                </h2>
                <span
                  className={[
                    'text-xs font-extrabold px-3 py-1 rounded-full border bg-black/20',
                    netIsPositive ? 'border-sb-blue/35 text-sb-blue' : 'border-red-400/35 text-red-300',
                  ].join(' ')}
                >
                  {netIsPositive ? 'Net +' : 'Net '}
                  {formatMoney(user.netProfit)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat label="Win rate" value={`${Math.round(user.winRate * 100)}%`} />
                <Stat label="Total wagered" value={formatMoney(user.totalWagered)} />
                <Stat label="Tier" value={user.tier} />
              </div>

              <div className="h-px bg-white/10 my-5" />

              <div className="text-xs font-extrabold tracking-[0.16em] uppercase text-sb-text/75 mb-3">
                Quick actions
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ActionCard title="Account" desc="Update info, password, 2FA" />
                <ActionCard title="Limits" desc="Deposit & wager limits" />
                <ActionCard title="Payment Methods" desc="Cards, bank, payout" />
                <ActionCard title="Notifications" desc="Odds alerts & promos" />
              </div>
            </section>

            {/* Tabs + content */}
            <section className="rounded-2xl border border-sb-blue/12 bg-sb-dark p-5 shadow-[0_12px_28px_rgba(0,0,0,0.55)]">
              <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3 mb-4">
                <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
                  Recent activity
                </TabButton>
                <TabButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>
                  Rewards
                </TabButton>
                <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
                  Settings
                </TabButton>
              </div>

              {activeTab === 'activity' && (
                <div className="flex flex-col gap-3">
                  {activity.map((a) => {
                    const isPositive = a.amount >= 0;
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 p-4"
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold text-sb-text">{a.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-sb-text/65">
                            <span>{a.subtitle}</span>
                            <span className="h-1 w-1 rounded-full bg-white/25" />
                            <span>{a.status}</span>
                            <span className="h-1 w-1 rounded-full bg-white/25" />
                            <span>{a.time}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div
                            className={[
                              'font-black tracking-wide',
                              isPositive ? 'text-sb-blue' : 'text-red-300',
                            ].join(' ')}
                          >
                            {isPositive ? '+' : '-'}
                            {formatMoney(Math.abs(a.amount))}
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-full border border-sb-blue/20 bg-sb-nav/90 text-sb-text text-xs font-bold hover:border-sb-blue/50 hover:shadow-[0_0_10px_rgba(0,246,255,0.18)] transition"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'rewards' && (
                <div>
                  <div className="font-black text-base text-sb-text mb-2">Rewards (stub)</div>
                  <p className="text-sm text-sb-text/65 mb-4">
                    Later you can show tier progress, points, promos, and rewards history.
                  </p>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs text-sb-text/65">Tier Progress</div>
                    <div className="font-black text-base text-sb-text mt-1 mb-3">Silver → Gold</div>

                    <div className="h-2.5 rounded-full border border-white/10 bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-sb-blue shadow-[0_0_10px_rgba(0,246,255,0.35)]"
                        style={{ width: '42%' }}
                      />
                    </div>

                    <div className="text-xs text-sb-text/65 mt-2">42% complete</div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <div className="font-black text-base text-sb-text mb-2">Settings (stub)</div>
                  <p className="text-sm text-sb-text/65 mb-4">Later wire this to real forms.</p>

                  <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-sb-text/65">Display name</span>
                      <input
                        className="w-full rounded-xl border border-sb-blue/20 bg-black/40 px-3 py-2.5 text-sb-text outline-none focus:border-sb-blue/60 focus:shadow-[0_0_10px_rgba(0,246,255,0.18)] transition"
                        defaultValue={user.name}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-sb-text/65">Username</span>
                      <input
                        className="w-full rounded-xl border border-sb-blue/20 bg-black/40 px-3 py-2.5 text-sb-text outline-none focus:border-sb-blue/60 focus:shadow-[0_0_10px_rgba(0,246,255,0.18)] transition"
                        defaultValue={`@${user.username}`}
                      />
                    </label>

                    <button
                      type="button"
                      className="mt-1 px-5 py-2.5 rounded-full bg-sb-blue text-black font-extrabold text-sm hover:opacity-90 transition self-start"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>

        {/* Right ad column */}
        <aside className="hidden lg:flex h-full min-h-[calc(100vh-140px)] items-start justify-center pt-10 text-sm text-sb-text/35 bg-sb-nav/70 border-l border-sb-blue/10">
          Ad Space
        </aside>
      </div>
    </div>
  );
}

function MoneyBox({ label, value }) {
  return (
    <div className="min-w-[160px] rounded-xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="text-xs text-sb-text/65">{label}</div>
      <div className="mt-1 text-lg font-black text-sb-text">{value}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="text-xs text-sb-text/65">{label}</div>
      <div className="mt-1 text-lg font-black text-sb-text">{value}</div>
    </div>
  );
}

function ActionCard({ title, desc }) {
  return (
    <button
      type="button"
      className="text-left rounded-xl border border-white/10 bg-black/25 p-4 hover:border-sb-blue/30 hover:shadow-[0_0_10px_rgba(0,246,255,0.16)] transition"
    >
      <div className="font-black text-sb-text">{title}</div>
      <div className="mt-1 text-xs text-sb-text/65 leading-snug">{desc}</div>
    </button>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2 rounded-full text-xs font-extrabold transition border',
        active
          ? 'bg-white text-black border-white'
          : 'bg-black/25 text-sb-text/80 border-white/10 hover:border-sb-blue/30 hover:text-sb-text',
      ].join(' ')}
    >
      {children}
    </button>
  );
}