import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './pages/login';
import Home from './pages/home';
import Dashboard from './pages/dashboard';
import HowToPlay from './pages/HowToPlay';
import Onboarding from './pages/onboarding';
import ProtectedRoute from './components/ProtectedRoute';
import SoccerPage from './pages/SoccerPage';

// ⭐ Add your new placeholder pages
import Games from './pages/Games';
import Players from './pages/Players';
import MyBets from './pages/MyBets';
import NotFound from './pages/NotFound';

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
      {
        path: 'soccer',
        element: <SoccerPage />,
      },

      // ⭐ Catch-all route for unknown pages
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
