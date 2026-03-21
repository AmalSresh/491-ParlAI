import { useState, useEffect } from 'react';
import SoccerCard from '../components/SoccerCard';

const SoccerPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveGames = async () => {
      try {
        const apiUrl = '/api/getGames';
        const response = await fetch(apiUrl);
        const backendData = await response.json();

        const formattedGames = backendData.map((dbGame) => {
          // 1. Extract Moneyline (h2h) - FIXED STRING MATCHING
          const h2hMarket = dbGame.markets?.find((m) => m.type === 'h2h');

          let homeOdds = '-',
            awayOdds = '-',
            drawOdds = '-';

          if (h2hMarket) {
            // Flexible matching: check if "AFC Bournemouth" includes "Bournemouth" (or vice versa)
            homeOdds =
              h2hMarket.selections.find(
                (s) =>
                  dbGame.homeTeam.includes(s.label) ||
                  s.label.includes(dbGame.homeTeam),
              )?.odds || '-';

            awayOdds =
              h2hMarket.selections.find(
                (s) =>
                  dbGame.awayTeam.includes(s.label) ||
                  s.label.includes(dbGame.awayTeam),
              )?.odds || '-';

            // ADDED: Capture the Draw odds!
            drawOdds =
              h2hMarket.selections.find(
                (s) =>
                  s.label.toLowerCase() === 'draw' ||
                  s.label.toLowerCase() === 'tie',
              )?.odds || '-';
          }

          // Format it as a 3-way line for soccer
          const mainOdds = `${homeOdds} / ${drawOdds} / ${awayOdds}`;

          // 2. Extract Totals (Over/Under) - This was already perfect
          const totalsMarket = dbGame.markets?.find((m) => m.type === 'totals');
          let totalLine = '-',
            overOdds = '-',
            underOdds = '-';

          if (totalsMarket && totalsMarket.selections.length > 0) {
            const over = totalsMarket.selections.find((s) =>
              s.label.toLowerCase().includes('over'),
            );
            const under = totalsMarket.selections.find((s) =>
              s.label.toLowerCase().includes('under'),
            );

            totalLine = over?.lineValue || under?.lineValue || '-';
            overOdds = over?.odds || '-';
            underOdds = under?.odds || '-';
          }

          // 3. Return the exact object shape
          return {
            id: dbGame.id,
            homeTeam: dbGame.homeTeam,
            awayTeam: dbGame.awayTeam,
            homeScore: dbGame.scores?.home,
            awayScore: dbGame.scores?.away,
            mainOdds: mainOdds,
            drawOdds: drawOdds,
            totalLine: totalLine,
            overOdds: overOdds,
            underOdds: underOdds,
            homeLogo:
              dbGame.homeLogo ||
              `https://ui-avatars.com/api/?name=${dbGame.homeTeam}&background=random`,
            awayLogo:
              dbGame.awayLogo ||
              `https://ui-avatars.com/api/?name=${dbGame.awayTeam}&background=random`,
            startTime: dbGame.startTime,
            status: dbGame.status,
          };
        });

        setGames(formattedGames);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveGames();
    const intervalId = window.setInterval(fetchLiveGames, 300000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0f14]">
      <div className="bg-sb-blue text-black h-16 w-full flex items-center px-6 shadow-md">
        <h1 className="text-3xl font-bold">Soccer Matches</h1>
      </div>

      {loading ? (
        <div className="text-white text-center mt-10 text-xl">
          Loading live odds...
        </div>
      ) : (
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 align-top items-start">
          {games.length === 0 ? (
            <div className="text-white col-span-full text-center">
              No games scheduled.
            </div>
          ) : (
            games.map((game) => <SoccerCard key={game.id} game={game} />)
          )}
        </div>
      )}
    </div>
  );
};

export default SoccerPage;
