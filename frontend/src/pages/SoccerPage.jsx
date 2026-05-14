import { useState, useMemo } from 'react';
import SoccerCard from '../components/SoccerCard';
import SoccerHeader from '../components/SoccerHeader';
import LoadingScreen from '../components/LoadingScreen';
import { useGlobalBetSlip } from '../context/BetSlipContext';
import { getSoccerGames } from '../hooks/getSoccerGames.js';
import { isBettingClosed } from '../utils/betPayload.js';
import { classifyGameFromGame } from '../utils/gameStatus.js';

const STATUS_FILTERS = ['all', 'live', 'upcoming', 'finished'];

const SoccerPage = () => {
  const { selections, toggleSelection, pruneSelectionsForGames } =
    useGlobalBetSlip();
  const { games, loading } = getSoccerGames(pruneSelectionsForGames);
  const [statusFilter, setStatusFilter] = useState('all');

  const classified = useMemo(
    () =>
      games.map((g) => ({
        g,
        cls: classifyGameFromGame({ ...g, sport: 'soccer' }),
      })),
    [games],
  );

  const liveCount = useMemo(
    () => classified.filter(({ cls }) => cls === 'live').length,
    [classified],
  );

  const filtered = useMemo(() => {
    return classified
      .filter(({ cls }) => statusFilter === 'all' || statusFilter === cls)
      .map(({ g }) => g);
  }, [classified, statusFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0f14] relative">
      <SoccerHeader />

      {loading ? (
        <LoadingScreen />
      ) : (
        <div className="p-4 sm:p-8 pb-40">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  border: statusFilter === f ? '1px solid #00f6ff' : '1px solid #404040',
                  background: statusFilter === f ? 'rgba(0,246,255,0.1)' : '#11131a',
                  color: statusFilter === f ? '#00f6ff' : '#9ca3af',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.18s',
                  textTransform: 'capitalize',
                }}
              >
                {f === 'live' && liveCount > 0
                  ? `Live (${liveCount})`
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <span className="ml-auto text-sb-muted text-sm self-center">
              {filtered.length} game{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Game grid */}
          {filtered.length === 0 ? (
            <div className="text-gray-500 text-center mt-16 text-lg border border-dashed border-gray-800 rounded-lg py-12">
              No {statusFilter === 'all' ? '' : statusFilter} games right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
              {filtered.map((game) => (
                <SoccerCard
                  key={game.id}
                  game={game}
                  onToggleBet={toggleSelection}
                  selectedBets={selections}
                  bettingClosed={isBettingClosed(game)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SoccerPage;
