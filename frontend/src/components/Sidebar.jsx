import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Leagues</h2>
      <ul className="sidebar-list">
        <li>🏀 NBA</li>
        <li>
          <Link to="/nfl" className="hover:text-sb-blue-light">
            🏈 NFL
          </Link>
        </li>
        <li>⚾ MLB</li>
        <li>🏒 NHL</li>
        <li>⚽ MLS</li>
        <li>🎾 Tennis</li>
        <li>🥊 UFC</li>
      </ul>
    </aside>
  );
}