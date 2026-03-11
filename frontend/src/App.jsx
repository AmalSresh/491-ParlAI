import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

function App() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- THE ONBOARDING GUARD ---
  useEffect(() => {
    if (!loading && user) {
      // If they need onboarding and are NOT on the onboarding page, force them there
      if (user.onboardingStage === 0 && location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      }
      // If they are already onboarded but try to go to the onboarding page, send to dashboard
      else if (
        user.onboardingStage > 0 &&
        location.pathname === '/onboarding'
      ) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  // Check if we are currently on the onboarding page
  const isOnboardingPage = location.pathname === '/onboarding';

  return (
    <div className="min-h-screen flex flex-col bg-sb-bg">
      <nav className="flex items-center justify-between px-6 py-3 bg-sb-nav border-b-2 border-sb-blue shrink-0">
        <Link
          to="/"
          className="text-2xl font-extrabold text-sb-blue no-underline tracking-wide hover:text-sb-blue-light"
        >
          ParlAI
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
          >
            Home
          </Link>
          <Link
            to="/how-to-play"
            className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
          >
            How to Play
          </Link>
          {user ? (
            <>
              {/* Only show Dashboard link if they have finished onboarding */}
              {user.onboardingStage > 0 && (
                <Link
                  to="/dashboard"
                  className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
                >
                  Dashboard
                </Link>
              )}
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
              className="text-sb-text no-underline font-semibold text-[0.95rem] hover:text-sb-white"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Main layout: sidebar + routed page content */}
      {!loading && (
        <div className="flex-1 w-full max-w-7xl mx-auto py-6 px-8 box-border flex gap-6">
          {/* Hide the sidebar if the user is stuck in the onboarding flow */}
          {!isOnboardingPage && <Sidebar />}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
