import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
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

/* ── THREE.JS 3D BACKGROUND ── */
function useThreeBackground(canvasId) {
  useEffect(() => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 28;

    // Colors
    const BLUE   = new THREE.Color(0x38bdf8);
    const GREEN  = new THREE.Color(0x22c55e);
    const PURPLE = new THREE.Color(0xa78bfa);
    const PINK   = new THREE.Color(0xf472b6);
    const colors = [BLUE, GREEN, PURPLE, PINK];

    const meshes = [];

    // ── Wireframe floating shapes ──
    const shapeDefs = [
      { geo: new THREE.IcosahedronGeometry(2.2, 1),   pos: [-10,  5, -8],  color: BLUE,   speed: 0.003 },
      { geo: new THREE.OctahedronGeometry(1.8, 0),    pos: [10,  -4, -6],  color: GREEN,  speed: 0.004 },
      { geo: new THREE.TorusGeometry(2, 0.6, 8, 20),  pos: [-7,  -7, -10], color: PURPLE, speed: 0.005 },
      { geo: new THREE.IcosahedronGeometry(1.4, 1),   pos: [12,   7, -12], color: PINK,   speed: 0.003 },
      { geo: new THREE.OctahedronGeometry(1.2, 0),    pos: [0,   -9, -6],  color: BLUE,   speed: 0.006 },
      { geo: new THREE.TorusKnotGeometry(1.2, 0.35, 64, 8), pos: [-12, 2, -14], color: GREEN, speed: 0.004 },
      { geo: new THREE.IcosahedronGeometry(0.9, 1),   pos: [6,   10, -8],  color: PURPLE, speed: 0.005 },
      { geo: new THREE.OctahedronGeometry(2.4, 0),    pos: [-4,   8, -16], color: PINK,   speed: 0.002 },
      { geo: new THREE.TorusGeometry(1.4, 0.4, 8, 16), pos: [14, -8, -14], color: BLUE,   speed: 0.006 },
      { geo: new THREE.IcosahedronGeometry(1.6, 1),   pos: [-14, -5, -18], color: GREEN,  speed: 0.003 },
    ];

    shapeDefs.forEach(({ geo, pos, color, speed }) => {
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.userData = {
        speed,
        floatAmp:  1.2 + Math.random() * 0.8,
        floatFreq: 0.3 + Math.random() * 0.4,
        floatOff:  Math.random() * Math.PI * 2,
        initY:     pos[1],
        rotAxis:   new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
      };
      scene.add(mesh);
      meshes.push(mesh);
    });

    // ── Floating particles ──
    const particleCount = 160;
    const positions = new Float32Array(particleCount * 3);
    const pColors   = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10;
      const c = colors[Math.floor(Math.random() * colors.length)];
      pColors[i * 3]     = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color",    new THREE.BufferAttribute(pColors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // ── Mouse parallax ──
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Resize ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Animate ──
    let frame;
    const clock = new THREE.Clock();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      meshes.forEach((m) => {
        const { speed, floatAmp, floatFreq, floatOff, initY, rotAxis } = m.userData;
        m.rotateOnAxis(rotAxis, speed);
        m.position.y = initY + Math.sin(t * floatFreq + floatOff) * floatAmp;
      });

      // Slow particle drift
      points.rotation.y = t * 0.012;
      points.rotation.x = t * 0.006;

      // Camera parallax
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 1.0 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [canvasId]);
}

/* ── MAIN COMPONENT ── */
export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [backendReady, setBackendReady] = useState(false);
  const loadingIntervalRef = useRef(null);

  useThreeBackground("three-bg");

  // Keep-alive ping
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch(`${BACKEND_URL}/`);
        setBackendReady(true);
      } catch { /* silent */ }
    };
    ping();
    const iv = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const analyzeWebsite = async () => {
    if (!url) return;
    try {
      setLoading(true);
      setLoadingStep(0);
      setError("");
      setResult(null);

      loadingIntervalRef.current = setInterval(() => {
        setLoadingStep((p) => (p < LOADING_STEPS.length - 1 ? p + 1 : p));
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

  return (
    <div>
      {/* Three.js canvas */}
      <canvas id="three-bg" />
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

        {/* Status */}
        <div className="status-bar">
          <div className={`status-pill ${backendReady ? "ready" : "connecting"}`}>
            <span className={`status-pip ${backendReady ? "live" : ""}`} />
            {backendReady ? "Backend ready" : "Connecting to backend..."}
          </div>
        </div>

        {/* Input */}
        <div className="search-card">
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeWebsite()}
            disabled={loading}
          />
          <button className="analyze-btn" onClick={analyzeWebsite} disabled={loading}>
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
                  <span className="loading-step-icon">{LOADING_STEPS[loadingStep].icon}</span>
                  {LOADING_STEPS[loadingStep].text}
                </motion.div>
              </AnimatePresence>
              <div className="step-dots">
                {LOADING_STEPS.map((_, i) => (
                  <div key={i} className={`step-dot ${i <= loadingStep ? "active" : ""}`} />
                ))}
              </div>
              <p className="loading-hint">first run may take 30–60s · backend on render free tier</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div className="error-msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                    {result.analysis_mode === "fallback" ? "⚡ Heuristic" : "✦ AI Powered"}
                  </span>
                )}
              </div>

              <div className="score-grid">
                <div className="score-box ui">
                  <div className="score-label">UI Score</div>
                  <div className="score-value">{result.ui_score}</div>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${result.ui_score}%` }} />
                  </div>
                </div>
                <div className="score-box ux">
                  <div className="score-label">UX Score</div>
                  <div className="score-value">{result.ux_score}</div>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${result.ux_score}%` }} />
                  </div>
                </div>
              </div>

              <div className="summary-block">
                <div className="block-label">Summary</div>
                <p className="summary-text">{result.summary}</p>
              </div>

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
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
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

        <footer className="site-footer">built with ♥ by shreya meshram</footer>
      </div>
    </div>
  );
}