export default function Homepage() {
    const games = [
      {
        teams: "Lakers vs Warriors",
        spread1: "-3.5",
        spread2: "+3.5",
        ou: "220.5",
        ai: "Lakers 62% win probability",
      },
      {
        teams: "Celtics vs Heat",
        spread1: "-2.0",
        spread2: "+2.0",
        ou: "218.0",
        ai: "Celtics 58% win probability",
      },
      {
        teams: "Suns vs Clippers",
        spread1: "+1.5",
        spread2: "-1.5",
        ou: "225.5",
        ai: "Clippers 55% win probability",
      },
    ];
  
    return (
      <div className="container">
        <h1 className="page-title">Today's Games</h1>
  
        <div className="games-grid">
          {games.map((g, i) => (
            <div key={i} className="game-card">
              <div className="teams">{g.teams}</div>
  
              <div className="odds">
                <button>{g.spread1}</button>
                <button>{g.spread2}</button>
              </div>
  
              <div className="odds mt-2">
                <button>O {g.ou}</button>
                <button>U {g.ou}</button>
              </div>
  
              <div className="badge">{g.ai}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  