export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Leagues</h2>

      <ul className="sidebar-list">
        <li>🏀 NBA</li>
        <li>🏈 NFL</li>
        <li>⚾ MLB</li>
        <li>
          <Link to="/hockey" className="no-underline">
            🏒 NHL
          </Link>
        <li>⚽ MLS</li>
        <li>🎾 Tennis</li>
        <li>🥊 UFC</li>
      </ul>
    </aside>
  );
}
