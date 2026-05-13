const STEPS = [
  {
    title: 'Pick a League',
    body: 'Choose from NBA, NFL, MLB, NHL, Soccer, or UFC to see all upcoming and live matchups for that league.',
  },
  {
    title: 'Browse the Matchups',
    body: 'Each game card shows the two competing teams, the scheduled tip-off or game time, and live scores once the game is underway.',
  },
  {
    title: 'Select a Bet',
    body: 'Pick a market — Moneyline (who wins), Spread (win by how much), or Over/Under (total score) — and tap the odds button to add it to your bet slip.',
  },
  {
    title: 'Build Your Bet Slip',
    body: 'Add multiple team picks to create a parlay, or keep it to a single game for a straight bet. The potential payout updates automatically as you add selections.',
  },
  {
    title: 'Place Your Bet',
    body: 'Enter your stake in the bet slip at the bottom of the screen and confirm. Your balance updates instantly and you can track all open and settled bets under My Bets.',
  },
];

export default function HowToPlay() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8 text-slate-100">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">How to Play</h1>
        <p className="mt-2 text-slate-300">
          A quick guide to using ParlAI predictions and understanding
          confidence.
        </p>
      </header>

      <section className="grid gap-4">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-xl border border-slate-700 bg-slate-900/60 p-5"
          >
            <h2 className="text-lg font-semibold">
              Step {i + 1}: <span className="text-slate-100">{step.title}</span>
            </h2>
            <p className="mt-2 text-slate-300">{step.body}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-slate-100">Disclaimer:</span>{' '}
          ParlAI provides statistical insights for educational/entertainment
          purposes. It is not financial or betting advice.
        </p>
      </div>
    </main>
  );
}
