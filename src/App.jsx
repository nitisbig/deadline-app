import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { Calendar, Hourglass, RefreshCcw, Play } from "lucide-react";
import { Analytics } from '@vercel/analytics/react';

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
          stroke="rgba(0,0,0,0.1)"
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
        <div className="text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
          {Math.round(percent)}%
        </div>
        <div className="text-xs text-gray-600">time elapsed</div>
      </div>
    </div>
  );
}

function GradientBar({ percent }) {
  return (
    <div className="w-full h-5 rounded-2xl bg-gray-200 overflow-hidden shadow-inner">
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
    <div className="px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 text-center min-w-[90px]">
      <motion.div
        key={value}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="text-4xl md:text-5xl font-black tracking-tight text-gray-900"
      >
        {value}
      </motion.div>
      <div className="text-xs uppercase tracking-wide text-gray-600">{label}</div>
    </div>
  );
}

// -----------------------------
// Tracker Card
// -----------------------------
function TrackerCard({ tracker, now, mode, onDelete }) {
  const { goal, startTime, deadline, quoteIndex, id } = tracker;
  const totalMs = Math.max(1, deadline - startTime);
  const elapsedMs = clamp(now - startTime, 0, totalMs);
  const remainingMs = Math.max(0, deadline - now);
  const percent = clamp((elapsedMs / totalMs) * 100, 0, 100);
  const { days, hours, minutes, seconds } = msToDHMS(remainingMs);

  return (
    <motion.div
      layout
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold">{goal}</h2>
        <button onClick={() => onDelete(id)} className="text-xs text-gray-500">
          Remove
        </button>
      </div>

      <div className="flex flex-col items-center gap-6">
        <AnimatePresence mode="wait">
          {mode === "circular" ? (
            <motion.div
              key="circular"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <CircularProgress percent={percent} />
            </motion.div>
          ) : (
            <motion.div
              key="bar"
              className="w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <GradientBar percent={percent} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-4 gap-3 w-full place-items-center">
          <TimeBlock value={String(days)} label="Days" />
          <TimeBlock value={pad2(hours)} label="Hours" />
          <TimeBlock value={pad2(minutes)} label="Minutes" />
          <TimeBlock value={pad2(seconds)} label="Seconds" />
        </div>

        <div className="w-full text-center text-sm text-gray-600">
          {remainingMs === 0 ? (
            <span>Time’s up! You reached your deadline.</span>
          ) : (
            <span>
              {Math.round(percent)}% elapsed • Deadline: {new Date(deadline).toLocaleString()}
            </span>
          )}
        </div>

        <motion.div
          key={quoteIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-2 text-center text-sm text-gray-700"
        >
          “{QUOTES[quoteIndex]}”
        </motion.div>
      </div>
    </motion.div>
  );
}

// -----------------------------
// Main App
// -----------------------------
export default function DeadlineTrackerApp() {
  const [goalInput, setGoalInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState(""); // datetime-local string
  const [trackers, setTrackers] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [mode, setMode] = useState("circular"); // 'circular' | 'bar'

  // Load/Persist state
  useEffect(() => {
    const raw = localStorage.getItem("deadline-tracker-state");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (Array.isArray(s.trackers)) setTrackers(s.trackers);
        if (s.mode) setMode(s.mode);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const s = { trackers, mode };
    localStorage.setItem("deadline-tracker-state", JSON.stringify(s));
  }, [trackers, mode]);

  // Ticker
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Handlers
  function handleAddTracker(e) {
    e?.preventDefault?.();
    const d = dayjs(deadlineInput).valueOf();
    if (!goalInput.trim()) {
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
    const newTracker = {
      id: Date.now(),
      goal: goalInput.trim(),
      startTime: Date.now(),
      deadline: d,
      quoteIndex: Math.floor(Math.random() * QUOTES.length),
    };
    setTrackers((t) => [...t, newTracker]);
    setGoalInput("");
    setDeadlineInput("");
  }

  function handleReset() {
    setTrackers([]);
    setGoalInput("");
    setDeadlineInput("");
  }

  function handleRemove(id) {
    setTrackers((t) => t.filter((tr) => tr.id !== id));
  }

  // UI
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 text-gray-900 selection:bg-indigo-300/30">
      <Analytics />
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Deadline Tracker</h1>
            <p className="text-gray-600 text-sm">Stay on track with a clear countdown & progress.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-gray-500">
            <Calendar className="w-5 h-5" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        {/* Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card: Input Form */}
          <motion.div
            layout
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
          >
            <h2 className="font-bold mb-4 flex items-center gap-2"><Hourglass className="w-4 h-4"/> Set Your Goal</h2>
            <form onSubmit={handleAddTracker} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-600">Goal Name</label>
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g., Launch my portfolio website"
                  className="w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-600">Deadline (Date & Time)</label>
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0,16)}
                  className="w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
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
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-3 bg-gray-100 border border-gray-300 hover:bg-gray-200"
                >
                  <RefreshCcw className="w-4 h-4"/> Reset
                </button>
              </div>
            </form>

            {/* Mode toggle */}
            <div className="mt-6">
              <label className="text-xs uppercase tracking-wide text-gray-600">Progress Style</label>
              <div className="mt-2 inline-flex rounded-xl overflow-hidden border border-gray-300 bg-gray-100">
                <button
                  onClick={() => setMode("circular")}
                  className={`px-4 py-2 text-sm ${mode === "circular" ? "bg-white" : "bg-transparent"}`}
                >
                  Circular
                </button>
                <button
                  onClick={() => setMode("bar")}
                  className={`px-4 py-2 text-sm ${mode === "bar" ? "bg-white" : "bg-transparent"}`}
                >
                  Gradient Bar
                </button>
              </div>
            </div>
          </motion.div>

          {/* Card(s): Dashboards */}
          <div className="space-y-6">
            {trackers.length === 0 ? (
              <motion.div
                layout
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl text-center text-sm text-gray-600"
              >
                No trackers yet.
              </motion.div>
            ) : (
              trackers.map((t) => (
                <TrackerCard
                  key={t.id}
                  tracker={t}
                  now={now}
                  mode={mode}
                  onDelete={handleRemove}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer tips */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Pro tip: keep this tab open—your countdown updates every second.
        </div>
      </div>
    </div>
  );
}
