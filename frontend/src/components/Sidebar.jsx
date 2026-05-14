import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Leagues</h2>
      <ul className="sidebar-list">
        <li><Link to="/nba" className="no-underline hover:text-sb-blue-light">🏀 NBA</Link></li>
        <li><Link to="/mlb" className="no-underline hover:text-sb-blue-light">⚾ MLB</Link></li>
        <li><Link to="/hockey" className="no-underline hover:text-sb-blue-light">🏒 NHL</Link></li>
        <li><Link to="/soccer" className="no-underline hover:text-sb-blue-light">⚽ Soccer</Link></li>
      </ul>
    </aside>
  );
}
