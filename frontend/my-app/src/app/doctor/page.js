"use client";
import { useState, useEffect } from "react";

const SEVERITY_CONFIG = {
  2: {
    label: "Critical",
    bg: "bg-red-950/60",
    border: "border-red-500/60",
    badge: "bg-red-500 text-white",
    dot: "bg-red-400",
    glow: "shadow-red-900/40",
    icon: "🔴",
  },
  1: {
    label: "Moderate",
    bg: "bg-amber-950/50",
    border: "border-amber-500/50",
    badge: "bg-amber-500 text-white",
    dot: "bg-amber-400",
    glow: "shadow-amber-900/40",
    icon: "🟡",
  },
  0: {
    label: "Stable",
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/40",
    badge: "bg-emerald-600 text-white",
    dot: "bg-emerald-400",
    glow: "shadow-emerald-900/40",
    icon: "🟢",
  },
};

function PulseRing({ color }) {
  return (
    <span className="relative flex h-3 w-3">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${color}`}
      />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
    </span>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-1 backdrop-blur-sm">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      <div className="text-slate-300 text-sm font-medium">{label}</div>
      {sub && <div className="text-slate-500 text-xs">{sub}</div>}
    </div>
  );
}

function PatientCard({ patient, report, onReportChange, onComplete, completing }) {
  const sev = Number(patient.severity);
  const cfg = SEVERITY_CONFIG[sev] ?? SEVERITY_CONFIG[0];
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={`rounded-2xl border ${cfg.border} ${cfg.bg} shadow-xl ${cfg.glow} backdrop-blur-sm transition-all duration-300`}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <PulseRing color={cfg.dot} />
          <div>
            <h3 className="text-white font-semibold text-lg leading-tight">
              {patient.name}
            </h3>
            <p className="text-slate-400 text-sm mt-0.5">{patient.action}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${cfg.badge}`}
          >
            {cfg.icon} {cfg.label}
          </span>
          <span className="text-slate-500 text-lg">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expandable Body */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-white/5 pt-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
              Medical Report
            </label>
            <textarea
              rows={4}
              placeholder="Enter diagnosis, treatment given, medications prescribed, follow-up instructions…"
              value={report}
              onChange={(e) => onReportChange(e.target.value)}
              className="w-full rounded-xl bg-slate-900/70 border border-slate-600/50 text-slate-100 placeholder-slate-600 px-4 py-3 text-sm resize-none focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-slate-600 text-xs">
              {report.length > 0
                ? `${report.length} characters`
                : "Report required before completing"}
            </p>
            <button
              onClick={onComplete}
              disabled={completing || !report.trim()}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                ${
                  completing || !report.trim()
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 active:scale-95"
                }`}
            >
              {completing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>✓ Complete &amp; File Report</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryRow({ entry, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-700/50 last:border-0">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors rounded-xl"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="text-slate-600 font-mono text-xs w-5">{index + 1}</span>
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-cyan-400 font-bold text-sm">
            {entry.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="text-slate-200 font-medium text-sm">{entry.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-xs">
            {entry.timestamp
              ? new Date(entry.timestamp).toLocaleString()
              : "Completed"}
          </span>
          <span className="text-slate-500 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="px-12 pb-4">
          <p className="text-slate-400 text-sm bg-slate-900/60 rounded-xl px-4 py-3 font-mono leading-relaxed border border-slate-700/40">
            {entry.report || "No report filed."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Doctor() {
  const [queue, setQueue] = useState([]);
  const [reports, setReports] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState({});
  const [tab, setTab] = useState("queue");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchQueue = async () => {
    try {
      const r = await fetch("http://127.0.0.1:8000/queue");
      setQueue(await r.json());
    } catch { setQueue([]); }
  };

  const fetchHistory = async () => {
    try {
      const r = await fetch("http://127.0.0.1:8000/reports");
      setHistory(await r.json());
    } catch { setHistory([]); }
  };

  const complete = async (name) => {
    if (!reports[name]?.trim()) {
      showToast("Please write a medical report before completing.", "error");
      return;
    }
    setCompleting((c) => ({ ...c, [name]: true }));
    try {
      await fetch("http://127.0.0.1:8000/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, report: reports[name] }),
      });
      setReports((r) => { const n = { ...r }; delete n[name]; return n; });
      await fetchQueue();
      await fetchHistory();
      showToast(`${name}'s report filed successfully.`);
    } catch {
      showToast("Failed to submit. Check server connection.", "error");
    } finally {
      setCompleting((c) => { const n = { ...c }; delete n[name]; return n; });
    }
  };

  useEffect(() => {
    Promise.all([fetchQueue(), fetchHistory()]).finally(() =>
      setLoading(false)
    );
    const iv = setInterval(() => { fetchQueue(); fetchHistory(); }, 15000);
    return () => clearInterval(iv);
  }, []);

  const critical = queue.filter((p) => Number(p.severity) === 2).length;
  const moderate = queue.filter((p) => Number(p.severity) === 1).length;
  const stable = queue.filter((p) => Number(p.severity) === 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* Ambient BG */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-all
            ${toast.type === "error" ? "bg-red-600 text-white" : "bg-cyan-500 text-slate-900"}`}
        >
          {toast.type === "error" ? "⚠ " : "✓ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg">
              ⚕
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight tracking-wide">MediCare Hospital</h1>
              <p className="text-slate-500 text-xs">Doctor's Workstation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-xs">Live</span>
            </div>
            <button
              onClick={() => { fetchQueue(); fetchHistory(); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700/50"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon="🏥" label="In Queue" value={queue.length} sub="Awaiting treatment" />
          <StatCard icon="🔴" label="Critical" value={critical} sub="Immediate attention" />
          <StatCard icon="🟡" label="Moderate" value={moderate} sub="Monitor closely" />
          <StatCard icon="📋" label="Reports Filed" value={history.length} sub="All time" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-900/60 p-1 rounded-xl border border-slate-800/50 w-fit">
          {[
            { key: "queue", label: `Patient Queue  ${queue.length > 0 ? `(${queue.length})` : ""}` },
            { key: "history", label: `Medical Records  ${history.length > 0 ? `(${history.length})` : ""}` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${tab === t.key
                  ? "bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Queue Tab */}
        {tab === "queue" && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <svg className="animate-spin h-8 w-8 text-cyan-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-slate-500 text-sm">Loading patient queue…</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <div className="text-5xl">✅</div>
                <h3 className="text-white font-semibold text-lg">Queue Clear</h3>
                <p className="text-slate-500 text-sm">All patients have been attended to.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Sort: critical first */}
                {[...queue]
                  .sort((a, b) => Number(b.severity) - Number(a.severity))
                  .map((p, i) => (
                    <PatientCard
                      key={i}
                      patient={p}
                      report={reports[p.name] || ""}
                      onReportChange={(val) =>
                        setReports((r) => ({ ...r, [p.name]: val }))
                      }
                      onComplete={() => complete(p.name)}
                      completing={!!completing[p.name]}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Completed Patient Records</h2>
              <span className="text-slate-500 text-xs">{history.length} records</span>
            </div>
            {history.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                No records filed yet.
              </div>
            ) : (
              <div className="px-2 py-2">
                {[...history].reverse().map((h, i) => (
                  <HistoryRow key={i} entry={h} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-6 mt-4 border-t border-slate-800/50">
        <p className="text-slate-700 text-xs text-center">
          MediCare Hospital System — Doctor's Portal · Auto-refreshes every 15s
        </p>
      </footer>
    </div>
  );
}