import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="header">
      <h1>ParlAI Sports Betting App</h1>

      <nav className="flex items-center gap-4">
        <Link
          to="/"
          className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
        >
          Home
        </Link>
        <Link
          to="/games"
          className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
        >
          Games
        </Link>
        <Link
          to="/players"
          className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
        >
          Players
        </Link>
        <Link
          to="/bets"
          className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
        >
          My Bets
        </Link>
        <Link
          to="/how-to-play"
          className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
        >
          How to Play
        </Link>

        {!loading && (
          <>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  className="bg-transparent border border-sb-white text-white py-2 px-4 rounded-lg font-semibold text-[0.95rem] cursor-pointer hover:bg-white hover:text-sb-dark"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-transparent border border-sb-white text-white py-2 px-4 rounded-lg font-semibold text-[0.95rem] no-underline hover:bg-white hover:text-sb-dark"
              >
                Login
              </Link>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
