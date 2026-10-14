"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ApplicationStatus, HistoricalPlacement, PlacementOpportunity } from "@/lib/db";

type Modal = "timeline" | "history" | "oa" | "status" | "auth" | null;
type ApiResponse = { opportunities: PlacementOpportunity[]; companyCount: number; error?: string };

const value = (text: string | number | null | undefined, fallback = "Not announced") =>
  text === null || text === undefined || text === "" ? fallback : String(text);
const date = (text: string | null) => text ? new Date(`${text}T00:00:00`).toLocaleDateString() : "Not announced";
const safeWebsite = (website: string | null) => {
  if (!website) return null;
  try {
    const url = new URL(website);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
};

export default function PlacementPage({ year }: { year: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<PlacementOpportunity | null>(null);
  const [history, setHistory] = useState<HistoricalPlacement[]>([]);
  const [applicationStatuses, setApplicationStatuses] = useState<ApplicationStatus[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: "", enrollmentId: "", email: "", password: "", phone: "", branch: "",
    graduationYear: "", cgpa: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ ...(search && { search }), ...(status && { status }), ...(role && { role }), ...(eligibility && { eligibility }) });
    fetch(`/api/placements/${encodeURIComponent(year)}?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load placement data.");
        setData(result);
      })
      .catch((reason: unknown) => { if ((reason as Error).name !== "AbortError") setError((reason as Error).message); });
    return () => controller.abort();
  }, [year, search, status, role, eligibility]);

  const openModal = async (nextModal: Modal, opportunity: PlacementOpportunity) => {
    setSelected(opportunity);
    setModal(nextModal);
    setHistory([]);
    setApplicationStatuses([]);
    setStatusMessage("");
    if (nextModal === "history" || nextModal === "status") {
      const action = nextModal === "history" ? "history" : "status";
      const response = await fetch(`/api/placements/${year}?action=${action}&companyId=${opportunity.companyId}`);
      const result = await response.json();
      if (nextModal === "history") setHistory(result.history || []);
      else {
        setApplicationStatuses(result.statuses || []);
        setStatusMessage(result.message || "");
        if (!result.available) setModal("auth");
      }
    }
  };

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authMode,
          ...authForm,
          graduationYear: authForm.graduationYear ? Number(authForm.graduationYear) : undefined,
          cgpa: authForm.cgpa ? Number(authForm.cgpa) : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Authentication failed.");
      if (selected) {
        setModal("status");
        setStatusMessage("");
        const statusResponse = await fetch(`/api/placements/${year}?action=status&companyId=${selected.companyId}`);
        const statusResult = await statusResponse.json();
        setApplicationStatuses(statusResult.statuses || []);
      }
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setModal(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const upcomingCount = useMemo(() => data?.opportunities.filter((item) => !["completed", "closed"].includes((item.driveStatus || "").toLowerCase())).length || 0, [data]);
  const opportunities = data?.opportunities || [];

  return (
    <main className="site-shell placement-shell">
      <nav className="navbar"><Link className="brand" href="/" aria-label="Back to dashboard"><span className="brand-mark">S</span><span><strong>SGSITS</strong><small>Placement Tracker</small></span></Link><span className="nav-meta">Placement opportunities</span></nav>
      <section className="placement-header">
        <Link className="back-link" href="/">← Dashboard</Link>
        <p className="eyebrow">Placement report · Batch {year}</p>
        <h1>Placement <em>Opportunities</em></h1>
        <p className="hero-text">Explore verified drives and roles for the {year} placement season.</p>
        <div className="stats-row">
          <div><strong>{data?.companyCount ?? "—"}</strong><span>Total companies</span></div>
          <div><strong>{data ? upcomingCount : "—"}</strong><span>Upcoming drives</span></div>
          <div><strong>—</strong><span>My applications</span></div>
        </div>
      </section>
      <section className="placement-content">
        <div className="filters">
          <input aria-label="Search companies by name" placeholder="Search companies by name" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filter by drive status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All drive statuses</option><option value="Upcoming">Upcoming</option><option value="Open">Open</option><option value="Completed">Completed</option><option value="Closed">Closed</option></select>
          <input aria-label="Filter by job role" placeholder="Job role" value={role} onChange={(event) => setRole(event.target.value)} />
          <input aria-label="Filter by eligibility" placeholder="Branch or CGPA" value={eligibility} onChange={(event) => setEligibility(event.target.value)} />
        </div>
        {error && <div className="state-card error-state">{error}</div>}
        {!error && !data && <div className="state-card">Loading placement opportunities…</div>}
        {!error && data && opportunities.length === 0 && <div className="state-card"><strong>No placement records found</strong><span>Try clearing a filter or check whether this batch has been added to the database.</span></div>}
        <div className="opportunity-grid">
          {opportunities.map((item) => {
            const website = safeWebsite(item.website);
            return <article className="opportunity-card" key={`${item.driveId}-${item.jobId}`}>
              <div className="opportunity-top"><span className="company-logo">{item.companyName.slice(0, 1)}</span><div><h2>{item.companyName}</h2><p>{value(item.industry, "Industry not available")} · {value(item.location, "Location not available")}</p></div><span className="drive-status">{value(item.driveStatus)}</span></div>
              <div className="opportunity-role"><strong>{item.jobRole}</strong><span>{item.packageLpa === null ? "Package not announced" : `₹${item.packageLpa} LPA`}</span></div>
              <dl className="opportunity-meta"><div><dt>Drive date</dt><dd>{date(item.driveDate)}</dd></div><div><dt>Deadline</dt><dd>{date(item.applicationDeadline)}</dd></div><div><dt>Eligibility</dt><dd>{item.minimumCgpa ? `${item.minimumCgpa} CGPA` : "Not announced"}{item.eligibilityBranch ? ` · ${item.eligibilityBranch}` : ""}</dd></div></dl>
              <div className="card-actions"><button onClick={() => openModal("timeline", item)}>Timeline</button><button onClick={() => openModal("history", item)}>Previous Year</button><button onClick={() => openModal("oa", item)}>OA</button><button onClick={() => openModal("status", item)}>See Your Status</button>{website && <a href={website} target="_blank" rel="noopener noreferrer">Official website ↗</a>}</div>
            </article>;
          })}
        </div>
      </section>
      {modal && selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><section className="placement-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" onClick={() => setModal(null)} aria-label="Close dialog">×</button>
        <p className="eyebrow">Batch {year} · {selected.companyName}</p><h2 id="modal-title">{modal === "auth" ? (authMode === "login" ? "Log in to see your status" : "Create your student account") : modal === "history" ? "Previous year placements" : modal === "oa" ? "Online assessment" : modal === "status" ? "Your application status" : "Placement timeline"}</h2>
        {modal === "auth" && <form className="auth-form" onSubmit={submitAuth}>
          {authMode === "signup" && <><label>Full name<input required value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} /></label><label>Enrollment ID<input required value={authForm.enrollmentId} onChange={(event) => setAuthForm({ ...authForm, enrollmentId: event.target.value })} /></label><label>Phone<input value={authForm.phone} onChange={(event) => setAuthForm({ ...authForm, phone: event.target.value })} /></label><label>Branch<input value={authForm.branch} onChange={(event) => setAuthForm({ ...authForm, branch: event.target.value })} /></label><label>Graduation year<input type="number" value={authForm.graduationYear} onChange={(event) => setAuthForm({ ...authForm, graduationYear: event.target.value })} /></label><label>CGPA<input type="number" step="0.01" min="0" max="10" value={authForm.cgpa} onChange={(event) => setAuthForm({ ...authForm, cgpa: event.target.value })} /></label></>}
          <label>Email<input required type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label>
          <label>Password <small>(minimum 8 characters)</small><input required minLength={8} type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label>
          {authError && <p className="auth-error">{authError}</p>}
          <button className="auth-submit" disabled={authBusy} type="submit">{authBusy ? "Please wait…" : authMode === "login" ? "Log in" : "Create account"}</button>
          <button className="auth-switch" type="button" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}>{authMode === "login" ? "New student? Create an account" : "Already registered? Log in"}</button>
        </form>}
        {modal === "timeline" && <div className="detail-grid"><div><strong>Role & description</strong><p>{value(selected.jobRole)}<br />{value(selected.jobDescription, "Job description not available")}</p></div><div><strong>Assessment</strong><p>{selected.oaDate ? `${date(selected.oaDate)} ${value(selected.oaTime, "")}` : "Not announced"}<br />{value(selected.oaInstructions, "Instructions not available")}</p></div><div><strong>Interviews</strong><p>{date(selected.interviewDate)}</p></div><div><strong>Requirements</strong><p>Minimum CGPA: {value(selected.minimumCgpa)}<br />Eligible branches: {value(selected.eligibilityBranch)}<br />Backlogs: {value(selected.backlogCriteria, "Not available")}</p></div><div><strong>Package / openings</strong><p>{selected.packageLpa === null ? "Package not announced" : `₹${selected.packageLpa} LPA`}<br />Openings: {value(selected.numberOfOpenings)}</p></div><div><strong>Deadline</strong><p>{date(selected.applicationDeadline)}</p></div></div>}
        {modal === "oa" && <div className="detail-grid"><div><strong>OA date and time</strong><p>{selected.oaDate ? `${date(selected.oaDate)} ${value(selected.oaTime, "")}` : "OA details not announced yet"}</p></div><div><strong>Assessment deadline</strong><p>{date(selected.applicationDeadline)}</p></div><div><strong>Instructions</strong><p>{value(selected.oaInstructions, "OA instructions not available")}</p></div><div><strong>Role and eligibility</strong><p>{selected.jobRole}<br />{value(selected.eligibilityBranch)} · Minimum CGPA {value(selected.minimumCgpa)}</p></div></div>}
        {modal === "history" && (history.length ? <div className="history-list">{history.map((item) => <div key={`${item.driveId}-${item.jobId}`}><strong>{item.driveYear} · {item.jobRole}</strong><span>{item.packageLpa === null ? "Package not announced" : `₹${item.packageLpa} LPA`} · {date(item.driveDate)} · {value(item.driveStatus)}</span></div>)}</div> : <div className="empty-modal">No previous-year records exist for {selected.companyName}.</div>)}
        {modal === "status" && (statusMessage ? <div className="empty-modal">{statusMessage}<br />Sign in integration is required before private application data can be shown.</div> : applicationStatuses.length ? <div className="history-list">{applicationStatuses.map((item) => <div key={item.applicationId}><strong>{item.jobRole}</strong><span>{value(item.applicationStatus, "Status not available")} · Applied {date(item.applicationDate)}</span></div>)}</div> : <div className="empty-modal">No application was found for this company and batch.</div>)}
      </section></div>}
    </main>
  );
}
