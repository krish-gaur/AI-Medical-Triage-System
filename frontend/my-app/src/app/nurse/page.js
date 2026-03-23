"use client"
import { useState, useEffect, useCallback } from "react";

const SEVERITY_CONFIG = {
  2: {
    label: "Critical",
    bg: "bg-red-950/80",
    border: "border-red-500",
    badge: "bg-red-500 text-white",
    dot: "bg-red-400 animate-pulse",
    text: "text-red-300",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.35)]",
    icon: "⚠",
  },
  1: {
    label: "Moderate",
    bg: "bg-amber-950/70",
    border: "border-amber-500",
    badge: "bg-amber-500 text-white",
    dot: "bg-amber-400",
    text: "text-amber-300",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    icon: "◈",
  },
  0: {
    label: "Stable",
    bg: "bg-emerald-950/60",
    border: "border-emerald-600",
    badge: "bg-emerald-600 text-white",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    glow: "shadow-[0_0_8px_rgba(52,211,153,0.15)]",
    icon: "✓",
  },
};

function PatientCard({ patient, index }) {
  const sev = Math.min(Math.max(Number(patient.severity), 0), 2);
  const cfg = SEVERITY_CONFIG[sev];

  return (
    <div
      className={`
        relative rounded-xl border ${cfg.border} ${cfg.bg} ${cfg.glow}
        p-4 transition-all duration-300 hover:scale-[1.01] hover:brightness-110
        backdrop-blur-sm animate-fadeIn
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Position badge */}
      <span className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-slate-700 border border-slate-500 text-slate-300 text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <h3 className="text-white font-semibold text-base truncate tracking-wide">
            {patient.name}
          </h3>
        </div>
        <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
          <span>{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>

      {/* Action */}
      {patient.action && (
        <p className={`text-sm font-medium mb-3 ${cfg.text}`}>
          {patient.action}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-white/10 pt-2.5 mt-1">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Wait: <span className="text-slate-200 font-medium">{patient.wait_time ?? "—"}</span>
        </span>
        {patient.age && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Age: <span className="text-slate-200 font-medium">{patient.age}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function FormField({ label, icon, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <span>{icon}</span> {label}
      </label>
      <input
        {...props}
        className={`
          w-full bg-slate-800/70 border rounded-lg px-3.5 py-2.5 text-sm text-white
          placeholder-slate-500 outline-none transition-all duration-200
          focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500
          ${error ? "border-red-500 ring-1 ring-red-500/40" : "border-slate-600 hover:border-slate-500"}
        `}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

export default function NurseDashboard() {
  const [queue, setQueue] = useState([]);
  const [form, setForm] = useState({ name: "", symptoms: "", duration: "", age: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchQueue = useCallback(async () => {
    try {
      const r = await fetch("http://127.0.0.1:8000/queue");
      if (!r.ok) throw new Error("Failed to fetch");
      setQueue(await r.json());
      setLastUpdated(new Date());
    } catch {
      showToast("Could not reach server", "error");
    } finally {
      setFetching(false);
    }
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Patient name is required";
    const symptoms = form.symptoms.split(",").map(s => s.trim()).filter(Boolean);
    if (symptoms.length < 3) e.symptoms = "Enter at least 3 symptoms, comma-separated";
    if (!form.duration || isNaN(Number(form.duration)) || Number(form.duration) < 0)
      e.duration = "Enter a valid duration in hours";
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 0 || Number(form.age) > 130)
      e.age = "Enter a valid age (0–130)";
    return e;
  };

  const handleAdd = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/add_patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          symptoms: form.symptoms.split(",").map(s => s.trim()).filter(Boolean),
          duration: Number(form.duration),
          age: Number(form.age),
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setForm({ name: "", symptoms: "", duration: "", age: "" });
      setErrors({});
      await fetchQueue();
      showToast(`${form.name.trim()} added to queue`);
    } catch {
      showToast("Failed to add patient", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const counts = { critical: 0, moderate: 0, stable: 0 };
  queue.forEach(p => {
    const s = Number(p.severity);
    if (s === 2) counts.critical++;
    else if (s === 1) counts.moderate++;
    else counts.stable++;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans"
         style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
           style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl border animate-fadeIn
          ${toast.type === "error"
            ? "bg-red-950 border-red-500 text-red-200"
            : "bg-emerald-950 border-emerald-500 text-emerald-200"}`}>
          {toast.type === "error" ? "✕ " : "✓ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Nurse Station</h1>
              <p className="text-xs text-slate-500">Patient Triage Queue</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Connecting..."}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Critical", value: counts.critical, color: "text-red-400", border: "border-red-900", bg: "bg-red-950/40" },
            { label: "Moderate", value: counts.moderate, color: "text-amber-400", border: "border-amber-900", bg: "bg-amber-950/40" },
            { label: "Stable",   value: counts.stable,   color: "text-emerald-400", border: "border-emerald-900", bg: "bg-emerald-950/40" },
          ].map(({ label, value, color, border, bg }) => (
            <div key={label} className={`rounded-xl ${bg} border ${border} px-4 py-3 flex items-center justify-between`}>
              <span className="text-slate-400 text-sm">{label}</span>
              <span className={`text-2xl font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Add Patient Form */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 backdrop-blur p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Register Patient
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <FormField
              label="Full Name" icon="👤"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />
            <FormField
              label="Age" icon="🎂" type="number" min="0" max="130"
              placeholder="e.g. 45"
              value={form.age}
              onChange={e => setForm({ ...form, age: e.target.value })}
              error={errors.age}
            />
            <FormField
              label="Symptoms (comma-separated)" icon="🩺"
              placeholder="e.g. fever, cough, headache"
              value={form.symptoms}
              onChange={e => setForm({ ...form, symptoms: e.target.value })}
              error={errors.symptoms}
            />
            <FormField
              label="Duration (hours)" icon="⏱" type="number" min="0"
              placeholder="e.g. 24"
              value={form.duration}
              onChange={e => setForm({ ...form, duration: e.target.value })}
              error={errors.duration}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg shadow-cyan-900/40"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Adding...
              </>
            ) : (
              <>+ Add to Queue</>
            )}
          </button>
        </section>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          {Object.entries(SEVERITY_CONFIG).reverse().map(([sev, cfg]) => (
            <span key={sev} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Queue */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Waiting Queue
            </h2>
            <span className="text-xs text-slate-500">{queue.length} patient{queue.length !== 1 ? "s" : ""}</span>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-16 text-slate-500 gap-3">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-2">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No patients in queue</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.map((patient, i) => (
                <PatientCard key={patient.id ?? i} patient={patient} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>

      
    </div>
  );
}