"use client";

import { useState } from "react";

const batches = [
  {
    year: "2024–25",
    label: "Batch 2025",
    status: "Completed",
    note: "Final placement report",
    companies: 86,
    offers: 412,
  },
  {
    year: "2025–26",
    label: "Batch 2026",
    status: "Live",
    note: "Current placement season",
    companies: 54,
    offers: 287,
  },
  {
    year: "2026–27",
    label: "Batch 2027",
    status: "Upcoming",
    note: "Data will be available soon",
    companies: 0,
    offers: 0,
  },
];

const highlights = [
  { value: "₹24.5 LPA", label: "Highest package", icon: "↗" },
  { value: "₹8.4 LPA", label: "Average package", icon: "◈" },
  { value: "92%", label: "Placement rate", icon: "◎" },
];

export default function Home() {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const selected = batches.find((batch) => batch.year === selectedBatch);

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
          <p className="eyebrow">Career outcomes · 2025</p>
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
            <h2 id="batch-heading">Select your batch year</h2>
          </div>
          <p className="section-hint">Choose a year to unlock its placement insights.</p>
        </div>

        <div className="batch-grid">
          {batches.map((batch) => (
            <button
              type="button"
              className={`batch-card ${selectedBatch === batch.year ? "selected" : ""} ${batch.status === "Upcoming" ? "disabled" : ""}`}
              key={batch.year}
              onClick={() => batch.status !== "Upcoming" && setSelectedBatch(batch.year)}
              disabled={batch.status === "Upcoming"}
            >
              <div className="batch-top">
                <span className={`status status-${batch.status.toLowerCase()}`}>
                  <i /> {batch.status}
                </span>
                <span className="arrow">↗</span>
              </div>
              <span className="batch-year">{batch.year}</span>
              <strong>{batch.label}</strong>
              <span className="batch-note">{batch.note}</span>
              <div className="batch-footer">
                {batch.companies > 0 ? `${batch.companies} companies · ${batch.offers} offers` : "Coming soon"}
              </div>
            </button>
          ))}
        </div>
      </section>

      {selected && selected.status !== "Upcoming" && (
        <section className="insights" aria-labelledby="insights-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 / Placement snapshot</p>
              <h2 id="insights-heading">{selected.label} at a glance</h2>
            </div>
            <span className="season-pill"><i /> {selected.status} season</span>
          </div>
          <div className="highlight-grid">
            {highlights.map((highlight) => (
              <div className="highlight-card" key={highlight.label}>
                <span className="highlight-icon">{highlight.icon}</span>
                <strong>{highlight.value}</strong>
                <span>{highlight.label}</span>
              </div>
            ))}
            <div className="highlight-card companies-card">
              <span className="company-stack"><i /><i /><i /></span>
              <strong>{selected.companies}</strong>
              <span>Hiring companies</span>
            </div>
          </div>
        </section>
      )}

      <footer>
        <span>Built for the SGSITS community</span>
        <span>Placement Cell · SGSITS Indore</span>
      </footer>
    </main>
  );
}
