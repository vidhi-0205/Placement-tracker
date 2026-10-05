const nextSteps = [
  "Add your first application",
  "Track interview progress",
  "Keep your placement search organized",
];

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Placement Tracker</p>
        <h1>Stay on top of every opportunity.</h1>
        <p className="intro">
          Organize applications, interviews, and offers in one clear place.
        </p>
        <button type="button" className="primary-button">
          Add application
        </button>
      </section>

      <section className="card" aria-labelledby="next-steps-heading">
        <h2 id="next-steps-heading">Get started</h2>
        <ul>
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
