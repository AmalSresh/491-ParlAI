import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SPORTS = [
  { emoji: '🏀', name: 'NBA', path: '/nba', desc: 'Basketball' },
  { emoji: '🏈', name: 'NFL', path: '/nfl', desc: 'American Football' },
  { emoji: '⚽', name: 'Soccer', path: '/soccer', desc: 'Football' },
];

function formatMoney(n) {
  return Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="w-full min-w-0 p-4 sm:p-8">
      {/* Hero */}
      <section className="rounded-xl border border-sb-border bg-sb-card p-6 mb-8 shadow-lg">
        <h1 className="text-3xl font-extrabold text-sb-text mb-1">
          {isAuthenticated
            ? `Welcome back, ${user?.name ?? user?.email?.split('@')[0]}`
            : 'Welcome to Parl'}
        </h1>
        {isAuthenticated ? (
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sb-muted text-sm">Balance</span>
              <span className="font-extrabold text-sb-blue text-xl">
                {formatMoney(user?.balance ?? 0)}
              </span>
            </div>
            <Link
              to="/bets"
              className="text-xs border border-sb-border rounded-full px-3 py-1.5 text-sb-muted hover:border-sb-blue hover:text-sb-text transition-colors no-underline"
            >
              View my bets →
            </Link>
            <Link
              to="/profile"
              className="text-xs border border-sb-border rounded-full px-3 py-1.5 text-sb-muted hover:border-sb-blue hover:text-sb-text transition-colors no-underline"
            >
              Profile →
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <p className="text-sb-muted m-0">
              Sign in to start betting with virtual currency.
            </p>
            <Link
              to="/login"
              className="rounded-xl bg-sb-blue text-sb-dark px-4 py-2 text-sm font-extrabold no-underline hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          </div>
        )}
      </section>

      {/* Sports grid */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-sb-muted mb-4">
          Choose a sport
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SPORTS.map((s) => (
            <Link
              key={s.name}
              to={s.path}
              className="rounded-xl border border-sb-border bg-sb-card p-5 flex flex-col items-center gap-2 hover:border-sb-blue hover:bg-sb-blue/5 transition-colors no-underline"
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="font-extrabold text-sb-text text-sm">{s.name}</span>
              <span className="text-xs text-sb-muted">{s.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How to play nudge */}
      <section className="mt-8 rounded-xl border border-sb-border bg-sb-bg/60 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-extrabold text-sb-text text-sm">New here?</div>
          <div className="text-sb-muted text-xs mt-1">
            Learn how Parl virtual betting works.
          </div>
        </div>
        <Link
          to="/how-to-play"
          className="rounded-xl border border-sb-border px-4 py-2 text-sm font-extrabold text-sb-text hover:border-sb-blue transition-colors no-underline"
        >
          How to play
        </Link>
      </section>
    </div>
  );
}