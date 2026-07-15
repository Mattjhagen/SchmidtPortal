"use client";
import { useState } from "react";

export default function SendEstimateButton({ estimateId, disabled }: { estimateId: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/estimates/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimateId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) setErr(data.error ?? "Failed to send");
    else { setLink(data.actionLink ?? null); location.reload(); }
  }

  return (
    <div>
      <button className="btn btn-primary" onClick={send} disabled={busy || disabled}>
        {busy ? "Sending…" : "✉ Email to Customer"}
      </button>
      {err && <span style={{ color: "#dc2626", fontSize: 13, marginLeft: 10 }}>{err}</span>}
      {link && <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Dev invite link: <a href={link}>{link}</a></p>}
    </div>
  );
}
