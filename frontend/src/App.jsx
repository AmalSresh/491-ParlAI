import { Outlet, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// If ui-updates added Sidebar, keep it:
import Sidebar from './components/Sidebar';

function App() {
  const { user, logout, loading } = useAuth();

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
          <Sidebar />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
