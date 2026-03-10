import { useState, useEffect, useRef } from "react";

const WEBHOOK_URL = "https://airfitgym.app.n8n.cloud/webhook/airfit-gym-diet";

// ─── SHARED QUESTIONS ───────────────────────────────────────────
const SHARED = [
  { key: "name",   label: "Full Name",     type: "text",   placeholder: "e.g. Rahul Sharma" },
  { key: "email",  label: "Email Address", type: "email",  placeholder: "you@gmail.com" },
  { key: "gender", label: "Gender",        type: "select", options: ["Male","Female","Other"] },
  { key: "age",    label: "Age",           type: "number", placeholder: "25", unit: "yrs" },
  { key: "height", label: "Height",        type: "number", placeholder: "170", unit: "cm" },
  { key: "weight", label: "Weight",        type: "number", placeholder: "70", unit: "kg" },
  { key: "bodyFat",label: "Body Fat %",    type: "number", placeholder: "18", unit: "%", optional: true },
];

// ─── DIET-SPECIFIC QUESTIONS ─────────────────────────────────────
const DIET_QUESTIONS = [
  { key: "goal",           label: "Primary Goal",     type: "select", options: ["Fat Loss","Muscle Gain","Maintenance","Medical / Therapeutic"] },
  { key: "activityLevel",  label: "Activity Level",   type: "select", options: ["Sedentary (desk job)","Lightly Active","Moderately Active","Very Active","Athlete"] },
  { key: "dietPreference", label: "Diet Preference",  type: "select", options: ["Vegetarian","Eggetarian","Non-Vegetarian","Vegan"] },
  { key: "foodCulture",    label: "Food Culture",     type: "select", options: ["Indian Home Food","South Indian","North Indian","PG / Hostel Food","Mixed / No Preference"] },
  { key: "mealsPerDay",    label: "Meals per Day",    type: "select", options: ["2","3","4","5","6"] },
  { key: "allergies",      label: "Allergies / Medical Conditions", type: "text", placeholder: "e.g. lactose intolerant, diabetes...", optional: true },
  { key: "previousWorkout",label: "Workout History",  type: "select", options: ["Complete Beginner","Was active 3 months ago","Was active 6 months ago","Was active 8+ months ago","Currently Training"] },
  { key: "wakeTime",       label: "Wake-up Time",     type: "select", options: ["5–6 AM","6–7 AM","7–8 AM","8–9 AM","After 9 AM"] },
];

// ─── WORKOUT-SPECIFIC QUESTIONS ──────────────────────────────────
const WORKOUT_QUESTIONS = [
  { key: "goal",           label: "Training Goal",    type: "select", options: ["Build Muscle","Lose Fat","Increase Strength","Improve Endurance","Athletic Performance","General Fitness"] },
  { key: "activityLevel",  label: "Current Fitness",  type: "select", options: ["Complete Beginner","Some Experience (< 6 months)","Intermediate (6–18 months)","Advanced (2+ years)"] },
  { key: "gymAccess",      label: "Gym Access",       type: "select", options: ["Full Gym (all equipment)","Home Gym (dumbbells/barbell)","Bodyweight Only","Resistance Bands"] },
  { key: "daysPerWeek",    label: "Days Available",   type: "select", options: ["3 days","4 days","5 days","6 days"] },
  { key: "sessionLength",  label: "Session Duration", type: "select", options: ["30–45 min","45–60 min","60–75 min","75–90 min"] },
  { key: "injuries",       label: "Injuries / Limitations", type: "text", placeholder: "e.g. knee pain, lower back issue...", optional: true },
  { key: "previousWorkout",label: "Previous Training", type: "select", options: ["Never trained","Trained before, stopped 3 months ago","Trained before, stopped 6+ months ago","Currently training but inconsistent"] },
  { key: "focusArea",      label: "Focus Area",       type: "select", options: ["Full Body","Upper Body","Lower Body","Core & Abs","No Preference"] },
];

const TOTAL_STEPS = 5;

