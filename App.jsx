import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { Calendar, Hourglass, RefreshCcw, Play } from "lucide-react";

// -----------------------------
// Helpers
// -----------------------------
const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

function msToDHMS(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function pad2(n) {
  return n.toString().padStart(2, "0");
}

const QUOTES = [
  "Small steps, every second.",
  "Your future self is watching.",
  "Momentum loves consistency.",
  "Done is better than perfect.",
  "Focus on the next minute.",
  "Tiny progress beats no progress.",
  "Show up for your goal.",
  "Make time your ally.",
  "Every tick is a chance.",
  "You’ve got this—keep going."
];

// -----------------------------
// Progress Visuals
// -----------------------------
function CircularProgress({ percent }) {
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative w-[240px] h-[240px] grid place-items-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
          {Math.round(percent)}%
        </div>
        <div className="text-xs text-white/70">time elapsed</div>
      </div>
    </div>
  );
}

function GradientBar({ percent }) {
  return (
    <div className="w-full h-5 rounded-2xl bg-white/10 overflow-hidden shadow-inner">
      <motion.div
        className="h-full w-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(96,165,250,1) 0%, rgba(167,139,250,1) 100%)",
        }}
        animate={{ width: `${clamp(percent, 0, 100)}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

// -----------------------------
// Time Blocks
// -----------------------------
function TimeBlock({ value, label }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center min-w-[90px]">
      <motion.div
        key={value}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="text-4xl md:text-5xl font-black tracking-tight text-white"
      >
        {value}
      </motion.div>
      <div className="text-xs uppercase tracking-wide text-white/70">{label}</div>
    </div>
  );
}

// -----------------------------
// Main App
// -----------------------------
export default function DeadlineTrackerApp() {
  const [goal, setGoal] = useState("");
  const [deadlineInput, setDeadlineInput] = useState(""); // datetime-local string
  const [startTime, setStartTime] = useState(null); // number (ms)
  const [deadline, setDeadline] = useState(null); // number (ms)
  const [now, setNow] = useState(Date.now());
  const [mode, setMode] = useState("circular"); // 'circular' | 'bar'
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const tracking = startTime !== null && deadline !== null;

  // Load/Persist state
  useEffect(() => {
    const raw = localStorage.getItem("deadline-tracker-state");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.goal) setGoal(s.goal);
        if (s.deadline) setDeadline(s.deadline);
        if (s.startTime) setStartTime(s.startTime);
        if (s.mode) setMode(s.mode);
        if (typeof s.quoteIndex === "number") setQuoteIndex(s.quoteIndex);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const s = { goal, deadline, startTime, mode, quoteIndex };
    localStorage.setItem("deadline-tracker-state", JSON.stringify(s));
  }, [goal, deadline, startTime, mode, quoteIndex]);

  // Ticker
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Derived times
  const { totalMs, elapsedMs, remainingMs, percent } = useMemo(() => {
    if (!tracking) return { totalMs: 0, elapsedMs: 0, remainingMs: 0, percent: 0 };
    const t = Math.max(1, deadline - startTime);
    const e = clamp(now - startTime, 0, t);
    const r = Math.max(0, deadline - now);
    const p = clamp((e / t) * 100, 0, 100);
    return { totalMs: t, elapsedMs: e, remainingMs: r, percent: p };
  }, [tracking, deadline, startTime, now]);

  const { days, hours, minutes, seconds } = msToDHMS(remainingMs);

  // Handlers
  function handleStart(e) {
    e?.preventDefault?.();
    const d = dayjs(deadlineInput).valueOf();
    if (!goal.trim()) {
      alert("Please enter a goal name.");
      return;
    }
    if (!deadlineInput || Number.isNaN(d)) {
      alert("Please set a valid deadline date & time.");
      return;
    }
    if (d <= Date.now()) {
      alert("Deadline must be in the future.");
      return;
    }
    setStartTime(Date.now());
    setDeadline(d);
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
  }

  function handleReset() {
    setStartTime(null);
    setDeadline(null);
    setDeadlineInput("");
  }

  // UI
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-sky-950 to-indigo-950 text-white selection:bg-indigo-400/30">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Deadline Tracker</h1>
            <p className="text-white/70 text-sm">Stay on track with a clear countdown & progress.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/60">
            <Calendar className="w-5 h-5" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        {/* Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card: Input Form */}
          <motion.div
            layout
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl"
          >
            <h2 className="font-bold mb-4 flex items-center gap-2"><Hourglass className="w-4 h-4"/> Set Your Goal</h2>
            <form onSubmit={handleStart} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-white/70">Goal Name</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Launch my portfolio website"
                  className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400/50 placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-white/70">Deadline (Date & Time)</label>
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0,16)}
                  className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-3 bg-gradient-to-r from-blue-500 to-violet-500 font-semibold shadow-lg active:scale-[0.98]"
                >
                  <Play className="w-4 h-4"/> Start Tracking
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-3 bg-white/10 border border-white/10 hover:bg-white/15"
                >
                  <RefreshCcw className="w-4 h-4"/> Reset
                </button>
              </div>
            </form>

            {/* Mode toggle */}
            <div className="mt-6">
              <label className="text-xs uppercase tracking-wide text-white/70">Progress Style</label>
              <div className="mt-2 inline-flex rounded-xl overflow-hidden border border-white/10 bg-white/10">
                <button
                  onClick={() => setMode("circular")}
                  className={`px-4 py-2 text-sm ${mode === "circular" ? "bg-white/20" : "bg-transparent"}`}
                >
                  Circular
                </button>
                <button
                  onClick={() => setMode("bar")}
                  className={`px-4 py-2 text-sm ${mode === "bar" ? "bg-white/20" : "bg-transparent"}`}
                >
                  Gradient Bar
                </button>
              </div>
            </div>
          </motion.div>

          {/* Card: Dashboard */}
          <motion.div
            layout
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Progress Dashboard</h2>
              <div className="text-xs text-white/60">{tracking ? "Live" : "Idle"}</div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <AnimatePresence mode="wait">
                {mode === "circular" ? (
                  <motion.div key="circular" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                    <CircularProgress percent={percent} />
                  </motion.div>
                ) : (
                  <motion.div key="bar" className="w-full" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                    <GradientBar percent={percent} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-center">
                <div className="text-sm uppercase tracking-wide text-white/60">Goal</div>
                <div className="text-lg font-semibold">{goal || "—"}</div>
              </div>

              {/* Countdown */}
              <div className="grid grid-cols-4 gap-3 w-full place-items-center">
                <TimeBlock value={String(days)} label="Days" />
                <TimeBlock value={pad2(hours)} label="Hours" />
                <TimeBlock value={pad2(minutes)} label="Minutes" />
                <TimeBlock value={pad2(seconds)} label="Seconds" />
              </div>

              {/* Meta */}
              <div className="w-full text-center text-sm text-white/70">
                {tracking ? (
                  remainingMs === 0 ? (
                    <span>Time’s up! You reached your deadline.</span>
                  ) : (
                    <span>
                      {Math.round(percent)}% elapsed • Deadline: {new Date(deadline).toLocaleString()}
                    </span>
                  )
                ) : (
                  <span>Set a goal and deadline to begin tracking.</span>
                )}
              </div>

              {/* Quote */}
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-2 text-center text-sm text-white/80"
              >
                “{QUOTES[quoteIndex]}”
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Footer tips */}
        <div className="mt-8 text-center text-xs text-white/50">
          Pro tip: keep this tab open—your countdown updates every second.
        </div>
      </div>
    </div>
  );
}
