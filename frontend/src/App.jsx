import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // THE MAGIC FIX: The Route Guard
  // If a user is logged in, their onboarding stage is 0, AND they aren't already on the onboarding page...
  if (
    user &&
    user.onboardingStage === 0 &&
    location.pathname !== '/onboarding'
  ) {
    // ...force them to the onboarding page immediately!
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-white">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[#11131a] border-b border-[#1f2430] shadow-md">
        <h1 className="text-2xl font-extrabold tracking-wide text-sb-blue">
          ParlAI Sports Betting App
        </h1>

        <div className="flex gap-6 text-lg font-medium">
          <Link to="/" className="hover:text-sb-blue-light">
            Home
          </Link>
          <Link to="/games" className="hover:text-sb-blue-light">
            Games
          </Link>
          <Link to="/players" className="hover:text-sb-blue-light">
            Players
          </Link>
          <Link to="/bets" className="hover:text-sb-blue-light">
            My Bets
          </Link>
          <Link to="/how-to-play" className="hover:text-sb-blue-light">
            How to Play
          </Link>
          <Link to="/support" className="hover:text-sb-blue-light">
            Support
          </Link>
          {user ? (
            <>
              {user.onboardingStage > 0 && (
                <Link to="/dashboard" className="hover:text-sb-blue-light">
                  Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="bg-transparent border border-sb-white text-white py-2 px-4 rounded-lg font-semibold text-[0.95rem] cursor-pointer hover:bg-white hover:text-sb-dark"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-sb-blue-light">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
