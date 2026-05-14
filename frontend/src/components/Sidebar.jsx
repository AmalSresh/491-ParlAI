import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Leagues</h2>
      <ul className="sidebar-list">
        <li>
          <Link to="/nba" className="no-underline">
            🏀 NBA
          </Link>
        </li>
        <li>
          <Link to="/nfl" className="hover:text-sb-blue-light">
            🏈 NFL
          </Link>
        </li>
        <li>
          <Link to="/soccer">⚽ Soccer</Link>
        </li>
      </ul>
    </aside>
  );
}
