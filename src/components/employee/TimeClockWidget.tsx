"use client";
import { useState, useEffect } from "react";
import { clockIn, clockOut } from "@/lib/actions/time";

type Job = { id: string; name: string; customer: { full_name: string } | null };
type Entry = { id: string; job_id: string | null; clock_in: string; clock_out: string | null; hours: number | null; job?: { name: string } | null };

export default function TimeClockWidget({ jobs, openEntry, recent }:
  { jobs: Job[]; openEntry: Entry | null; recent: Entry[] }) {
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [breakMin, setBreakMin] = useState(0);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!openEntry) return;
    const tick = () => {
      const ms = Date.now() - new Date(openEntry.clock_in).getTime();
      const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4), s = Math.floor((ms % 6e4) / 1000);
      setElapsed(`${h}h ${m}m ${s}s`);
    };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [openEntry]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 900 }}>
      <div className="card">
        {openEntry ? (
          <>
            <div className="badge" style={{ background: "#dcfce7", color: "#166534" }}>ON THE CLOCK</div>
            <div style={{ fontSize: 34, fontWeight: 800, margin: "14px 0" }}>{elapsed}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Job: {recent.find(r => r.id === openEntry.id)?.job?.name ?? "— (untagged)"}
            </div>
            <label style={{ fontSize: 13, display: "block", marginTop: 14 }}>Break (minutes)</label>
            <input className="input" type="number" min={0} value={breakMin}
              onChange={e => setBreakMin(+e.target.value)} style={{ margin: "6px 0 12px" }} />
            <button className="btn btn-primary" disabled={busy}
              onClick={async () => { setBusy(true); await clockOut(openEntry.id, breakMin); location.reload(); }}>
              Clock Out
            </button>
          </>
        ) : (
          <>
            <div className="badge" style={{ background: "#fef3c7", color: "#92400e" }}>CLOCKED OUT</div>
            <label style={{ fontSize: 13, display: "block", marginTop: 14 }}>Job / Project</label>
            <select className="input" value={jobId} onChange={e => setJobId(e.target.value)}
              style={{ margin: "6px 0 10px" }}>
              <option value="">— No job (general) —</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.name} · {j.customer?.full_name}</option>)}
            </select>
            <label style={{ fontSize: 13, display: "block" }}>Note (optional)</label>
            <input className="input" value={note} onChange={e => setNote(e.target.value)}
              placeholder="What are you working on?" style={{ margin: "6px 0 12px" }} />
            <button className="btn btn-primary" disabled={busy}
              onClick={async () => { setBusy(true); await clockIn(jobId || null, note); location.reload(); }}>
              Clock In
            </button>
          </>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Recent Punches</div>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", color: "#64748b" }}>
            <th style={{ padding: "6px 4px" }}>Job</th><th>In</th><th>Hours</th></tr></thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ padding: "8px 4px" }}>{r.job?.name ?? "—"}</td>
                <td>{new Date(r.clock_in).toLocaleDateString()} {new Date(r.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{r.hours ?? "—"}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={3} style={{ padding: 12, color: "#94a3b8" }}>No punches yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
