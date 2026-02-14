import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './pages/login';
import Home from './pages/home';
import Dashboard from './pages/dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilePage from './Pages/ProfilePage';

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
  path: 'profile',
  element: (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
},
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
