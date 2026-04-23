import { useState, useEffect } from 'react';

export const getMLBGames = (pruneSelectionsForGames) => {
  const [games,   setGames]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/mlb/games');
        if (!res.ok) throw new Error('Failed to fetch MLB games');
        const data = await res.json();

        setGames(data);

        // Prune any bet slip selections for games that are now closed
        if (pruneSelectionsForGames) pruneSelectionsForGames(data);
      } catch (err) {
        console.error('Failed to fetch MLB games:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
    // Refresh every 5 minutes
    const intervalId = window.setInterval(fetchGames, 300000);
    return () => window.clearInterval(intervalId);
  }, [pruneSelectionsForGames]);

  return { games, loading, error };
};