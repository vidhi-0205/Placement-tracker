import Link from "next/link";
import type { Company } from "@/lib/db";

type PlacementYear = {
  year: number;
  label: string;
  status: "Previous" | "Current" | "Upcoming";
  note: string;
};

const placementYears: PlacementYear[] = (() => {
  const currentYear = new Date().getFullYear();

  return [
    {
      year: currentYear - 1,
      label: `${currentYear - 1}–${String(currentYear).slice(-2)}`,
      status: "Previous",
      note: "Previous placement season",
    },
    {
      year: currentYear,
      label: `${currentYear}–${String(currentYear + 1).slice(-2)}`,
      status: "Current",
      note: "Current placement season",
    },
    {
      year: currentYear + 1,
      label: `${currentYear + 1}–${String(currentYear + 2).slice(-2)}`,
      status: "Upcoming",
      note: "Upcoming placement season",
    },
  ];
})();

export default function Dashboard({ companies }: { companies: Company[] }) {
  return (
    <main className="site-shell">
      <nav className="navbar">
        <a className="brand" href="#" aria-label="SGSITS Placement Tracker home">
          <span className="brand-mark">S</span>
          <span>
            <strong>SGSITS</strong>
            <small>Placement Tracker</small>
          </span>
        </a>
        <div className="nav-meta">
          <span className="live-dot" />
          <span>Indore, Madhya Pradesh</span>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Career outcomes · SGSITS Indore</p>
          <h1>Where <em>talent</em><br />meets opportunity.</h1>
          <p className="hero-text">
            Explore placement outcomes from Shri Govindram Seksaria Institute
            of Technology and Science.
          </p>
          <div className="trust-row">
            <span><b>✦</b> Verified institute data</span>
            <span><b>◷</b> Updated each season</span>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit-core">
            <span>SGSITS</span>
            <strong>1952</strong>
          </div>
          <span className="orbit-label label-top">ENGINEERING</span>
          <span className="orbit-label label-right">INDORE</span>
          <span className="orbit-label label-bottom">EST. 1952</span>
        </div>
      </section>

      <section className="batch-section" aria-labelledby="batch-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / Choose a report</p>
            <h2 id="batch-heading">Select your placement year</h2>
          </div>
          <p className="section-hint">Choose a year to view its visiting companies.</p>
        </div>

        <div className="batch-grid">
          {placementYears.map((placementYear) => (
            <Link
              className="batch-card"
              key={placementYear.year}
              href={`/placements/${placementYear.year}`}
            >
              <div className="batch-top">
                <span className={`status status-${placementYear.status.toLowerCase()}`}>
                  <i /> {placementYear.status}
                </span>
                <span className="arrow">↗</span>
              </div>
              <span className="batch-year">{placementYear.label}</span>
              <strong>Batch {placementYear.year + 1}</strong>
              <span className="batch-note">{placementYear.note}</span>
              <div className="batch-footer">{companies.length} companies</div>
            </Link>
          ))}
        </div>
      </section>

      <footer>
        <span>Built for the SGSITS community</span>
        <span>Placement Cell · SGSITS Indore</span>
      </footer>
    </main>
  );
}
