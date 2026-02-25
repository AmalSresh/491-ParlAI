import { Outlet, Link } from "react-router-dom";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-white">

      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[#11131a] border-b border-[#1f2430] shadow-md">
        <h1 className="text-2xl font-extrabold tracking-wide text-sb-blue">
          ParlAI Sports Betting App
        </h1>

        <div className="flex gap-6 text-lg font-medium">
          <Link to="/" className="hover:text-sb-blue-light">Home</Link>
          <Link to="/games" className="hover:text-sb-blue-light">Games</Link>
          <Link to="/players" className="hover:text-sb-blue-light">Players</Link>
          <Link to="/bets" className="hover:text-sb-blue-light">My Bets</Link>
          <Link to="/login" className="hover:text-sb-blue-light">Login</Link>
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

