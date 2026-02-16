import Header from "../components/Header";
import Footer from "../components/Footer";
import GameCard from "../components/GameCard";

export default function Homepage() {
  const games = [
    {
      teamA: "Lakers",
      teamB: "Warriors",
      spreadA: "-3.5",
      spreadB: "+3.5",
      totalOver: "O 220.5",
      totalUnder: "U 220.5",
      prediction: "Lakers 62% win probability"
    },
    {
      teamA: "Celtics",
      teamB: "Heat",
      spreadA: "-2.0",
      spreadB: "+2.0",
      totalOver: "O 218.0",
      totalUnder: "U 218.0",
      prediction: "Celtics 58% win probability"
    },
    {
      teamA: "Suns",
      teamB: "Clippers",
      spreadA: "+1.5",
      spreadB: "-1.5",
      totalOver: "O 225.5",
      totalUnder: "U 225.5",
      prediction: "Clippers 55% win probability"
    }
  ];

  return (
    <div>
      <Header />

      <div className="container">
        <h2>Today's Games</h2>

        <div className="games-grid">
          {games.map((g, i) => (
            <GameCard key={i} game={g} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
