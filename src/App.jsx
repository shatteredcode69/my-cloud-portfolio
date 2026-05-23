import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

// ── Starfield Canvas ──────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.004,
      speed: Math.random() * 0.08 + 0.01,
    }));

    const nodes = Array.from({ length: 10 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // nebula glow patches
      [[canvas.width * 0.15, canvas.height * 0.3, 320, "#0a0f3a"], [canvas.width * 0.75, canvas.height * 0.6, 260, "#0d0a2f"], [canvas.width * 0.5, canvas.height * 0.15, 200, "#050b25"]].forEach(([cx, cy, r, col]) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, col + "cc");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // twinkling stars
      stars.forEach(s => {
        s.a += s.da;
        if (s.a > 1 || s.a < 0) s.da *= -1;
        s.y += s.speed;
        if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,200,255,${s.a * 0.85})`;
        ctx.fill();
      });

      // floating data nodes
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(100,140,255,${(1 - dist / 140) * 0.18})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        });
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(100,160,255,0.55)";
        ctx.fill();
      });

      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ── Typing Effect ─────────────────────────────────────────────────────────────
function TypeWriter({ texts }) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    const full = texts[idx % texts.length];
    let timeout;
    if (typing) {
      if (display.length < full.length) {
        timeout = setTimeout(() => setDisplay(full.slice(0, display.length + 1)), 65);
      } else {
        timeout = setTimeout(() => setTyping(false), 2200);
      }
    } else {
      if (display.length > 0) {
        timeout = setTimeout(() => setDisplay(display.slice(0, -1)), 38);
      } else {
        setIdx(i => i + 1); setTyping(true);
      }
    }
    return () => clearTimeout(timeout);
  }, [display, typing, idx, texts]);
  return (
    <span style={{ color: "#7eb8ff", fontFamily: "'Space Mono', monospace", fontSize: "clamp(14px,2.2vw,22px)", letterSpacing: "0.04em" }}>
      {display}<span style={{ animation: "blink 1s step-end infinite", color: "#a78bfa" }}>|</span>
    </span>
  );
}

// ── Orbit Section ─────────────────────────────────────────────────────────────
const ORBIT_SKILLS = [
  { label: "AWS", icon: "☁️", color: "#ff9900", r: 130, speed: 18, size: 52 },
  { label: "Docker", icon: "🐳", color: "#2496ed", r: 190, speed: 26, size: 48 },
  { label: "K8s", icon: "⚙️", color: "#326ce5", r: 240, speed: 34, size: 44 },
  { label: "Terraform", icon: "🏗️", color: "#7b42bc", r: 130, speed: -22, size: 48 },
  { label: "GitHub Actions", icon: "🔄", color: "#f0f6fc", r: 190, speed: -30, size: 42 },
  { label: "Prometheus", icon: "🔥", color: "#e6522c", r: 240, speed: -38, size: 44 },
  { label: "Grafana", icon: "📊", color: "#f46800", r: 300, speed: 42, size: 42 },
  { label: "Linux", icon: "🐧", color: "#fcc624", r: 300, speed: -48, size: 44 },
  { label: "Python", icon: "🐍", color: "#3776ab", r: 350, speed: 55, size: 40 },
  { label: "Nginx", icon: "⚡", color: "#009900", r: 350, speed: -60, size: 40 },
];

function OrbitRing({ radius, duration }) {
  return (
    <div style={{ position: "absolute", width: radius * 2, height: radius * 2, borderRadius: "50%", border: "1px dashed rgba(100,140,255,0.15)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
  );
}

function OrbitIcon({ skill, index }) {
  const [angle, setAngle] = useState((index / ORBIT_SKILLS.length) * 360);
  const rafRef = useRef();
  const lastRef = useRef(null);

  useEffect(() => {
    const step = (ts) => {
      if (lastRef.current === null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setAngle(a => a + (360 / Math.abs(skill.speed)) * dt * Math.sign(skill.speed));
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [skill.speed]);

  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * skill.r;
  const y = Math.sin(rad) * skill.r;

  return (
    <motion.div
      whileHover={{ scale: 1.25 }}
      style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        width: skill.size, height: skill.size,
        background: "rgba(10,15,40,0.85)",
        border: `1.5px solid ${skill.color}44`,
        borderRadius: "50%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: "default", backdropFilter: "blur(8px)",
        boxShadow: `0 0 16px ${skill.color}33`,
      }}
    >
      <span style={{ fontSize: skill.size * 0.38 }}>{skill.icon}</span>
      <span style={{ fontSize: 7, color: skill.color, fontFamily: "'Space Mono',monospace", marginTop: 1, opacity: 0.9 }}>{skill.label}</span>
    </motion.div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    title: "Zero-Downtime Blue-Green Pipeline",
    tags: ["Docker", "Nginx", "GitHub Actions", "CI/CD"],
    desc: "Blue-Green deployment system with instant traffic switching, one-command rollback under 30 seconds, and fully automated CI/CD on every merge.",
    accent: "#3b82f6",
    icon: "🔵",
    date: "Feb 2026",
  },
  {
    title: "AWS Serverless Event-Driven Notifications",
    tags: ["Lambda", "SNS", "SQS", "S3", "IAM"],
    desc: "Serverless event pipeline with sub-second fan-out latency, near-zero idle cost, and least-privilege IAM security across all inter-service communication.",
    accent: "#a78bfa",
    icon: "⚡",
    date: "Mar 2026",
  },
  {
    title: "Infrastructure as Code — Cloud Deployment",
    tags: ["Terraform", "AWS", "EC2", "Docker"],
    desc: "Reproducible AWS infrastructure via Terraform modules — 85% faster provisioning, zero environment drift, fully automated image builds and registry pushes.",
    accent: "#34d399",
    icon: "🏗️",
    date: "Feb 2026",
  },
  {
    title: "Distributed Observability & Monitoring Stack",
    tags: ["Prometheus", "Grafana", "Docker Compose"],
    desc: "Containerized microservices with real-time Grafana dashboards, automated anomaly alerting, and deep visibility across CPU, memory, and request-rate signals.",
    accent: "#fb923c",
    icon: "📡",
    date: "Jan 2026",
  },
];

function ProjectCard({ project, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -10, boxShadow: `0 0 40px ${project.accent}44, 0 0 80px ${project.accent}22` }}
      style={{
        background: "rgba(8,12,35,0.72)",
        border: `1px solid ${project.accent}33`,
        borderRadius: 18,
        padding: "28px 28px 24px",
        backdropFilter: "blur(18px)",
        cursor: "default",
        transition: "border-color 0.3s",
        position: "relative",
        overflow: "hidden",
      }}
      onHoverStart={e => e.target.style && (e.target.style.borderColor = project.accent + "88")}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)`, opacity: 0.7 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 26 }}>{project.icon}</span>
        <div>
          <div style={{ color: "#e2e8f0", fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{project.title}</div>
          <div style={{ color: "#64748b", fontFamily: "'Space Mono',monospace", fontSize: 10, marginTop: 2 }}>{project.date}</div>
        </div>
      </div>
      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, marginBottom: 18, fontFamily: "'DM Sans', sans-serif" }}>{project.desc}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {project.tags.map(t => (
          <span key={t} style={{ padding: "3px 10px", background: project.accent + "18", border: `1px solid ${project.accent}44`, borderRadius: 99, color: project.accent, fontSize: 10, fontFamily: "'Space Mono',monospace" }}>{t}</span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Terminal Contact ──────────────────────────────────────────────────────────
function Terminal() {
  const [lines, setLines] = useState([
    { type: "system", text: "// DEPLOYMENT TERMINAL v2.6.0 — SECURE CHANNEL OPEN" },
    { type: "system", text: "// Connected to: muhammad.abbas@cloud.io" },
    { type: "prompt", text: "Awaiting transmission..." },
  ]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [sent, setSent] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const addLine = (text, type = "output") => setLines(l => [...l, { type, text }]);

  const handleKey = (e) => {
    if (e.key !== "Enter" || !input.trim()) return;
    const val = input.trim();
    addLine(`> ${val}`, "input");
    setInput("");
    if (step === 0) {
      setName(val);
      setTimeout(() => addLine(`Hello, ${val}. Enter your email to continue —`, "prompt"), 300);
      setStep(1);
    } else if (step === 1) {
      if (!val.includes("@")) { setTimeout(() => addLine("⚠ Invalid email format. Try again —", "error"), 300); return; }
      setEmail(val);
      setTimeout(() => addLine("Email verified. Type your message and press Enter —", "prompt"), 300);
      setStep(2);
    } else if (step === 2) {
      setMsg(val);
      setTimeout(() => {
        addLine("──────────────────────────────────────", "divider");
        addLine(`FROM : ${name} <${email}>`, "output");
        addLine(`MSG  : ${val}`, "output");
        addLine("──────────────────────────────────────", "divider");
        addLine("✓ Transmission queued. Deploying message to production...", "success");
        addLine("✓ Message delivered. Response ETA: 24h.", "success");
        setSent(true);
      }, 400);
      setStep(3);
    }
  };

  const promptColor = { system: "#4b6cb7", input: "#e2e8f0", output: "#94a3b8", prompt: "#7eb8ff", success: "#34d399", error: "#f87171", divider: "#1e293b" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      style={{
        background: "rgba(2,6,20,0.9)",
        border: "1px solid rgba(59,130,246,0.3)",
        borderRadius: 16,
        fontFamily: "'Space Mono', monospace",
        overflow: "hidden",
        boxShadow: "0 0 60px rgba(59,130,246,0.12)",
        maxWidth: 720, margin: "0 auto",
      }}
    >
      {/* titlebar */}
      <div style={{ padding: "10px 18px", background: "rgba(15,20,50,0.95)", borderBottom: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
        {["#ef4444", "#f59e0b", "#22c55e"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        <span style={{ color: "#475569", fontSize: 11, marginLeft: 8 }}>muhammadabbas — deploy-terminal</span>
      </div>
      {/* output */}
      <div style={{ padding: "20px 24px", minHeight: 240, maxHeight: 320, overflowY: "auto" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: promptColor[l.type] || "#94a3b8", fontSize: 12, lineHeight: 1.8, borderBottom: l.type === "divider" ? "1px solid #1e293b" : "none" }}>
            {l.type !== "divider" && l.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {/* input */}
      {!sent && (
        <div style={{ display: "flex", alignItems: "center", padding: "12px 24px", borderTop: "1px solid rgba(59,130,246,0.15)", background: "rgba(5,10,28,0.9)" }}>
          <span style={{ color: "#3b82f6", marginRight: 10, fontSize: 12 }}>$</span>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={step === 0 ? "Enter your name..." : step === 1 ? "Enter your email..." : "Type your message..."}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontFamily: "'Space Mono',monospace", fontSize: 12, caretColor: "#7eb8ff" }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ activeSection }) {
  const links = ["Hero", "Skills", "Projects", "Contact"];
  const scroll = (id) => document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
  return (
    <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 6vw", backdropFilter: "blur(16px)", background: "rgba(2,6,20,0.6)", borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
      <span style={{ fontFamily: "'Syne', sans-serif", color: "#7eb8ff", fontSize: 16, fontWeight: 800, letterSpacing: "0.08em" }}>MA<span style={{ color: "#a78bfa" }}>//</span></span>
      <div style={{ display: "flex", gap: 32 }}>
        {links.map(l => (
          <button key={l} onClick={() => scroll(l === "Hero" ? "hero" : l.toLowerCase())}
            style={{ background: "none", border: "none", cursor: "pointer", color: activeSection === l.toLowerCase() ? "#7eb8ff" : "#475569", fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: "0.1em", transition: "color 0.3s", textTransform: "uppercase" }}>
            {l}
          </button>
        ))}
      </div>
    </motion.nav>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionLabel({ label, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 60 }}>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        style={{ display: "inline-block", padding: "4px 16px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 99, color: "#7eb8ff", fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.15em", marginBottom: 18 }}>
        {label}
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
        style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px,5vw,52px)", fontWeight: 800, color: "#e2e8f0", margin: "0 0 12px", lineHeight: 1.15 }}>
        {title}
      </motion.h2>
      {subtitle && <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
        style={{ color: "#475569", fontFamily: "'DM Sans', sans-serif", fontSize: 15, maxWidth: 520, margin: "0 auto" }}>
        {subtitle}
      </motion.p>}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
    }, { threshold: 0.4 });
    ["hero", "skills", "projects", "contact"].forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const globalStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #020614; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #020614; } ::-webkit-scrollbar-thumb { background: #1e3a6e; border-radius: 2px; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px #3b82f644,0 0 60px #3b82f622} 50%{box-shadow:0 0 40px #3b82f688,0 0 100px #3b82f633} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  `;

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ background: "#020614", minHeight: "100vh", color: "#e2e8f0", position: "relative" }}>
        {/* <StarField /> */}
        <Nav activeSection={activeSection} />

        {/* ── HERO ── */}
        <section id="hero" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 6vw", position: "relative", zIndex: 1, textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a6e,#2d1b69)", border: "2px solid rgba(123,139,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, marginBottom: 36, animation: "pulseGlow 3s ease-in-out infinite", backdropFilter: "blur(10px)" }}>
            🚀
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ fontFamily: "'Space Mono',monospace", color: "#3b82f6", fontSize: 11, letterSpacing: "0.25em", marginBottom: 16, textTransform: "uppercase" }}>
            Cloud Engineer · DevOps Architect
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(44px,8vw,96px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 22, background: "linear-gradient(135deg, #e2e8f0 0%, #7eb8ff 45%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Muhammad<br />Abbas
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} style={{ marginBottom: 44, height: 32, display: "flex", alignItems: "center", gap: 8 }}>
            <TypeWriter texts={["Architecting the Cloud", "DevOps Engineer", "Infrastructure Automation", "Building Resilient Systems"]} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <motion.button whileHover={{ scale: 1.06, boxShadow: "0 0 30px #3b82f655" }} whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
              style={{ padding: "14px 36px", background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", border: "none", borderRadius: 50, color: "#fff", fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em" }}>
              Explore Projects ↓
            </motion.button>
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              style={{ padding: "14px 36px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: 50, color: "#7eb8ff", fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em" }}>
              Get in Touch
            </motion.button>
          </motion.div>

          {/* scroll hint */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
            style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#334155", fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em" }}>SCROLL</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 1, height: 28, background: "linear-gradient(180deg,#3b82f6,transparent)" }} />
          </motion.div>
        </section>

        {/* ── SKILLS ORBIT ── */}
        <section id="skills" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 6vw", position: "relative", zIndex: 1 }}>
          <SectionLabel label="// TECH STACK" title="Skills Orbit" subtitle="Technologies that power my infrastructure — constantly rotating, always in motion." />
          <div style={{ position: "relative", width: 760, height: 760, maxWidth: "90vw", maxHeight: "90vw" }}>
            {[130, 190, 240, 300, 350].map(r => <OrbitRing key={r} radius={r} />)}
            {/* center node */}
            <motion.div animate={{ scale: [1, 1.08, 1], boxShadow: ["0 0 30px #3b82f644", "0 0 60px #3b82f688", "0 0 30px #3b82f644"] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a6e,#2d1b69)", border: "2px solid rgba(123,139,255,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
              <span style={{ fontSize: 24 }}>🖥️</span>
              <span style={{ fontSize: 8, color: "#7eb8ff", fontFamily: "'Space Mono',monospace", marginTop: 2 }}>SERVER</span>
            </motion.div>
            {ORBIT_SKILLS.map((s, i) => <OrbitIcon key={s.label} skill={s} index={i} />)}
          </div>

          {/* skills list below */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 680, marginTop: 20 }}>
            {["Python", "JavaScript", "C++", "Bash", "SQL", "MySQL", "MongoDB", "Git", "VS Code"].map(sk => (
              <motion.span key={sk} whileHover={{ scale: 1.08, borderColor: "#7eb8ff" }} style={{ padding: "6px 16px", background: "rgba(30,58,110,0.3)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 99, color: "#94a3b8", fontFamily: "'Space Mono',monospace", fontSize: 11, cursor: "default", transition: "border-color 0.3s" }}>{sk}</motion.span>
            ))}
          </div>
        </section>

        {/* ── PROJECTS ── */}
        <section id="projects" style={{ padding: "80px 6vw", position: "relative", zIndex: 1 }}>
          <SectionLabel label="// PROJECT CONSTELLATIONS" title="Built & Deployed" subtitle="Production-grade systems designed for scale, reliability, and automation." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22, maxWidth: 1100, margin: "0 auto" }}>
            {PROJECTS.map((p, i) => <ProjectCard key={p.title} project={p} index={i} />)}
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" style={{ padding: "80px 6vw 100px", position: "relative", zIndex: 1 }}>
          <SectionLabel label="// DEPLOYMENT TERMINAL" title="Send a Transmission" subtitle="Open a secure channel. Type your message into the terminal below." />
          <Terminal />

          {/* quick links */}
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
            {[
              { label: "GitHub", href: "https://github.com/shatteredcode69", icon: "🐙" },
              { label: "LinkedIn", href: "https://linkedin.com/in/abbassafar", icon: "💼" },
              { label: "Email", href: "mailto:abbashamza53597@gmail.com", icon: "📡" },
            ].map(l => (
              <motion.a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.08, borderColor: "#7eb8ff" }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "rgba(14,22,60,0.6)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 50, color: "#94a3b8", textDecoration: "none", fontFamily: "'Space Mono',monospace", fontSize: 11, transition: "border-color 0.3s,color 0.3s" }}>
                <span>{l.icon}</span>{l.label}
              </motion.a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px 0 36px", borderTop: "1px solid rgba(30,58,110,0.3)", color: "#1e3a6e", fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.1em", position: "relative", zIndex: 1 }}>
          MUHAMMAD ABBAS · ISLAMABAD, PAKISTAN · CLOUD ENGINEER · {new Date().getFullYear()}
        </div>
      </div>
    </>
  );
}
