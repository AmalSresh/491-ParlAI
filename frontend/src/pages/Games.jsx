import { Link } from 'react-router-dom';

const SPORTS = [
  {
    emoji: '🏀',
    name: 'NBA',
    path: '/nba',
    desc: 'Basketball — current week via ESPN',
    source: 'Live',
  },
  {
    emoji: '⚾',
    name: 'MLB',
    path: '/mlb',
    desc: 'Baseball — live games & scores',
    source: 'Live',
  },
  {
    emoji: '🏒',
    name: 'NHL',
    path: '/hockey',
    desc: 'Hockey — live games & player props',
    source: 'Live',
  },
  {
    emoji: '⚽',
    name: 'Soccer',
    path: '/soccer',
    desc: 'Soccer — leagues worldwide',
    source: 'Live',
  },
];

export default function Games() {
  return (
    <div className="w-full min-w-0 p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-sb-text mb-1">Games</h1>
        <p className="text-sb-muted text-sm m-0">
          Browse all available sports and place your bets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SPORTS.map((s) => (
          <Link
            key={s.name}
            to={s.path}
            className="rounded-xl border border-sb-border bg-sb-card p-5 flex gap-4 items-center hover:border-sb-blue hover:bg-sb-blue/5 transition-colors no-underline group"
          >
            <span className="text-4xl flex-shrink-0">{s.emoji}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sb-text text-lg group-hover:text-sb-blue transition-colors">
                  {s.name}
                </span>
                <span className={`text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded-full border ${s.source === 'Live' ? 'border-sb-blue/40 text-sb-blue bg-sb-blue/10' : 'border-amber-500/40 text-amber-400 bg-amber-500/10'}`}>
                  {s.source}
                </span>
              </div>
              <div className="text-sb-muted text-xs mt-1">{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
