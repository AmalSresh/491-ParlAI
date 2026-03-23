import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  const { user } = useAuth();
  const location = useLocation();

  if (
    user &&
    user.onboardingStage === 0 &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-white">
      <Header />
      {/* Main Layout */}
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
