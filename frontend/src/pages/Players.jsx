import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const NFL_COLORS = {
  KC: '#E31837', BUF: '#00338D', BAL: '#241773', CIN: '#FB4F14',
  PHI: '#004C54', DAL: '#003594', DET: '#0076B6', LAR: '#003594',
  SF: '#AA0000', NYJ: '#125740', NO: '#D3BC8D', MIA: '#008E97',
  MIN: '#4F2683', LAC: '#0080C6', GB: '#203731', NE: '#002244',
  ARI: '#97233F', ATL: '#A71930', CHI: '#C83803', HOU: '#03202F',
  SEA: '#002244', TB: '#D50A0A', PIT: '#FFB612', WAS: '#5A1414',
  IND: '#002C5F', JAX: '#006778', DEN: '#FB4F14', LV: '#A5ACAF',
  NYG: '#0B2265', TEN: '#0C2340', CAR: '#0085CA', CLE: '#FF3C00',
};

const NHL_COLORS = {
  EDM: '#FF4C00', COL: '#6F263D', TOR: '#003E7E', BOS: '#FFB81C',
  TBL: '#002868', NYR: '#0038A8', CAR: '#CC0000', FLA: '#C8102E',
  VGK: '#B4975A', DAL: '#006847', MIN: '#154734', WSH: '#041E42',
  PIT: '#FCB514', CHI: '#CF0A2C', MTL: '#AF1E2D', OTT: '#C52032',
  VAN: '#00843D', CGY: '#C8102E', WPG: '#004C97', PHI: '#F74902',
  NJD: '#CE1126', NYI: '#00539B', DET: '#CE1126', STL: '#002F87',
  NSH: '#FFB81C', ANA: '#F47A38', LAK: '#111111', SJS: '#006D75',
  CBJ: '#002654', BUF: '#003399', SEA: '#001628',
};

const NBA_COLORS = {
  OKC: '#007AC1', LAL: '#552583', GSW: '#1D428A', BOS: '#007A33',
  CLE: '#860038', DEN: '#0E2240', MIL: '#00471B', MIA: '#98002E',
  PHI: '#006BB6', SAS: '#C4CED4', NYK: '#F58426', IND: '#002D62',
  MIN: '#0C2340', DAL: '#00538C', PHX: '#1D1160', LAC: '#C8102E',
  MEM: '#5D76A9', NOP: '#0C2340', SAC: '#5A2D81', ATL: '#E03A3E',
  CHI: '#CE1141', TOR: '#CE1141', HOU: '#CE1141', ORL: '#0077C0',
  BKN: '#000000', UTA: '#002B5C', POR: '#E03A3E', CHA: '#1D1160',
  WAS: '#002B5C', DET: '#C8102E',
};

const NFL_POSITIONS = ['All', 'QB', 'RB', 'WR', 'TE'];
const NHL_POSITIONS = ['All', 'C', 'LW', 'RW', 'D', 'G'];
const NBA_POSITIONS = ['All', 'PG', 'SG', 'SF', 'PF', 'C'];

