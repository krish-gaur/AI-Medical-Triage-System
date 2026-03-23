"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ─── Three.js DNA / particle background ─── */
function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let animId;
    let THREE;

    const init = async () => {
      THREE = await import("three");

      const W = window.innerWidth;
      const H = window.innerHeight;

      /* Renderer */
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      mountRef.current?.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
      camera.position.set(0, 0, 30);

      /* ── Floating particles ── */
      const ptGeo = new THREE.BufferGeometry();
      const COUNT = 280;
      const pos = new Float32Array(COUNT * 3);
      const vel = [];
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 80;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
        vel.push({
          x: (Math.random() - 0.5) * 0.012,
          y: (Math.random() - 0.5) * 0.012,
          z: (Math.random() - 0.5) * 0.008,
        });
      }
      ptGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const ptMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.18,
        transparent: true,
        opacity: 0.55,
      });
      const points = new THREE.Points(ptGeo, ptMat);
      scene.add(points);

      /* ── DNA double-helix strands ── */
      const strandMat = new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.25 });
      const rungMat   = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.18 });

      const makeDNA = (offsetX = 0) => {
        const TURNS = 6;
        const STEPS = 120;
        const RADIUS = 2.2;
        const HEIGHT = 28;

        const p1 = [], p2 = [];
        for (let i = 0; i <= STEPS; i++) {
          const t = i / STEPS;
          const angle = t * Math.PI * 2 * TURNS;
          const y = (t - 0.5) * HEIGHT;
          p1.push(new THREE.Vector3(offsetX + Math.cos(angle) * RADIUS, y, Math.sin(angle) * RADIUS));
          p2.push(new THREE.Vector3(offsetX + Math.cos(angle + Math.PI) * RADIUS, y, Math.sin(angle + Math.PI) * RADIUS));
        }

        const g1 = new THREE.BufferGeometry().setFromPoints(p1);
        const g2 = new THREE.BufferGeometry().setFromPoints(p2);
        scene.add(new THREE.Line(g1, strandMat));
        scene.add(new THREE.Line(g2, strandMat));

        // rungs every ~8 steps
        for (let i = 0; i < STEPS; i += 8) {
          const rg = new THREE.BufferGeometry().setFromPoints([p1[i], p2[i]]);
          scene.add(new THREE.Line(rg, rungMat));
        }
      };

      makeDNA(-14);
      makeDNA(14);

      /* ── Torus rings (atom / medical cross vibe) ── */
      const torusMat = new THREE.MeshBasicMaterial({ color: 0x0369a1, wireframe: true, transparent: true, opacity: 0.08 });
      [-8, 0, 8].forEach((y, i) => {
        const tGeo = new THREE.TorusGeometry(5 + i * 1.5, 0.06, 8, 60);
        const t = new THREE.Mesh(tGeo, torusMat);
        t.position.set(0, y, -10);
        t.rotation.x = Math.PI / 2 + i * 0.3;
        scene.add(t);
      });

      /* ── Animate ── */
      let clock = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        clock += 0.004;

        // drift particles
        const positions = ptGeo.attributes.position.array;
        for (let i = 0; i < COUNT; i++) {
          positions[i * 3]     += vel[i].x;
          positions[i * 3 + 1] += vel[i].y;
          positions[i * 3 + 2] += vel[i].z;
          if (Math.abs(positions[i * 3])     > 40) vel[i].x *= -1;
          if (Math.abs(positions[i * 3 + 1]) > 30) vel[i].y *= -1;
          if (Math.abs(positions[i * 3 + 2]) > 20) vel[i].z *= -1;
        }
        ptGeo.attributes.position.needsUpdate = true;

        // slow camera drift
        camera.position.x = Math.sin(clock * 0.5) * 2;
        camera.position.y = Math.cos(clock * 0.3) * 1.2;
        camera.lookAt(0, 0, 0);

        // slow scene rotation
        scene.rotation.y = clock * 0.06;

        renderer.render(scene, camera);
      };
      animate();

      /* Resize */
      const onResize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(animId);
        renderer.dispose();
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement);
        }
      };
    };

    const cleanup = init();
    return () => { cleanup.then(fn => fn && fn()); };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ─── Heartbeat SVG icon ─── */
function HeartbeatIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline
        points="0,12 8,12 12,4 16,20 20,12 28,12 32,6 36,18 40,12 48,12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Cross / Plus icon ─── */
function MedCross({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2"  width="6" height="20" rx="2"/>
      <rect x="2" y="9"  width="20" height="6" rx="2"/>
    </svg>
  );
}

