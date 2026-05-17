import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "./App.css";

export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);

  const chartData = result
    ? [
        { name: "UI Score", value: result.ui_score },
        { name: "UX Score", value: result.ux_score },
      ]
    : [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    const particles = [];
    const particleCount = 80;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = ["rgba(79, 70, 229", "rgba(34, 197, 94", "rgba(168, 85, 247"][
          Math.floor(Math.random() * 3)
        ];
        this.life = Math.random() * 200 + 100;
        this.maxLife = this.life;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        const alpha = (this.life / this.maxLife) * 0.4;
        ctx.fillStyle = `${this.color}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        p.update();
        p.draw();
        if (p.life <= 0) {
          particles[idx] = new Particle();
        }
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.strokeStyle = `rgba(79, 70, 229, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const analyzeWebsite = async () => {
    if (!url) return;

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await axios.post("https://codecanavs-ai.onrender.com/analyze", {
        url,
      });

      setResult(res.data);

      setHistory((prev) => [
        {
          name: url,
          result: res.data,
        },
        ...prev,
      ]);
    } catch (err) {
      console.log(err);
      setError("Failed to analyze website. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      
      <div className="animated-bg"></div>
      <div className="background-grid"></div>
      <div className="scene">
        <div className="cube cube1"></div>
        <div className="cube cube2"></div>
        <div className="cube cube3"></div>
        <div className="cube cube4"></div>
      </div>
      <div className="bg-particles">
        <div className="particle particle1"></div>
        <div className="particle particle2"></div>
        <div className="particle particle3"></div>
        <div className="particle particle4"></div>
      </div>
      <div className="line-trails">
        <span className="trail trail1"></span>
        <span className="trail trail2"></span>
        <span className="trail trail3"></span>
        <span className="trail trail4"></span>
        <span className="trail trail5"></span>
        <span className="trail trail6"></span>
      </div>
      <canvas id="particle-canvas" className="particle-canvas"></canvas>

      <div className="wave-bg">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      <div className="content">
      <motion.h1 style={styles.title}>
        🚀 CodeCanvas AI
      </motion.h1>

      <p style={styles.subtitle}>UI/UX Analyzer powered by AI</p>

      {/* INPUT */}
      <motion.div style={styles.card}>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter website URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button style={styles.button} onClick={analyzeWebsite}>
          Analyze
        </button>
      </motion.div>

      {/* LOADING */}
      {loading && (
        <div style={styles.loading}>
          <div className="loader"></div>
          <p>Analyzing UI...</p>
        </div>
      )}

      {/* ERROR */}
      {error && <p style={styles.error}>{error}</p>}

      {/* RESULT */}
      {result && (
        <motion.div style={styles.resultCard}>
          <h2>📊 Analysis Result</h2>
          {result.analysis_mode && (
            <p style={styles.modeBadge}>
              {result.analysis_mode === "fallback"
                ? "Fallback heuristic analysis used"
                : "AI analysis used"}
            </p>
          )}

          <div style={styles.grid}>
            <div style={styles.box}>
              <h3>UI Score</h3>
              <p>{result.ui_score}</p>
            </div>

            <div style={styles.box}>
              <h3>UX Score</h3>
              <p>{result.ux_score}</p>
            </div>
          </div>

          <div style={styles.summaryBox}>
            <p style={styles.summary}>
              <b style={styles.summaryLabel}>📝 Summary:</b> {result.summary}
            </p>
          </div>

          <div style={styles.suggestionsBox}>
            <h3 style={styles.suggestionsTitle}>💡 Suggestions</h3>
            <ul style={styles.suggestionsList}>
              {result.suggestions?.map((s, i) => (
                <li key={i} style={styles.suggestionItem}>{s}</li>
              ))}
            </ul>
          </div>

          {/* CHART FIXED */}
          <div style={styles.chartBox}>
            <h3>Score Graph</h3>

            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  outerRadius={90}
                  label
                >
                  <Cell fill="#4f46e5" />
                  <Cell fill="#22c55e" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div style={styles.history}>
          <h2>History</h2>

          {history.map((item, i) => (
            <div key={i} style={styles.historyCard}>
              <b>{item.name}</b>
              <p>
                UI: {item.result.ui_score} | UX: {item.result.ux_score}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div style={styles.footer}>
        Built with ❤️ by Shreya Meshram
      </div>
    </div>
  </div>
);
}

/* ================= STYLES ================= */
const styles = {
  container: {
    fontFamily: "Arial",
    padding: "20px",
    textAlign: "center",
    minHeight: "100vh",
    color: "white",
    background: "transparent",
    position: "relative",
    overflow: "hidden",
  },

  title: {
    fontSize: "34px",
    fontWeight: "bold",
    fontFamily: "'Courier New', monospace",
    textShadow: "0 0 10px rgba(56, 189, 248, 0.5)",
  },

  subtitle: {
    color: "#94a3b8",
    marginBottom: "20px",
  },

  card: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    margin: "0 auto 20px auto",
    padding: "15px",
    background: "#1e293b",
    borderRadius: "12px",
    maxWidth: "600px",
  },

  input: {
    flex: 1,
    minWidth: "220px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    outline: "none",
  },

  button: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#38bdf8",
    fontWeight: "bold",
  },

  modeBadge: {
    marginTop: "12px",
    marginBottom: "14px",
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "9999px",
    background: "rgba(56, 189, 248, 0.18)",
    color: "#38bdf8",
    fontWeight: "600",
    fontSize: "14px",
  },

  loading: {
    marginTop: "20px",
  },

  error: {
    color: "#ef4444",
  },

  resultCard: {
    marginTop: "30px",
    padding: "20px",
    background: "#1e293b",
    borderRadius: "12px",
    maxWidth: "700px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "15px",
  },

  box: {
    background: "#334155",
    padding: "15px",
    borderRadius: "10px",
  },

  summaryBox: {
    marginTop: "20px",
    marginBottom: "20px",
    padding: "16px",
    background: "rgba(30, 41, 59, 0.7)",
    borderLeft: "4px solid #38bdf8",
    borderRadius: "8px",
    maxWidth: "680px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  summary: {
    margin: "0",
    lineHeight: "1.6",
    fontSize: "15px",
    color: "#cbd5e1",
    textAlign: "left",
  },

  summaryLabel: {
    color: "#38bdf8",
    marginRight: "8px",
    fontWeight: "700",
  },

  suggestionsBox: {
    marginTop: "20px",
    marginBottom: "20px",
    padding: "16px",
    background: "rgba(30, 41, 59, 0.7)",
    borderLeft: "4px solid #22c55e",
    borderRadius: "8px",
    maxWidth: "680px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  suggestionsTitle: {
    margin: "0 0 14px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#22c55e",
    textAlign: "left",
  },

  suggestionsList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
    textAlign: "left",
  },

  suggestionItem: {
    padding: "10px 0",
    paddingLeft: "24px",
    position: "relative",
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: "1.5",
    borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
  },

  chartBox: {
    marginTop: "20px",
  },

  history: {
    marginTop: "30px",
  },

  historyCard: {
    background: "#0f172a",
    border: "1px solid #334155",
    padding: "12px",
    borderRadius: "10px",
    maxWidth: "600px",
    margin: "10px auto",
    textAlign: "left",
  },

  footer: {
    marginTop: "40px",
    padding: "15px",
    fontSize: "14px",
    color: "#94a3b8",
    borderTop: "1px solid #334155",
  },
};