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
        <li>🏈 NFL</li>
        <li>⚾ MLB</li>
        <li>🏒 NHL</li>
        <li>
          <Link to="/soccer">⚽ Soccer</Link>
        </li>
        <li>🎾 Tennis</li>
        <li>🥊 UFC</li>
      </ul>
    </aside>
  );
}