/* ─── Role pill ─── */
function RolePill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-5 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-200
        ${active
          ? "bg-sky-500 text-white shadow-lg shadow-sky-500/40"
          : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200"}
      `}
    >
      {label}
    </button>
  );
}

/* ─── Main Login Component ─── */
export default function Home() {
  const [id, setId]           = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [role, setRole]       = useState(null); // "doctor" | "nurse" | null
  const [focused, setFocused] = useState(false);
  const router                = useRouter();

  const login = async () => {
    const trimmed = id.trim();
    if (!trimmed) { setError("Please enter your staff ID."); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: trimmed }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      if (data.role === "doctor") router.push("/doctor");
      else if (data.role === "nurse") router.push("/nurse");
      else setError("Invalid Staff ID. Please try again.");
    } catch (err) {
      if (err.message.startsWith("Server error")) {
        setError("Authentication failed. Check your credentials.");
      } else {
        setError("Cannot reach the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") login(); };

  return (
    <div className="relative min-h-screen bg-[#050d1a] flex flex-col items-center justify-center overflow-hidden">

      {/* Three.js canvas */}
      <ThreeBackground />

      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#050d1a] via-[#071525]/80 to-[#04111f]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050d1a] to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050d1a]/60 to-transparent" />
      </div>

      {/* ── Top bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-4"
        style={{ borderBottom: "1px solid rgba(56,189,248,0.08)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <MedCross className="w-5 h-5 text-sky-400" />
          <span className="text-xs font-semibold tracking-[0.2em] text-sky-300/70 uppercase">
            MediCore AI
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          System online
        </div>
      </header>

      {/* ── Main card ── */}
      <main
        className="relative z-10 w-full max-w-md mx-4"
        style={{ marginTop: "-2rem" }}
      >
        {/* Glow halo behind card */}
        <div
          className="absolute -inset-8 rounded-3xl pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 60%, rgba(14,165,233,0.12) 0%, transparent 70%)",
          }}
        />

        <div
          className="relative rounded-2xl p-8 flex flex-col gap-6"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(56,189,248,0.15)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Card header */}
          <div className="flex flex-col items-center gap-3 pb-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
                boxShadow: "0 8px 24px rgba(14,165,233,0.35)",
              }}
            >
              <MedCross className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                AI Triage System
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Secure staff authentication
              </p>
            </div>
          </div>

          {/* Heartbeat divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <HeartbeatIcon className="w-12 h-6 text-sky-500/50" />
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-3">
              Role
            </label>
            <div className="flex gap-2">
              <RolePill label="Doctor"     active={role === "doctor"} onClick={() => setRole("doctor")} />
              <RolePill label="Nurse"      active={role === "nurse"}  onClick={() => setRole("nurse")}  />
              <RolePill label="Any"        active={role === null}     onClick={() => setRole(null)}      />
            </div>
          </div>

          {/* ID input */}
          <div>
            <label
              htmlFor="staff-id"
              className="block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-2"
            >
              Staff ID
            </label>
            <div className="relative">
              <input
                id="staff-id"
                type="text"
                value={id}
                onChange={(e) => { setId(e.target.value); setError(""); }}
                onKeyDown={handleKey}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="e.g. doctor1 / nurse1"
                autoComplete="off"
                className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${focused ? "rgba(14,165,233,0.6)" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: focused ? "0 0 0 3px rgba(14,165,233,0.12)" : "none",
                }}
              />
              {/* Animated left accent */}
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-300"
                style={{
                  height: focused ? "60%" : "0%",
                  background: "linear-gradient(to bottom, #38bdf8, #0ea5e9)",
                  left: 0,
                  borderRadius: "0 2px 2px 0",
                }}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Login button */}
          <button
            onClick={login}
            disabled={loading}
            className="relative w-full rounded-xl py-3.5 text-sm font-bold tracking-wide text-white transition-all duration-200 overflow-hidden"
            style={{
              background: loading
                ? "rgba(14,165,233,0.4)"
                : "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
              boxShadow: loading ? "none" : "0 8px 24px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                />
                Authenticating…
              </span>
            ) : (
              "Access System"
            )}
          </button>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-600">
            Authorised personnel only · All access is logged
          </p>
        </div>

        {/* Status row */}
        <div className="mt-4 flex justify-center gap-6 text-xs text-slate-600">
          {[
            { dot: "bg-emerald-400", label: "ER Active" },
            { dot: "bg-sky-400",     label: "ICU Online" },
            { dot: "bg-amber-400",   label: "OR Standby" },
          ].map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      </main>

      {/* ── Bottom strip ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 px-8 py-3 flex justify-between text-xs text-slate-700"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span>MediCore AI Triage v2.4</span>
        <span>© 2025 Hospital Systems</span>
      </footer>
    </div>
  );
}