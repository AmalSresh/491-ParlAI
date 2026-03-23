import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './pages/login';
import Home from './pages/home';
import Dashboard from './pages/dashboard';
import HowToPlay from './pages/HowToPlay';
import Onboarding from './pages/onboarding';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

// ⭐ Add your new placeholder pages
import NFLBets from './pages/NFLBets';
import SoccerPage from './pages/SoccerPage';

import Games from './pages/Games';
import Players from './pages/Players';
import MyBets from './pages/MyBets';
import NotFound from './pages/NotFound';
import Hockey from './pages/Hockey';
import Support from './pages/Support';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Home page
      {
        index: true,
        element: <Home />,
      },

      // ⭐ New pages you added
      {
        path: 'games',
        element: <Games />,
      },
      {
        path: 'players',
        element: <Players />,
      },
      {
        path: 'bets',
        element: <MyBets />,
      },

      {
        path: 'hockey',
        element: <Hockey />,
      },
      {
        path: 'support',
        element: <Support />,
      },

      // Existing pages
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'how-to-play',
        element: <HowToPlay />,
      },
      {
        path: 'onboarding',
        element: (
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },

      // ⭐ Catch-all route for unknown pages
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'soccer',
        element: <SoccerPage />,
      },
      {
        path: 'nfl',
        element: <NFLBets />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
