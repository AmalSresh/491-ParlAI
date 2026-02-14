const STEPS = [
  {
    title: 'Pick a League',
    body: 'Choose NBA, NFL, or another supported League to see available games and player props.',
  },
  {
    title: 'Find player or team',
    body: 'Search or browse to pull up stats, trends , and upcoming matchups.',
  },
  {
    title: 'Check the prediction',
    body: ' How we check prediction is based off of historical plus recent perfomance data to predict what might happen next game.',
  },
  {
    title: 'The Risk of making money',
    body: 'Predictions help yo make smarter choices, but not everything in this sports world is guarenteed.',
  },
  ];

export default function HowToPlay() {
  return (
    <main style={{ padding:24, maxWidth:900, margin: '0 auto' }}>
      <header style={{ marginBottom:16 }}>
        <h1 style={{marginBottom: 8}}>How To Play</h1>
        <p style={{ margin: 0 }}>
          Quick guide to using ParlAI predictions and reading confidence levels.
        </p>
      </header>

      <section style={{ display: 'grid', gap: 14 }}>
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>
              Step {i + 1}: {step.title}
            </h2>
            <p style={{ margin: 0 }}>{step.body}</p>
          </div>
        ))}
      </section>

      <section
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 12,
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Disclaimer:</strong> ParlAI provides statistical insights for education and
          entertainment. It is not financial advice, and predictions are not guarantees.
        </p>
      </section>
    </main>
  );
}
