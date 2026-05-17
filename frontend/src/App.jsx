import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

const BACKEND_URL = "https://codecanavs-ai.onrender.com";

const LOADING_STEPS = [
  { icon: "🔌", text: "Waking up the server..." },
  { icon: "🌐", text: "Fetching your website..." },
  { icon: "📸", text: "Taking a screenshot..." },
  { icon: "🎨", text: "Analyzing UI layout & colors..." },
  { icon: "🧠", text: "Scoring UX patterns with AI..." },
  { icon: "📊", text: "Preparing your report..." },
];

export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [backendReady, setBackendReady] = useState(false);
  const loadingIntervalRef = useRef(null);

  // Keep-alive ping
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch(`${BACKEND_URL}/`);
        setBackendReady(true);
      } catch {
        // silent
      }
    };
    ping();
    const interval = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const analyzeWebsite = async () => {
    if (!url) return;
    try {
      setLoading(true);
      setLoadingStep(0);
      setError("");
      setResult(null);

      loadingIntervalRef.current = setInterval(() => {
        setLoadingStep((prev) =>
          prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
        );
      }, 7000);

      const res = await axios.post(`${BACKEND_URL}/analyze/url`, { url });
      setResult(res.data);
      setHistory((prev) => [{ name: url, result: res.data }, ...prev]);
    } catch (err) {
      setError(
        err.code === "ERR_NETWORK"
          ? "Backend is still waking up. Wait 30 seconds and try again."
          : "Failed to analyze. Check the URL and try again."
      );
    } finally {
      clearInterval(loadingIntervalRef.current);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") analyzeWebsite();
  };

  return (
    <div>
      <div className="animated-bg" />
      <div className="background-grid" />

      <div className="content">

        {/* Header */}
        <header className="site-header">
          <div className="logo-badge">
            <span className="logo-dot" />
            CodeCanvas AI
          </div>
          <h1 className="site-title">
            Analyze any website's<br />
            <span>UI &amp; UX instantly</span>
          </h1>
          <p className="site-subtitle">
            Powered by Gemini AI + Playwright screenshots
          </p>
        </header>

        {/* Backend status */}
        <div className="status-bar">
          <div className={`status-pill ${backendReady ? "ready" : "connecting"}`}>
            <span className={`status-pip ${backendReady ? "live" : ""}`} />
            {backendReady ? "Backend ready" : "Connecting to backend..."}
          </div>
        </div>

        {/* URL Input */}
        <div className="search-card">
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="analyze-btn"
            onClick={analyzeWebsite}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze →"}
          </button>
        </div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="loading-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="loader" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={loadingStep}
                  className="loading-step-text"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                >
                  <span className="loading-step-icon">
                    {LOADING_STEPS[loadingStep].icon}
                  </span>
                  {LOADING_STEPS[loadingStep].text}
                </motion.div>
              </AnimatePresence>

              <div className="step-dots">
                {LOADING_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`step-dot ${i <= loadingStep ? "active" : ""}`}
                  />
                ))}
              </div>

              <p className="loading-hint">
                first run may take 30–60s · backend on render free tier
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-msg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              className="result-wrapper"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="result-header">
                <h2 className="result-title">Analysis Report</h2>
                {result.analysis_mode && (
                  <span className="mode-badge">
                    {result.analysis_mode === "fallback"
                      ? "⚡ Heuristic"
                      : "✦ AI Powered"}
                  </span>
                )}
              </div>

              {/* Scores */}
              <div className="score-grid">
                <div className="score-box ui">
                  <div className="score-label">UI Score</div>
                  <div className="score-value">{result.ui_score}</div>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${result.ui_score}%` }}
                    />
                  </div>
                </div>
                <div className="score-box ux">
                  <div className="score-label">UX Score</div>
                  <div className="score-value">{result.ux_score}</div>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${result.ux_score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="summary-block">
                <div className="block-label">Summary</div>
                <p className="summary-text">{result.summary}</p>
              </div>

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div className="suggestions-block">
                  <div className="block-label">Suggestions</div>
                  <ul className="suggestions-list">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="suggestion-item">
                        <span className="suggestion-arrow">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chart */}
              <div className="chart-block">
                <div className="chart-title">Score Breakdown</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "UI Score", value: result.ui_score },
                        { name: "UX Score", value: result.ux_score },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill="#38bdf8" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#111d2e",
                        border: "1px solid rgba(56,189,248,0.2)",
                        borderRadius: "8px",
                        color: "#f0f6ff",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div className="history-section">
            <div className="history-title">Recent Analyses</div>
            {history.map((item, i) => (
              <div key={i} className="history-item">
                <span className="history-url">{item.name}</span>
                <div className="history-scores">
                  <span className="score-chip ui">UI {item.result.ui_score}</span>
                  <span className="score-chip ux">UX {item.result.ux_score}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="site-footer">
          built with ♥ by shreya meshram
        </footer>
      </div>
    </div>
  );
}