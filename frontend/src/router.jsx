import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './pages/login';
import Home from './pages/home';
import Dashboard from './pages/dashboard';
import HowToPlay from './pages/HowToPlay';
import Support from './pages/support';
import Onboarding from './pages/onboarding';
import ProtectedRoute from './components/ProtectedRoute';
import NFLBets from './pages/NFLBets';
import SoccerPage from './pages/SoccerPage';
import Games from './pages/Games';
import Players from './pages/Players';
import MyBets from './pages/MyBets';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'games',
        element: <Games />,
      },
      {
        path: 'support',
        element: (
          <ProtectedRoute>
            <Support />
          </ProtectedRoute>
        ),
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