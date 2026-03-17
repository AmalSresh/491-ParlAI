import { useState, useEffect } from 'react';
// Assuming your component file is named SoccerCard.jsx based on your import
import SoccerCard from '../components/SoccerCard';

const SoccerPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveGames = async () => {
      try {
        // REPLACE with your actual deployed Azure Function URL or local localhost URL
        const apiUrl = '/api/getGames';
        const response = await fetch(apiUrl);
        const backendData = await response.json();

        // Translate the nested backend JSON into the flat structure your GameCard expects
        const formattedGames = backendData.map((dbGame) => {
          // 1. Extract Moneyline (h2h)
          const h2hMarket = dbGame.markets?.find((m) => m.type === 'h2h');
          let mainOdds = 'TBD';
          if (h2hMarket) {
            // Finding the odds for home and away teams
            const homeOdds =
              h2hMarket.selections.find((s) => s.label === dbGame.homeTeam)
                ?.odds || '-';
            const awayOdds =
              h2hMarket.selections.find((s) => s.label === dbGame.awayTeam)
                ?.odds || '-';
            mainOdds = `${homeOdds} / ${awayOdds}`;
          }

          // 2. Extract Totals (Over/Under)
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

          // 3. Return the exact object shape your existing SoccerCard needs
          return {
            id: dbGame.id,
            homeTeam: dbGame.homeTeam,
            awayTeam: dbGame.awayTeam,
            homeScore: dbGame.scores?.home,
            awayScore: dbGame.scores?.away,
            mainOdds: mainOdds,
            totalLine: totalLine,
            overOdds: overOdds,
            underOdds: underOdds,
            // You can add logic later to pull logos dynamically, or use placeholders
            homeLogo: `https://via.placeholder.com/40?text=${dbGame.homeTeam.charAt(0)}`,
            awayLogo: `https://via.placeholder.com/40?text=${dbGame.awayTeam.charAt(0)}`,
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

    // Optional: Set up a polling interval to refresh odds/scores every 60 seconds
    const intervalId = setInterval(fetchLiveGames, 60000);
    return () => clearInterval(intervalId); // Cleanup on unmount
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
            <div className="text-white">No games scheduled.</div>
          ) : (
            games.map((game) => <SoccerCard key={game.id} game={game} />)
          )}
        </div>
      )}
    </div>
  );
};

export default SoccerPage;