const NBA_PLAYERS = [
  // PG
  { id: 'nba-sga', name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'PG', points: 32.7, rebounds: 5.1, assists: 6.4 },
  { id: 'nba-luka', name: 'Luka Dončić', team: 'DAL', position: 'PG', points: 28.1, rebounds: 8.8, assists: 7.4 },
  { id: 'nba-curry', name: 'Stephen Curry', team: 'GSW', position: 'PG', points: 22.5, rebounds: 4.5, assists: 6.0 },
  { id: 'nba-haliburton', name: 'Tyrese Haliburton', team: 'IND', position: 'PG', points: 20.1, rebounds: 4.2, assists: 10.9 },
  { id: 'nba-brunson', name: 'Jalen Brunson', team: 'NYK', position: 'PG', points: 25.1, rebounds: 3.6, assists: 7.5 },
  // SG
  { id: 'nba-edwards', name: 'Anthony Edwards', team: 'MIN', position: 'SG', points: 27.9, rebounds: 5.4, assists: 5.1 },
  { id: 'nba-booker', name: 'Devin Booker', team: 'PHX', position: 'SG', points: 25.6, rebounds: 4.5, assists: 6.9 },
  { id: 'nba-mitchell', name: 'Donovan Mitchell', team: 'CLE', position: 'SG', points: 24.5, rebounds: 4.3, assists: 6.1 },
  { id: 'nba-bane', name: 'Desmond Bane', team: 'MEM', position: 'SG', points: 22.6, rebounds: 4.5, assists: 4.5 },
  { id: 'nba-lavine', name: "Zach LaVine", team: 'CHI', position: 'SG', points: 23.2, rebounds: 4.6, assists: 4.0 },
  // SF
  { id: 'nba-lebron', name: 'LeBron James', team: 'LAL', position: 'SF', points: 23.7, rebounds: 8.2, assists: 9.0 },
  { id: 'nba-tatum', name: 'Jayson Tatum', team: 'BOS', position: 'SF', points: 26.8, rebounds: 8.0, assists: 5.4 },
  { id: 'nba-durant', name: 'Kevin Durant', team: 'PHX', position: 'SF', points: 27.1, rebounds: 6.6, assists: 4.0 },
  { id: 'nba-kawhi', name: 'Kawhi Leonard', team: 'LAC', position: 'SF', points: 22.8, rebounds: 7.1, assists: 3.8 },
  { id: 'nba-butler', name: 'Jimmy Butler', team: 'MIA', position: 'SF', points: 20.3, rebounds: 5.3, assists: 4.6 },
  // PF
  { id: 'nba-giannis', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', points: 30.4, rebounds: 11.9, assists: 6.5 },
  { id: 'nba-siakam', name: 'Pascal Siakam', team: 'IND', position: 'PF', points: 21.3, rebounds: 6.9, assists: 3.9 },
  { id: 'nba-randle', name: 'Julius Randle', team: 'NYK', position: 'PF', points: 24.0, rebounds: 9.2, assists: 5.0 },
  { id: 'nba-kp', name: 'Kristaps Porziņģis', team: 'BOS', position: 'PF', points: 20.1, rebounds: 7.2, assists: 2.0 },
  { id: 'nba-ingram', name: 'Brandon Ingram', team: 'NOP', position: 'PF', points: 22.4, rebounds: 5.5, assists: 5.4 },
  // C
  { id: 'nba-jokic', name: 'Nikola Jokić', team: 'DEN', position: 'C', points: 29.6, rebounds: 13.0, assists: 10.2 },
  { id: 'nba-embiid', name: 'Joel Embiid', team: 'PHI', position: 'C', points: 24.6, rebounds: 8.8, assists: 5.7 },
  { id: 'nba-wemby', name: 'Victor Wembanyama', team: 'SAS', position: 'C', points: 24.3, rebounds: 10.7, assists: 3.9 },
  { id: 'nba-bam', name: 'Bam Adebayo', team: 'MIA', position: 'C', points: 20.5, rebounds: 10.4, assists: 5.0 },
  { id: 'nba-davis', name: 'Anthony Davis', team: 'LAL', position: 'C', points: 24.7, rebounds: 12.6, assists: 3.5 },
  { id: 'nba-gobert', name: 'Rudy Gobert', team: 'MIN', position: 'C', points: 14.0, rebounds: 12.9, assists: 1.5 },
];

function getInitials(name) {
  return (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getNflMainStat(player) {
  if (player.position === 'QB' && player.pass_yd)
    return { val: player.pass_yd, lbl: 'Pass Yds' };
  if (player.position === 'RB' && player.rush_yd)
    return { val: player.rush_yd, lbl: 'Rush Yds' };
  if ((player.position === 'WR' || player.position === 'TE') && player.rec_yd)
    return { val: player.rec_yd, lbl: 'Rec Yds' };
  if (player.pass_yd) return { val: player.pass_yd, lbl: 'Pass Yds' };
  if (player.rush_yd) return { val: player.rush_yd, lbl: 'Rush Yds' };
  if (player.rec_yd) return { val: player.rec_yd, lbl: 'Rec Yds' };
  return null;
}

function getNflSecondaryStats(player) {
  const stats = [];
  if (player.pass_td) stats.push({ val: player.pass_td, lbl: 'Pass TDs' });
  if (player.rush_td) stats.push({ val: player.rush_td, lbl: 'Rush TDs' });
  if (player.rec_td) stats.push({ val: player.rec_td, lbl: 'Rec TDs' });
  if (player.receptions) stats.push({ val: player.receptions, lbl: 'Rec' });
  return stats.slice(0, 2);
}

function getNhlMainStat(player) {
  if (player.points) return { val: player.points, lbl: 'Points' };
  if (player.goals) return { val: player.goals, lbl: 'Goals' };
  if (player.assists) return { val: player.assists, lbl: 'Assists' };
  return null;
}

function getNhlSecondaryStats(player) {
  const stats = [];
  if (player.goals) stats.push({ val: player.goals, lbl: 'Goals' });
  if (player.assists) stats.push({ val: player.assists, lbl: 'Assists' });
  if (player.shots) stats.push({ val: player.shots, lbl: 'Shots' });
  return stats.slice(0, 2);
}

function getNbaMainStat(player) {
  if (player.points != null) return { val: player.points, lbl: 'PPG' };
  return null;
}

function getNbaSecondaryStats(player) {
  const stats = [];
  if (player.rebounds != null) stats.push({ val: player.rebounds, lbl: 'RPG' });
  if (player.assists != null) stats.push({ val: player.assists, lbl: 'APG' });
  return stats.slice(0, 2);
}

function formatStatVal(val) {
  if (val == null) return '—';
  return val % 1 !== 0 ? val.toFixed(1) : String(Math.round(val));
}

function PlayerCard({ player, color, mainStat, secondaryStats, betsPath, seasonLabel }) {
  const initials = getInitials(player.name);
  const accentColor = color || '#00f6ff';

  return (
    <div className="rounded-xl border border-sb-border bg-sb-card overflow-hidden hover:border-sb-blue transition-colors">
      <div
        className="p-4 flex flex-col items-center gap-1"
        style={{ background: `linear-gradient(135deg, ${accentColor}18 0%, transparent 100%)` }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
          style={{
            background: `${accentColor}18`,
            border: `2px solid ${accentColor}55`,
          }}
        >
          <span className="font-extrabold text-lg" style={{ color: accentColor }}>
            {initials}
          </span>
        </div>
        <span className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: accentColor }}>
          {player.team} · {player.position}
        </span>
        <span className="font-extrabold text-sb-text text-center leading-tight">{player.name}</span>
      </div>

      <div className="p-4 border-t border-sb-border">
        {mainStat ? (
          <div className="text-center mb-3">
            <div className="text-2xl font-extrabold text-sb-text">{formatStatVal(mainStat.val)}</div>
            <div className="text-[0.65rem] text-sb-muted uppercase tracking-wider">
              {mainStat.lbl} ({seasonLabel})
            </div>
          </div>
        ) : (
          <div className="text-center mb-3 text-sb-muted text-xs">No stats available</div>
        )}

        {secondaryStats.length > 0 && (
          <div className="flex justify-around mb-3">
            {secondaryStats.map((s) => (
              <div key={s.lbl} className="text-center">
                <div className="font-extrabold text-sb-text text-sm">{formatStatVal(s.val)}</div>
                <div className="text-[0.6rem] text-sb-muted">{s.lbl}</div>
              </div>
            ))}
          </div>
        )}

        <Link
          to={betsPath}
          className="block text-center text-xs font-extrabold border border-sb-border rounded-lg py-1.5 text-sb-muted hover:border-sb-blue hover:text-sb-blue transition-colors no-underline"
        >
          Bet Props →
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-sb-border bg-sb-card overflow-hidden animate-pulse">
      <div className="p-4 flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-sb-border" />
        <div className="h-3 w-20 bg-sb-border rounded" />
        <div className="h-4 w-28 bg-sb-border rounded" />
      </div>
      <div className="p-4 border-t border-sb-border flex flex-col gap-2">
        <div className="h-8 w-16 bg-sb-border rounded mx-auto" />
        <div className="h-3 w-24 bg-sb-border rounded mx-auto" />
        <div className="h-7 w-full bg-sb-border rounded mt-1" />
      </div>
    </div>
  );
}

export default function Players() {
  const [sport, setSport] = useState('nfl');
  const [nflPlayers, setNflPlayers] = useState([]);
  const [nhlPlayers, setNhlPlayers] = useState([]);
  const [nflLoading, setNflLoading] = useState(true);
  const [nhlLoading, setNhlLoading] = useState(false);
  const [nflError, setNflError] = useState('');
  const [nhlError, setNhlError] = useState('');
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('All');

  useEffect(() => {
    let alive = true;
    setNflLoading(true);
    fetch('/api/nfl/players')
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setNflPlayers(
          (Array.isArray(data) ? data : []).sort((a, b) => {
            const key = (p) => p.pass_yd || p.rush_yd || p.rec_yd || 0;
            return key(b) - key(a);
          }),
        );
      })
      .catch(() => {
        if (!alive) return;
        setNflError('Failed to load NFL players.');
      })
      .finally(() => {
        if (alive) setNflLoading(false);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (sport !== 'nhl' || nhlPlayers.length > 0) return;
    let alive = true;
    setNhlLoading(true);
    fetch('/api/nhl/players')
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setNhlPlayers(
          (Array.isArray(data) ? data : []).sort((a, b) =>
            (b.points || 0) - (a.points || 0),
          ),
        );
      })
      .catch(() => {
        if (!alive) return;
        setNhlError('Failed to load NHL players.');
      })
      .finally(() => {
        if (alive) setNhlLoading(false);
      });
    return () => { alive = false; };
  }, [sport, nhlPlayers.length]);

  const isNfl = sport === 'nfl';
  const isNhl = sport === 'nhl';
  const isNba = sport === 'nba';

  const players = isNfl ? nflPlayers : isNhl ? nhlPlayers : NBA_PLAYERS;
  const loading = isNfl ? nflLoading : isNhl ? nhlLoading : false;
  const error = isNfl ? nflError : isNhl ? nhlError : '';
  const positions = isNfl ? NFL_POSITIONS : isNhl ? NHL_POSITIONS : NBA_POSITIONS;
  const colors = isNfl ? NFL_COLORS : isNhl ? NHL_COLORS : NBA_COLORS;
  const betsPath = isNfl ? '/nfl' : isNhl ? '/hockey' : '/nba';
  const seasonLabel = isNba ? '2024-25' : '2025';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.team?.toLowerCase().includes(q);
      const matchesPos =
        posFilter === 'All' || p.position === posFilter;
      return matchesSearch && matchesPos;
    });
  }, [players, search, posFilter]);

  function handleSportSwitch(s) {
    setSport(s);
    setSearch('');
    setPosFilter('All');
  }

  return (
    <div className="w-full min-w-0 p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-3xl font-extrabold text-sb-text">Players</h1>
        {!loading && (
          <span className="text-sb-muted text-sm">{filtered.length} players</span>
        )}
      </div>

      {/* Sport tabs */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => handleSportSwitch('nfl')}
          className={
            sport === 'nfl'
              ? 'rounded-full px-4 py-2 text-xs font-extrabold bg-sb-blue text-sb-dark border border-sb-blue'
              : 'rounded-full px-4 py-2 text-xs font-extrabold bg-sb-bg text-sb-muted border border-sb-border hover:border-sb-blue'
          }
        >
          🏈 NFL
        </button>
        <button
          type="button"
          onClick={() => handleSportSwitch('nhl')}
          className={
            sport === 'nhl'
              ? 'rounded-full px-4 py-2 text-xs font-extrabold bg-sb-blue text-sb-dark border border-sb-blue'
              : 'rounded-full px-4 py-2 text-xs font-extrabold bg-sb-bg text-sb-muted border border-sb-border hover:border-sb-blue'
          }
        >
          🏒 NHL
        </button>
        <button
          type="button"
          onClick={() => handleSportSwitch('nba')}
          className={
            sport === 'nba'
              ? 'rounded-full px-4 py-2 text-xs font-extrabold bg-sb-blue text-sb-dark border border-sb-blue'
              : 'rounded-full px-4 py-2 text-xs font-extrabold bg-sb-bg text-sb-muted border border-sb-border hover:border-sb-blue'
          }
        >
          🏀 NBA
        </button>
      </div>

      {/* Search + position filters */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <input
          type="text"
          placeholder="Search player or team…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-sb-bg border border-sb-border rounded-xl px-4 py-2 text-sb-text text-sm outline-none focus:border-sb-blue w-[240px]"
        />
        <div className="flex gap-2 flex-wrap">
          {positions.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPosFilter(pos)}
              className={
                posFilter === pos
                  ? 'rounded-full px-3 py-1.5 text-xs font-extrabold bg-sb-blue text-sb-dark border border-sb-blue'
                  : 'rounded-full px-3 py-1.5 text-xs font-extrabold bg-sb-bg text-sb-muted border border-sb-border hover:border-sb-blue'
              }
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sb-error mb-4">{error}</p>}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.length === 0
            ? (
              <div className="col-span-full text-center text-sb-muted py-12">
                No players found.
              </div>
            )
            : filtered.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                color={colors[p.team]}
                mainStat={isNfl ? getNflMainStat(p) : isNhl ? getNhlMainStat(p) : getNbaMainStat(p)}
                secondaryStats={isNfl ? getNflSecondaryStats(p) : isNhl ? getNhlSecondaryStats(p) : getNbaSecondaryStats(p)}
                betsPath={betsPath}
                seasonLabel={seasonLabel}
              />
            ))}
      </div>
    </div>
  );
}
