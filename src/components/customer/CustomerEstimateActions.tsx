"use client";
import { useState } from "react";
import { requestChange, setEstimateStatus } from "@/lib/actions/estimates";

type Change = { id: string; body: string; created_at: string };

export default function CustomerEstimateActions({ estimateId, status, changes }:
  { estimateId: string; status: string; changes: Change[] }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const decided = status === "accepted" || status === "declined";

  return (
    <div className="card">
      {!decided && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button className="btn btn-primary" disabled={busy}
            onClick={async () => { setBusy(true); await setEstimateStatus(estimateId, "accepted"); location.reload(); }}>
            ✓ Accept Estimate
          </button>
          <button className="btn btn-ghost" disabled={busy}
            onClick={async () => { setBusy(true); await setEstimateStatus(estimateId, "declined"); location.reload(); }}>
            Decline
          </button>
        </div>
      )}
      {status === "accepted" && <p style={{ color: "#166534", fontWeight: 600 }}>✓ You accepted this estimate. Schmidt Construction will be in touch to schedule.</p>}

      <div style={{ fontWeight: 700, marginBottom: 8 }}>Request Changes</div>
      {changes.map(c => (
        <div key={c.id} style={{ borderLeft: "3px solid #f59e0b", padding: "6px 10px", marginBottom: 8, background: "#fffbeb" }}>
          <div style={{ fontSize: 13 }}>{c.body}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(c.created_at).toLocaleString()}</div>
        </div>
      ))}
      <textarea className="input" rows={3} value={msg} onChange={e => setMsg(e.target.value)}
        placeholder="Describe the changes you'd like…" style={{ margin: "6px 0 10px" }} />
      <button className="btn btn-ghost" disabled={busy || !msg.trim()}
        onClick={async () => { setBusy(true); await requestChange(estimateId, msg); setMsg(""); location.reload(); }}>
        Send Request
      </button>
    </div>
  );
}