// ─── STYLES ──────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Barlow+Condensed:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --orange: #FF6B00;
    --orange-dim: rgba(255,107,0,0.12);
    --orange-glow: rgba(255,107,0,0.3);
    --orange-glow2: rgba(255,107,0,0.15);
    --bg: #080808;
    --surface: #111111;
    --surface2: #1A1A1A;
    --surface3: #222222;
    --border: rgba(255,255,255,0.07);
    --border-active: rgba(255,107,0,0.5);
    --text: #F0EDE8;
    --muted: #777;
    --muted2: #444;
  }

  html, body, #root { height: 100%; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Sora', 'DM Sans', sans-serif;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

  /* ═══════════════════════════════════════
     HERO / LANDING PAGE
  ═══════════════════════════════════════ */

  .hero-page {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* Ambient glow blobs */
  .hero-page::before {
    content: '';
    position: absolute;
    top: -200px; right: -200px;
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  .hero-page::after {
    content: '';
    position: absolute;
    bottom: -150px; left: -150px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── NAV ── */
  .hero-nav {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 60px;
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(10px);
  }

  .nav-logo {
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text);
  }

  .nav-logo em {
    color: var(--orange);
    font-style: normal;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-btn {
    padding: 10px 22px;
    border-radius: 6px;
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
    letter-spacing: 0.3px;
  }

  .nav-btn-ghost {
    background: transparent;
    border: 1.5px solid var(--border);
    color: var(--muted);
  }

  .nav-btn-ghost:hover {
    border-color: rgba(255,107,0,0.4);
    color: var(--orange);
    background: var(--orange-dim);
  }

  .nav-btn-orange {
    background: linear-gradient(135deg, #FF6B00 0%, #ff4500 100%);
    border: none;
    color: #fff;
    box-shadow: 0 4px 20px var(--orange-glow2);
  }

  .nav-btn-orange:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 28px var(--orange-glow);
    background: linear-gradient(135deg, #ff7a1a 0%, #ff5500 100%);
  }

  /* ── HERO BODY ── */
  .hero-body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 40px;
    padding: 60px 60px 40px;
    position: relative;
    z-index: 1;
  }

  /* ── HERO LEFT ── */
  .hero-left {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--orange-dim);
    border: 1px solid var(--border-active);
    border-radius: 100px;
    padding: 6px 16px;
    width: fit-content;
  }

  .hero-badge span {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--orange);
  }

  .badge-dot {
    width: 6px; height: 6px;
    background: var(--orange);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  .hero-headline {
    font-family: 'Sora', sans-serif;
    font-size: clamp(52px, 6vw, 88px);
    font-weight: 800;
    line-height: 0.95;
    letter-spacing: -3px;
    color: var(--text);
  }

  .hero-headline .hl-orange { color: var(--orange); }

  .hero-sub {
    font-size: 16px;
    font-weight: 400;
    color: var(--muted);
    line-height: 1.7;
    max-width: 460px;
  }

  .hero-support {
    font-size: 13px;
    color: var(--muted2);
    line-height: 1.7;
    max-width: 420px;
    padding: 16px;
    border-left: 2px solid var(--orange);
    border-radius: 0 4px 4px 0;
    background: rgba(255,107,0,0.04);
  }

  .hero-cta-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .cta-primary {
    padding: 16px 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #FF6B00 0%, #ff4500 100%);
    border: none;
    color: #fff;
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 6px 30px var(--orange-glow2);
    position: relative;
    overflow: hidden;
    letter-spacing: 0.2px;
  }

  .cta-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
  }

  .cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px var(--orange-glow);
  }

  .cta-primary:active { transform: translateY(0); }

  .cta-secondary {
    padding: 16px 28px;
    border-radius: 8px;
    background: transparent;
    border: 1.5px solid rgba(255,255,255,0.12);
    color: var(--text);
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
  }

  .cta-secondary:hover {
    border-color: rgba(255,107,0,0.4);
    color: var(--orange);
    background: var(--orange-dim);
  }

  /* ── HERO RIGHT ── */
  .hero-right {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 520px;
  }

  .hero-athlete-wrap {
    position: relative;
    width: 100%;
    max-width: 420px;
    height: 500px;
    margin: 0 auto;
  }

  .hero-athlete-bg {
    position: absolute;
    inset: 0;
    border-radius: 24px;
    background: linear-gradient(160deg, #1a1a1a 0%, #111 50%, #0c0c0c 100%);
    border: 1px solid rgba(255,107,0,0.15);
    overflow: hidden;
  }

  .hero-athlete-bg::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 65%);
  }

  .hero-athlete-bg::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 200px;
    background: linear-gradient(to top, var(--bg) 0%, transparent 100%);
    z-index: 2;
  }

  .hero-athlete-silhouette {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    font-size: 220px;
    filter: drop-shadow(0 0 60px rgba(255,107,0,0.3));
    padding-top: 20px;
    user-select: none;
  }

  .hero-athlete-glow {
    position: absolute;
    bottom: 20%; left: 50%;
    transform: translateX(-50%);
    width: 240px; height: 80px;
    background: radial-gradient(ellipse, rgba(255,107,0,0.25) 0%, transparent 70%);
    filter: blur(20px);
    z-index: 0;
  }

  /* ── FLOATING STAT CARDS ── */
  .stat-card {
    position: absolute;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(20,20,20,0.85);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
    animation: floatCard 4s ease-in-out infinite;
  }

  .stat-card:nth-child(1) { top: 10%; left: -30px; animation-delay: 0s; }
  .stat-card:nth-child(2) { top: 30%; right: -30px; animation-delay: 1s; }
  .stat-card:nth-child(3) { bottom: 28%; left: -20px; animation-delay: 2s; }
  .stat-card:nth-child(4) { bottom: 12%; right: -20px; animation-delay: 1.5s; }

  @keyframes floatCard {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  .stat-icon {
    width: 36px; height: 36px;
    border-radius: 8px;
    background: var(--orange-dim);
    border: 1px solid rgba(255,107,0,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .stat-info { display: flex; flex-direction: column; }

  .stat-value {
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 10px;
    color: var(--muted);
    font-weight: 400;
    letter-spacing: 0.5px;
  }

  /* ── HERO BOTTOM TRUST BAR ── */
  .hero-trust {
    position: relative;
    z-index: 1;
    padding: 20px 60px 40px;
    display: flex;
    align-items: center;
    gap: 32px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--muted);
    font-weight: 400;
  }

  .trust-item span:first-child { font-size: 16px; }

  /* ═══════════════════════════════════════
     FORM APP LAYOUT
  ═══════════════════════════════════════ */

  .app {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* LEFT PANEL */
  .panel-left {
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    overflow: hidden;
  }

  .panel-left::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .panel-left::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .brand { position: relative; z-index: 1; }

  .brand-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--orange-dim);
    border: 1px solid var(--border-active);
    border-radius: 100px;
    padding: 5px 14px;
    margin-bottom: 28px;
  }

  .brand-tag span {
    font-family: 'Sora', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--orange);
  }

  .brand-dot {
    width: 6px; height: 6px;
    background: var(--orange);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  .brand-name {
    font-family: 'Sora', sans-serif;
    font-size: 64px;
    font-weight: 800;
    line-height: 0.9;
    letter-spacing: -2px;
    color: var(--text);
  }

  .brand-name em {
    display: block;
    color: var(--orange);
    font-style: normal;
  }

  .brand-desc {
    margin-top: 24px;
    color: var(--muted);
    font-weight: 300;
    font-size: 14px;
    line-height: 1.7;
    max-width: 320px;
  }

  /* ── PROGRESS ── */
  .progress-wrap { position: relative; z-index: 1; }

  .progress-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .progress-label span:first-child {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
  }

  .progress-label span:last-child {
    font-family: 'Sora', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--orange);
  }

  .progress-bar {
    height: 3px;
    background: var(--surface3);
    border-radius: 3px;
    overflow: visible;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #FF6B00 0%, #ffaa44 100%);
    border-radius: 3px;
    transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
    position: relative;
    box-shadow: 0 0 12px rgba(255,107,0,0.6);
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    right: -4px; top: 50%;
    transform: translateY(-50%);
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--orange);
    box-shadow: 0 0 10px rgba(255,107,0,0.8), 0 0 20px rgba(255,107,0,0.4);
  }

  .step-pills {
    display: flex;
    gap: 6px;
    margin-top: 20px;
    flex-wrap: wrap;
  }

  .step-pill {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 5px 11px;
    border-radius: 100px;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  }

  .step-pill.done {
    background: linear-gradient(135deg, #FF6B00, #ff4500);
    color: #fff;
    box-shadow: 0 2px 8px rgba(255,107,0,0.3);
  }
  .step-pill.active {
    background: var(--orange-dim);
    color: var(--orange);
    border: 1px solid var(--border-active);
    box-shadow: 0 0 0 2px rgba(255,107,0,0.1);
  }
  .step-pill.upcoming { background: var(--surface3); color: var(--muted2); }

  /* RIGHT PANEL */
  .panel-right {
    min-height: 100vh;
    padding: 48px 52px;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .form-header { margin-bottom: 36px; }

  .form-step-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--orange);
    margin-bottom: 8px;
  }

  .form-title {
    font-family: 'Sora', sans-serif;
    font-size: 36px;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.5px;
    color: var(--text);
  }

  .form-subtitle {
    margin-top: 10px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 300;
  }

  /* ── PLAN CARDS (ENHANCED) ── */
  .plan-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 8px;
  }

  .plan-card {
    position: relative;
    padding: 30px 26px;
    border-radius: 12px;
    border: 1.5px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    text-align: left;
    overflow: hidden;
  }

  .plan-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, var(--orange-dim) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .plan-card::after {
    content: '';
    position: absolute;
    inset: -1.5px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255,107,0,0) 0%, rgba(255,107,0,0) 100%);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .plan-card:hover {
    border-color: rgba(255,107,0,0.5);
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 12px 40px rgba(255,107,0,0.15), 0 0 0 1px rgba(255,107,0,0.2);
  }

  .plan-card:hover::before { opacity: 1; }

  .plan-card.selected {
    border-color: var(--orange);
    background: var(--surface);
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 12px 48px var(--orange-glow), 0 0 0 1px rgba(255,107,0,0.3);
  }

  .plan-card.selected::before { opacity: 1; }

  .plan-icon {
    font-size: 36px;
    margin-bottom: 16px;
    display: block;
    line-height: 1;
    filter: drop-shadow(0 0 8px rgba(255,107,0,0.3));
  }

  .plan-card-title {
    font-family: 'Sora', sans-serif;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--text);
    margin-bottom: 8px;
  }

  .plan-card-desc {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.7;
    font-weight: 300;
  }

  .plan-card-badge {
    position: absolute;
    top: 14px; right: 14px;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: var(--orange);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    color: #fff;
    font-weight: 700;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    transform: scale(0.5);
    box-shadow: 0 0 12px var(--orange-glow);
  }

  .plan-card.selected .plan-card-badge {
    opacity: 1;
    transform: scale(1);
  }

  /* form grid */
  .fields-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .field-full { grid-column: 1 / -1; }
  .field-wrap { display: flex; flex-direction: column; gap: 6px; }

  .field-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .field-optional {
    font-size: 9px;
    color: var(--muted2);
    letter-spacing: 1px;
    font-weight: 400;
  }

  .input-wrap { position: relative; }

  .field-unit {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: var(--muted);
    font-weight: 600;
    pointer-events: none;
    letter-spacing: 1px;
  }

  input, select {
    width: 100%;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 13px 16px;
    color: var(--text);
    font-family: 'Sora', 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 400;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    appearance: none;
    -webkit-appearance: none;
  }

  input:focus, select:focus {
    border-color: var(--orange);
    background: var(--surface2);
    box-shadow: 0 0 0 3px var(--orange-dim), 0 0 12px rgba(255,107,0,0.1);
  }

  input::placeholder { color: var(--muted2); font-weight: 300; }

  select {
    cursor: pointer;
    padding-right: 36px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
  }

  select option { background: #1a1a1a; color: var(--text); }

  /* confirm box */
  .confirm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }

  .confirm-row {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 14px 16px;
    background: var(--surface);
    transition: background 0.2s;
  }

  .confirm-row:hover { background: var(--surface2); }

  .confirm-key {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
  }

  .confirm-val {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }

  /* nav buttons */
  .form-nav {
    display: flex;
    gap: 12px;
    margin-top: 32px;
    align-items: center;
  }

  .btn-back {
    padding: 14px 20px;
    border-radius: 8px;
    border: 1.5px solid var(--border);
    background: transparent;
    color: var(--muted);
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.3px;
  }

  .btn-back:hover { border-color: rgba(255,255,255,0.15); color: var(--text); }

  .btn-next {
    flex: 1;
    padding: 15px 24px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #FF6B00 0%, #ff4500 100%);
    color: #fff;
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.25s;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(255,107,0,0.2);
  }

  .btn-next::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
  }

  .btn-next:hover {
    background: linear-gradient(135deg, #ff7a1a 0%, #ff5500 100%);
    box-shadow: 0 8px 32px var(--orange-glow);
    transform: translateY(-2px);
  }

  .btn-next:active { transform: translateY(0); }
  .btn-next:disabled { background: var(--muted2); cursor: not-allowed; box-shadow: none; transform: none; }

  /* success */
  .success-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 48px;
    background: var(--bg);
    text-align: center;
  }

  .success-icon {
    width: 90px; height: 90px;
    background: var(--orange-dim);
    border: 1.5px solid var(--orange);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 40px;
    margin-bottom: 28px;
    animation: successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    box-shadow: 0 0 40px var(--orange-glow);
  }

  @keyframes successPop {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .success-title {
    font-family: 'Sora', sans-serif;
    font-size: 52px;
    font-weight: 800;
    letter-spacing: -2px;
    color: var(--text);
    margin-bottom: 8px;
  }

  .success-sub {
    color: var(--muted);
    font-size: 15px;
    max-width: 360px;
    line-height: 1.7;
    font-weight: 300;
    margin-bottom: 32px;
  }

  .success-email { color: var(--orange); font-weight: 600; }

  .success-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--orange-dim);
    border: 1px solid var(--border-active);
    border-radius: 8px;
    padding: 12px 24px;
  }

  .success-tag span {
    font-family: 'Sora', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--orange);
  }

  /* fade in */
  .fade-in { animation: fadeUp 0.35s ease both; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* mobile */
  @media (max-width: 900px) {
    .hero-nav { padding: 20px 24px; }
    .hero-body { grid-template-columns: 1fr; padding: 40px 24px 20px; gap: 40px; }
    .hero-right { min-height: 360px; }
    .hero-athlete-wrap { height: 340px; }
    .hero-headline { font-size: clamp(42px, 10vw, 64px); letter-spacing: -2px; }
    .hero-trust { padding: 20px 24px 32px; gap: 20px; }
    .stat-card:nth-child(1) { top: 5%; left: 10px; }
    .stat-card:nth-child(2) { top: 25%; right: 10px; }
    .stat-card:nth-child(3) { bottom: 22%; left: 10px; }
    .stat-card:nth-child(4) { bottom: 5%; right: 10px; }
    .hero-left { gap: 20px; }
  }

  @media (max-width: 768px) {
    .app { grid-template-columns: 1fr; }
    .panel-left { position: relative; height: auto; padding: 32px 24px; }
    .brand-name { font-size: 48px; }
    .panel-right { padding: 32px 24px; }
    .plan-grid { grid-template-columns: 1fr; }
    .fields-grid { grid-template-columns: 1fr; }
    .field-full { grid-column: 1; }
    .confirm-grid { grid-template-columns: 1fr; }
    .form-title { font-size: 28px; }
  }
`;

// ─── STEP META ────────────────────────────────────────────────────
const getStepMeta = (step, planType) => {
  const isDiet = planType === "Diet Plan";
  const steps = [
    { label: "01 — Plan Type",      title: "What are you here for?",     sub: "Choose the plan that matches your goal" },
    { label: "02 — About You",      title: "Tell us about yourself",      sub: "Basic details to personalise your plan" },
    { label: "03 — Body Stats",     title: "Your measurements",           sub: "Accurate stats build accurate plans" },
    { label: isDiet ? "04 — Diet Preferences" : "04 — Training Setup",
      title: isDiet ? "Food & lifestyle" : "Your training setup",
      sub: isDiet ? "How you eat, how you live" : "Equipment, schedule, and focus area" },
    { label: isDiet ? "05 — Diet Details" : "05 — Training Details",
      title: isDiet ? "Fine-tune your nutrition" : "Fine-tune your program",
      sub: isDiet ? "Last details for your meal plan" : "Last details for your workout plan" },
    { label: "06 — Confirm",        title: "Review & submit",             sub: "Double-check before we craft your plan" },
  ];
  return steps[step] || steps[0];
};

const STEP_LABELS = ["Plan Type", "About You", "Body Stats", "Preferences", "Details", "Confirm"];

// ─── HERO SECTION ────────────────────────────────────────────────
function HeroPage({ onStart }) {
  return (
    <div className="hero-page">
      <style>{css}</style>

      {/* NAV */}
      <nav className="hero-nav">
        <div className="nav-logo">AIR<em>FIT</em> GYM</div>
        <div className="nav-links">
          <button className="nav-btn nav-btn-ghost" onClick={onStart}>Explore Plans</button>
          <button className="nav-btn nav-btn-orange" onClick={onStart}>Start Your Plan →</button>
        </div>
      </nav>

      {/* HERO BODY */}
      <div className="hero-body">

        {/* LEFT */}
        <div className="hero-left fade-in">
          <div className="hero-badge">
            <div className="badge-dot" />
            <span>Personalized By Expert Coaches</span>
          </div>

          <h1 className="hero-headline">
            Get In<br />
            <span className="hl-orange">Shape.</span>
          </h1>

          <p className="hero-sub">
            Get a personalized diet or workout plan crafted by Expert Coaches and delivered directly to your inbox.
          </p>

          <div className="hero-support">
            Answer a few quick questions and receive a fully personalized fitness plan designed for your body, goals, and lifestyle.
          </div>

          <div className="hero-cta-row">
            <button className="cta-primary" onClick={onStart}>Start Your Plan →</button>
            <button className="cta-secondary" onClick={onStart}>Explore Plans</button>
          </div>
        </div>

        {/* RIGHT – athlete visual + stat cards */}
        <div className="hero-right">
          <div className="hero-athlete-wrap">

            {/* stat cards */}
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <div className="stat-value">2,400</div>
                <div className="stat-label">Calories Burned</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🥩</div>
              <div className="stat-info">
                <div className="stat-value">180g</div>
                <div className="stat-label">Protein Target</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💪</div>
              <div className="stat-info">
                <div className="stat-value">24 Sets</div>
                <div className="stat-label">Workout Sets</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <div className="stat-value">75 min</div>
                <div className="stat-label">Training Duration</div>
              </div>
            </div>

            {/* athlete image area */}
            <div className="hero-athlete-bg">
              <div className="hero-athlete-silhouette">🏋️</div>
              <div className="hero-athlete-glow" />
            </div>
          </div>
        </div>
      </div>

      {/* TRUST BAR */}
      <div className="hero-trust">
        <div className="trust-item"><span>✅</span><span>Expert Coach Reviewed</span></div>
        <div className="trust-item"><span>⚡</span><span>Delivered in 60 Minutes</span></div>
        <div className="trust-item"><span>📊</span><span>Fully Personalized</span></div>
        <div className="trust-item"><span>🇮🇳</span><span>Indian Meal Plans Available</span></div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
function AirfitGym() {
  const [showHero, setShowHero] = useState(true);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    planType: "",
    name: "", email: "", gender: "", age: "", height: "", weight: "", bodyFat: "",
    goal: "", activityLevel: "", dietPreference: "", foodCulture: "",
    mealsPerDay: "", allergies: "", previousWorkout: "", wakeTime: "",
    gymAccess: "", daysPerWeek: "", sessionLength: "", injuries: "", focusArea: "",
  });
  const rightRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isDiet = form.planType === "Diet Plan";
  const specificQ = isDiet ? DIET_QUESTIONS : WORKOUT_QUESTIONS;

  const canNext = () => {
    if (step === 0) return !!form.planType;
    if (step === 1) return form.name && form.email && form.gender && form.age;
    if (step === 2) return form.height && form.weight;
    if (step === 3) return specificQ.slice(0,4).filter(q => !q.optional).every(q => !!form[q.key]);
    if (step === 4) return specificQ.slice(4).filter(q => !q.optional).every(q => !!form[q.key]);
    return true;
  };

  const next = () => { if (canNext()) { setStep(s => s + 1); rightRef.current?.scrollTo(0, 0); } };
  const back = () => { setStep(s => s - 1); rightRef.current?.scrollTo(0, 0); };

  const submit = async () => {
    setLoading(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        mode: "no-cors",
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setLoading(false);
  };

  const pct = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100);
  const meta = getStepMeta(step, form.planType);

  if (showHero) return <HeroPage onStart={() => setShowHero(false)} />;

  if (submitted) return (
    <div className="success-screen">
      <style>{css}</style>
      <div className="success-icon">🎯</div>
      <h1 className="success-title">PLAN SUBMITTED</h1>
      <p className="success-sub">
        Your personalised <strong style={{color:"#FF6B00"}}>{form.planType}</strong> is being crafted by our expert coaches.<br /><br />
        Check <span className="success-email">{form.email}</span> — it arrives within <strong style={{color:"#FF6B00"}}>60 minutes</strong>.
      </p>
      <div className="success-tag">
        <div className="brand-dot" />
        <span>💪 Stay Consistent. Stay Strong.</span>
      </div>
    </div>
  );

  return (
    <div className="app">
      <style>{css}</style>

      {/* ── LEFT PANEL ── */}
      <aside className="panel-left">
        <div className="brand">
          <div className="brand-tag">
            <div className="brand-dot" />
            <span>Personalized By Expert Coaches</span>
          </div>
          <div className="brand-name">
            AIR<em>FIT</em>GYM
          </div>
          <p className="brand-desc">
            Answer a few questions. Get a fully personalised {form.planType || "plan"} reviewed by our expert coaches and delivered to your inbox.
          </p>
        </div>

        <div className="progress-wrap">
          <div className="progress-label">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${pct}%`}} />
          </div>
          <div className="step-pills">
            {STEP_LABELS.map((l, i) => (
              <div key={i} className={`step-pill ${i < step ? "done" : i === step ? "active" : "upcoming"}`}>
                {i < step ? "✓ " : ""}{l}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="panel-right" ref={rightRef}>
        <div className="form-header fade-in" key={step}>
          <div className="form-step-label">{meta.label}</div>
          <h2 className="form-title">{meta.title}</h2>
          <p className="form-subtitle">{meta.sub}</p>
        </div>

        {/* STEP 0 — plan type */}
        {step === 0 && (
          <div className="fade-in">
            <div className="plan-grid">
              {[
                { val: "Diet Plan", icon: "🥗", title: "Diet Plan", desc: "7-day personalised Indian meal plan with macros, timings, supplement stack & YouTube guides" },
                { val: "Workout Plan", icon: "🏋️", title: "Workout Plan", desc: "6-day training program with progressive overload, exercise demos & recovery protocol" },
              ].map(p => (
                <button key={p.val} className={`plan-card ${form.planType === p.val ? "selected" : ""}`} onClick={() => set("planType", p.val)}>
                  <div className="plan-card-badge">✓</div>
                  <span className="plan-icon">{p.icon}</span>
                  <div className="plan-card-title">{p.title}</div>
                  <p className="plan-card-desc">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1 — shared: name, email, gender, age */}
        {step === 1 && (
          <div className="fields-grid fade-in">
            {SHARED.slice(0, 4).map(f => (
              <div key={f.key} className="field-wrap">
                <label className="field-label">
                  {f.label}
                  {f.optional && <span className="field-optional">optional</span>}
                </label>
                <div className="input-wrap">
                  {f.type === "select"
                    ? <select value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                        <option value="">Select...</option>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    : <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={f.unit ? {paddingRight:"48px"} : {}} />
                  }
                  {f.unit && <span className="field-unit">{f.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 2 — shared: height, weight, bodyfat */}
        {step === 2 && (
          <div className="fields-grid fade-in">
            {SHARED.slice(4).map(f => (
              <div key={f.key} className="field-wrap">
                <label className="field-label">
                  {f.label}
                  {f.optional && <span className="field-optional">optional</span>}
                </label>
                <div className="input-wrap">
                  <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={f.unit ? {paddingRight:"48px"} : {}} />
                  {f.unit && <span className="field-unit">{f.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3 — specific Q (first 4) */}
        {step === 3 && (
          <div className="fields-grid fade-in">
            {specificQ.slice(0, 4).map(f => (
              <div key={f.key} className="field-wrap">
                <label className="field-label">
                  {f.label}
                  {f.optional && <span className="field-optional">optional</span>}
                </label>
                <div className="input-wrap">
                  {f.type === "select"
                    ? <select value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                        <option value="">Select...</option>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    : <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4 — specific Q (last 4) */}
        {step === 4 && (
          <div className="fields-grid fade-in">
            {specificQ.slice(4).map(f => (
              <div key={f.key} className={`field-wrap${f.key === "injuries" || f.key === "allergies" ? " field-full" : ""}`}>
                <label className="field-label">
                  {f.label}
                  {f.optional && <span className="field-optional">optional</span>}
                </label>
                <div className="input-wrap">
                  {f.type === "select"
                    ? <select value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                        <option value="">Select...</option>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    : <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 5 — confirm */}
        {step === 5 && (
          <div className="fade-in">
            <div className="confirm-grid">
              {[
                ["Plan", form.planType],
                ["Name", form.name],
                ["Email", form.email],
                ["Gender / Age", `${form.gender}, ${form.age} yrs`],
                ["Height / Weight", `${form.height} cm  /  ${form.weight} kg`],
                ...(form.bodyFat ? [["Body Fat", `${form.bodyFat}%`]] : []),
                ["Goal", form.goal],
                ["Activity", form.activityLevel],
                ...(isDiet ? [
                  ["Diet", form.dietPreference],
                  ["Food Culture", form.foodCulture],
                  ["Meals/day", form.mealsPerDay],
                  ["Wake Time", form.wakeTime],
                  ["Workout History", form.previousWorkout],
                  ...(form.allergies ? [["Allergies", form.allergies]] : []),
                ] : [
                  ["Gym Access", form.gymAccess],
                  ["Days/week", form.daysPerWeek],
                  ["Session Length", form.sessionLength],
                  ["Focus Area", form.focusArea],
                  ["Previous Training", form.previousWorkout],
                  ...(form.injuries ? [["Injuries", form.injuries]] : []),
                ]),
              ].map(([k, v]) => (
                <div key={k} className="confirm-row">
                  <span className="confirm-key">{k}</span>
                  <span className="confirm-val">{v || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NAV */}
        <div className="form-nav">
          {step > 0 && (
            <button className="btn-back" onClick={back}>← Back</button>
          )}
          {step < TOTAL_STEPS
            ? <button className="btn-next" onClick={next} disabled={!canNext()}>
                Continue →
              </button>
            : <button className="btn-next" onClick={submit} disabled={loading}>
                {loading ? "Submitting..." : "Get My Plan →"}
              </button>
          }
        </div>
      </main>
    </div>
  );
}

export default AirfitGym;