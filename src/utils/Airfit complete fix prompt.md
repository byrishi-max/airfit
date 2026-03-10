# AIRFIT GYM — Complete Web App Fix Prompt

---

## WHAT NEEDS TO BE FIXED

You are working on an existing React web app called AirfitGym that has already been
partially built. These are the exact issues to fix:

1. **Admin adds client → client receives a PORTAL INVITE EMAIL, not a plan email**
   - Email should say: "You're invited to Airfit Gym! Login at [APP_URL] with your phone number"
   - NOT the workout plan itself

2. **After client fills the questionnaire form, n8n generates the plan and delivers it
   to the WEB APP via webhook (not email)** — the plan appears in the web app automatically

3. **Client login uses phone number** (already built but may have bugs — fix if broken)

4. **Workout plan shows INSIDE the web app** with:
   - YouTube videos embedded in-app (iframe, no redirect)
   - Checkboxes per exercise for progress tracking
   - recharts BarChart showing weekly completion

5. **n8n workflow has NO email delivery** — plan goes to web app only

---

## YOUR APP URL

Replace `YOUR_APP_URL` with your actual Vercel URL everywhere:
```
https://workoutplanairfit.vercel.app
```

---

## PART 1 — n8n CHANGES (import these JSON files)

### Import Workflow 1: airfit_workflow1_plan_generator.json
This replaces your existing "Airfit Gym Email Personalization" workflow.

**What changed:**
- `Build Gemini Prompt` now carries `clientId` and `phone` from the webhook body
- `Rebuild Workout Plan` now returns structured `workoutJson` (with videoId per exercise) instead of HTML
- `Build Email` node → REMOVED
- `Send Email` node → REPLACED with `Save Plan to Store` (HTTP POST to Workflow 2)
- Wait is 60 minutes, Gemini model is `gemini-2.0-flash-lite`

### Import Workflow 2: airfit_workflow2_plan_store.json
This is a NEW 2-webhook workflow. Create it fresh in n8n.

**What it does:**
- `POST /airfit-plan-ready` — receives the completed plan from Workflow 1, stores in static data
- `GET /airfit-get-plan?clientId=xxx` — web app polls this every 30 seconds to check if plan is ready

**After importing both workflows, activate them both.**

---

## PART 2 — WEB APP CODE FIXES

### Fix 1: Admin "Add Client" — send portal invite email (not plan email)

When admin submits the Add Client form, after saving to localStorage, call:

```js
// utils/inviteClient.js
export async function sendPortalInvite({ name, email, phone }) {
  // Option A: use EmailJS (free, no backend needed)
  // Option B: trigger a simple n8n workflow (see below)
  // Option C: use mailto: link as fallback

  // SIMPLEST: trigger n8n invite webhook
  try {
    await fetch('https://airfitgym.app.n8n.cloud/webhook/airfit-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        appUrl: 'https://workoutplanairfit.vercel.app/client/login',
        message: `Hi ${name}! You've been invited to the Airfit Gym Training Portal. Login at the link below with your phone number: ${phone}`
      })
    });
  } catch(e) {
    console.log('Invite send failed (non-critical):', e);
  }
}
```

**Create a 3rd minimal n8n workflow for invites:**
- Webhook (POST) path: `airfit-invite`
- Gmail node: send invite email
- Subject: `🏋️ You're invited to Airfit Gym Training Portal!`
- Body (HTML):
```html
<div style="font-family:Arial;background:#0d0d0d;padding:40px;border-radius:12px;max-width:500px;margin:0 auto;">
  <h1 style="color:#FF5C1A;letter-spacing:4px;">AIRFIT GYM</h1>
  <p style="color:#ddd;">Hi {{name}}!</p>
  <p style="color:#aaa;">You've been added to the Airfit Gym Training Portal. Login with your phone number to access your personalized AI workout plan.</p>
  <a href="{{appUrl}}" style="display:inline-block;background:#FF5C1A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:20px 0;">
    Enter Training Portal →
  </a>
  <p style="color:#666;font-size:12px;">Your login phone: {{phone}}</p>
</div>
```

---

### Fix 2: Questionnaire form submission — include clientId + phone

In your `WorkoutQuestionnaire.jsx` (or wherever the form submits to n8n), update the POST body:

```js
// When submitting the workout questionnaire:
const session = JSON.parse(localStorage.getItem('airfit_client_session') || '{}');

const payload = {
  // ── REQUIRED NEW FIELDS ──
  clientId:  session.clientId,   // ← ADD THIS
  phone:     session.phone,      // ← ADD THIS

  // ── existing fields (keep all of these) ──
  planType:  'Workout Plan',
  name:      session.name,
  email:     session.email,
  gender:    formData.gender     || '',
  age:       formData.age        || '',
  height:    formData.height     || '',
  weight:    formData.weight     || '',
  goal:      formData.goal       || 'Muscle Gain',
  activityLevel:   formData.activityLevel   || 'Moderate',
  gymAccess:       formData.gymAccess       || 'Full Gym',
  focusArea:       formData.focusArea       || 'Full Body',
  previousWorkout: formData.previousWorkout || 'Beginner',
  daysAvailable:   formData.daysAvailable   || '6',
  sessionDuration: formData.sessionDuration || '60'
};

// Submit to n8n
const res = await fetch('https://airfitgym.app.n8n.cloud/webhook/airfit-gym-diet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

// After successful submit — update client planStatus to "pending"
const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
const idx = clients.findIndex(c => c.clientId === session.clientId);
if (idx !== -1) {
  clients[idx].planStatus = 'pending';
  clients[idx].submittedAt = Date.now();
  localStorage.setItem('airfit_clients', JSON.stringify(clients));
}

// Navigate to waiting screen
navigate('/client/waiting');
```

---

### Fix 3: Waiting screen with polling hook

```js
// hooks/useClientPlan.js
import { useState, useEffect, useCallback } from 'react';

const POLL_URL = 'https://airfitgym.app.n8n.cloud/webhook/airfit-get-plan';

export function useClientPlan(clientId) {
  const [status, setStatus] = useState('pending'); // 'pending' | 'ready' | 'error'
  const [plan, setPlan]     = useState(null);

  const checkPlan = useCallback(async () => {
    if (!clientId) return;
    try {
      const res  = await fetch(`${POLL_URL}?clientId=${clientId}`);
      const data = await res.json();

      if (data.status === 'ready' && (data.workoutJson || data.dietHtml)) {
        // Save plan to the client's localStorage record
        const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
        const idx = clients.findIndex(c => c.clientId === clientId);
        if (idx !== -1) {
          clients[idx].planStatus  = 'ready';
          clients[idx].workoutPlan = data.workoutJson || null;
          clients[idx].dietPlan    = data.dietHtml    || null;
          clients[idx].planType    = data.planType    || '';
          clients[idx].planReadyAt = data.generatedAt || new Date().toISOString();
          localStorage.setItem('airfit_clients', JSON.stringify(clients));
        }
        setPlan(data);
        setStatus('ready');
        return true;
      }
    } catch(e) {
      console.log('Poll error:', e);
    }
    return false;
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;

    // Check immediately
    checkPlan();

    // Then poll every 30 seconds
    const interval = setInterval(async () => {
      const ready = await checkPlan();
      if (ready) clearInterval(interval);
    }, 30000);

    return () => clearInterval(interval);
  }, [clientId, checkPlan]);

  return { status, plan };
}
```

---

### Fix 4: Waiting screen component

```jsx
// pages/WaitingScreen.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientPlan } from '../hooks/useClientPlan';

export default function WaitingScreen() {
  const navigate   = useNavigate();
  const session    = JSON.parse(localStorage.getItem('airfit_client_session') || '{}');
  const clients    = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
  const client     = clients.find(c => c.clientId === session.clientId) || {};
  const submittedAt = client.submittedAt || Date.now();

  const { status } = useClientPlan(session.clientId);

  // Auto-redirect when plan is ready
  useEffect(() => {
    if (status === 'ready') {
      navigate('/client/plan');
    }
  }, [status, navigate]);

  const WAIT_MS = 65 * 60 * 1000;
  const readyAt = submittedAt + WAIT_MS;

  const [timeLeft, setTimeLeft] = useState(Math.max(0, readyAt - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(Math.max(0, readyAt - Date.now())), 1000);
    return () => clearInterval(t);
  }, [readyAt]);

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  const progress = Math.min(100, ((WAIT_MS - timeLeft) / WAIT_MS) * 100);

  return (
    <div style={{ minHeight:'100vh', background:'#0C0C0C', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ textAlign:'center', maxWidth:'400px', width:'100%' }}>
        {/* Spinner */}
        <div style={{
          width:'72px', height:'72px', borderRadius:'50%', margin:'0 auto 28px',
          border:'3px solid #1a1a1a', borderTop:'3px solid #FF5C1A',
          animation:'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <h2 style={{ color:'#FF5C1A', fontSize:'22px', fontWeight:'800', margin:'0 0 8px' }}>
          🤖 AI Coach is Building Your Plan
        </h2>
        <p style={{ color:'#666', fontSize:'14px', margin:'0 0 32px', lineHeight:'1.6' }}>
          Crafting your 6-day workout with YouTube tutorials for every exercise...
        </p>

        {/* Countdown */}
        <div style={{ background:'#1a1a1a', borderRadius:'12px', padding:'20px 32px', display:'inline-block', marginBottom:'24px' }}>
          <div style={{ color:'#fff', fontSize:'40px', fontWeight:'900', fontFamily:'monospace', letterSpacing:'4px' }}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </div>
          <div style={{ color:'#444', fontSize:'11px', marginTop:'4px', letterSpacing:'1px' }}>REMAINING</div>
        </div>

        {/* Progress bar */}
        <div style={{ background:'#1a1a1a', borderRadius:'4px', height:'6px', margin:'0 auto 16px', maxWidth:'320px' }}>
          <div style={{
            height:'100%', borderRadius:'4px', width:`${progress}%`,
            background:'linear-gradient(90deg,#FF5C1A,#ff8c42)',
            transition:'width 1s linear'
          }} />
        </div>

        <p style={{ color:'#333', fontSize:'12px' }}>
          You can close this tab and come back — your plan will be waiting!
        </p>
      </div>
    </div>
  );
}
```

---

### Fix 5: Workout Plan View — YouTube embeds IN-APP

The key: use `youtube.com/embed/VIDEO_ID` inside an `<iframe>`, never `watch?v=` links.

```jsx
// components/ExerciseCard.jsx
import { useState } from 'react';

export default function ExerciseCard({ exercise, clientId, weekNumber, day }) {
  const progressKey  = `airfit_${clientId}_w${weekNumber}_${day}_${exercise.name}`;
  const [done, setDone]         = useState(localStorage.getItem(progressKey) === 'true');
  const [videoOpen, setVideo]   = useState(false);

  const toggle = () => {
    const next = !done;
    setDone(next);
    localStorage.setItem(progressKey, String(next));
  };

  return (
    <div style={{
      background: done ? '#0a1f12' : '#1a1a1a',
      border: `1px solid ${done ? '#22c55e33' : '#2a2a2a'}`,
      borderRadius:'10px', marginBottom:'10px', overflow:'hidden',
      transition:'all 0.2s'
    }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', padding:'13px 16px', gap:'12px' }}>
        {/* Circular checkbox */}
        <div onClick={toggle} style={{
          width:'22px', height:'22px', borderRadius:'50%', flexShrink:0, cursor:'pointer',
          border:`2px solid ${done ? '#22c55e' : '#3a3a3a'}`,
          background: done ? '#22c55e' : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.15s'
        }}>
          {done && <span style={{ color:'#fff', fontSize:'12px', lineHeight:1 }}>✓</span>}
        </div>

        {/* Name + sets */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            color: done ? '#4b7a5c' : '#f0f0f0', fontWeight:'600', fontSize:'14px',
            textDecoration: done ? 'line-through' : 'none',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
          }}>
            {exercise.name}
          </div>
          <div style={{ color:'#555', fontSize:'12px', marginTop:'3px' }}>
            {exercise.sets} sets × {exercise.reps} reps
          </div>
        </div>

        {/* Watch button */}
        {exercise.videoId && (
          <button onClick={() => setVideo(v => !v)} style={{
            background: videoOpen ? '#FF5C1A' : '#242424',
            color:'#fff', border:'none', borderRadius:'6px',
            padding:'7px 13px', fontSize:'11px', fontWeight:'700',
            cursor:'pointer', letterSpacing:'0.5px', flexShrink:0,
            transition:'background 0.15s'
          }}>
            {videoOpen ? '▼ HIDE' : '▶ WATCH'}
          </button>
        )}
      </div>

      {/* YouTube embed — plays IN APP, zero redirect */}
      {videoOpen && exercise.videoId && (
        <div style={{ padding:'0 16px 14px' }}>
          <iframe
            src={`https://www.youtube.com/embed/${exercise.videoId}?modestbranding=1&rel=0&showinfo=0`}
            width="100%"
            height="200"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius:'8px', display:'block' }}
            title={exercise.videoTitle || exercise.name}
          />
          {exercise.videoTitle && (
            <p style={{ color:'#444', fontSize:'11px', margin:'6px 0 0' }}>
              📺 {exercise.videoTitle} — {exercise.channelName}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Fix 6: Workout Plan page — full day tabs + exercise cards

```jsx
// pages/WorkoutPlanView.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import WeeklyChart from '../components/WeeklyChart';

export default function WorkoutPlanView() {
  const session  = JSON.parse(localStorage.getItem('airfit_client_session') || '{}');
  const clients  = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
  const client   = clients.find(c => c.clientId === session.clientId);

  const workoutJson = client?.workoutPlan;
  const days        = workoutJson?.days || [];

  const [activeDay, setActiveDay]   = useState(0);
  const [activeTab, setActiveTab]   = useState('plan'); // 'plan' | 'progress'
  const weekNumber = 1; // TODO: add week selector

  if (!workoutJson) {
    return (
      <div style={{ minHeight:'100vh', background:'#0C0C0C', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'#444' }}>No workout plan found. Submit a questionnaire first.</p>
      </div>
    );
  }

  const currentDay = days[activeDay];

  // Day completion count
  const getDayCompletion = (day) => {
    const exs = day.exercises || [];
    const done = exs.filter(ex =>
      localStorage.getItem(`airfit_${session.clientId}_w${weekNumber}_${day.day}_${ex.name}`) === 'true'
    ).length;
    return { done, total: exs.length };
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0C0C0C', color:'#fff', fontFamily:'Arial,sans-serif' }}>
      {/* Header */}
      <div style={{ background:'#111', borderBottom:'1px solid #1a1a1a', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <span style={{ color:'#FF5C1A', fontWeight:'900', letterSpacing:'3px', fontSize:'16px' }}>AIRFIT GYM</span>
          <span style={{ color:'#444', fontSize:'12px', marginLeft:'10px' }}>Workout Plan</span>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={() => setActiveTab('plan')} style={{ background: activeTab==='plan' ? '#FF5C1A' : '#1a1a1a', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', cursor:'pointer', fontWeight:activeTab==='plan'?'700':'400' }}>
            📋 Plan
          </button>
          <button onClick={() => setActiveTab('progress')} style={{ background: activeTab==='progress' ? '#FF5C1A' : '#1a1a1a', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', cursor:'pointer', fontWeight:activeTab==='progress'?'700':'400' }}>
            📊 Progress
          </button>
        </div>
      </div>

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'20px 16px' }}>
        {activeTab === 'plan' && (
          <>
            {/* Greeting */}
            {workoutJson.greeting && (
              <p style={{ color:'#FF5C1A', fontWeight:'700', fontSize:'16px', margin:'0 0 6px' }}>{workoutJson.greeting}</p>
            )}
            {workoutJson.overview && (
              <p style={{ color:'#666', fontSize:'13px', margin:'0 0 20px', lineHeight:'1.6' }}>{workoutJson.overview}</p>
            )}

            {/* Day tabs — horizontally scrollable */}
            <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'8px', marginBottom:'20px' }}>
              {days.map((day, i) => {
                const { done, total } = getDayCompletion(day);
                const isComplete = done === total && total > 0;
                return (
                  <button key={i} onClick={() => setActiveDay(i)} style={{
                    background: activeDay===i ? '#FF5C1A' : isComplete ? '#0a1f12' : '#1a1a1a',
                    color: activeDay===i ? '#fff' : isComplete ? '#22c55e' : '#888',
                    border: `1px solid ${activeDay===i ? '#FF5C1A' : isComplete ? '#22c55e33' : '#2a2a2a'}`,
                    borderRadius:'8px', padding:'8px 14px', fontSize:'12px',
                    fontWeight: activeDay===i ? '700' : '400',
                    cursor:'pointer', flexShrink:0, whiteSpace:'nowrap', transition:'all 0.15s'
                  }}>
                    {day.day.slice(0,3).toUpperCase()}
                    {isComplete && ' ✓'}
                    {!isComplete && done > 0 && ` ${done}/${total}`}
                  </button>
                );
              })}
              {/* Sunday rest tab */}
              <button style={{
                background:'#111', color:'#333',
                border:'1px solid #1a1a1a', borderRadius:'8px',
                padding:'8px 14px', fontSize:'12px', cursor:'default', flexShrink:0
              }}>
                SUN 🛌
              </button>
            </div>

            {/* Active day header */}
            <div style={{ background:'linear-gradient(90deg,#FF5C1A,#cc2200)', borderRadius:'8px 8px 0 0', padding:'12px 16px', marginBottom:'2px' }}>
              <span style={{ color:'#fff', fontWeight:'800', fontSize:'15px', letterSpacing:'1px' }}>
                {currentDay?.day?.toUpperCase()}
              </span>
              <span style={{ color:'rgba(255,255,255,0.65)', fontSize:'12px', marginLeft:'10px' }}>
                — {currentDay?.muscle}
              </span>
            </div>

            {/* Day progress bar */}
            {currentDay && (() => {
              const { done, total } = getDayCompletion(currentDay);
              const pct = total > 0 ? Math.round((done/total)*100) : 0;
              return (
                <div style={{ background:'#111', padding:'10px 16px', marginBottom:'12px', borderRadius:'0 0 4px 4px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{ color:'#555', fontSize:'12px' }}>{done}/{total} exercises</span>
                    <span style={{ color: pct===100 ? '#22c55e' : '#FF5C1A', fontSize:'12px', fontWeight:'700' }}>{pct}%</span>
                  </div>
                  <div style={{ height:'4px', background:'#1a1a1a', borderRadius:'2px' }}>
                    <div style={{ height:'100%', borderRadius:'2px', width:`${pct}%`, background: pct===100 ? '#22c55e' : 'linear-gradient(90deg,#FF5C1A,#ff8c42)', transition:'width 0.3s' }} />
                  </div>
                </div>
              );
            })()}

            {/* Exercise cards */}
            {currentDay?.exercises?.map((ex, i) => (
              <ExerciseCard
                key={i}
                exercise={ex}
                clientId={session.clientId}
                weekNumber={weekNumber}
                day={currentDay.day}
              />
            ))}

            {/* Warm-up / Cool-down / Recovery (collapsed sections) */}
            {[
              { label:'🔥 WARM-UP',       color:'#FF5C1A', items: workoutJson.warmup },
              { label:'❄️ COOL-DOWN',      color:'#4488ff', items: workoutJson.cooldown },
              { label:'💤 RECOVERY TIPS', color:'#22c55e', items: workoutJson.recoveryTips },
            ].map(({ label, color, items }) => items?.length ? (
              <div key={label} style={{ background:'#111', borderRadius:'8px', padding:'14px 16px', marginTop:'12px', borderLeft:`3px solid ${color}` }}>
                <p style={{ color, fontSize:'12px', fontWeight:'800', margin:'0 0 8px', letterSpacing:'1px' }}>{label}</p>
                <ul style={{ margin:0, paddingLeft:'16px', color:'#888' }}>
                  {items.map((item, i) => <li key={i} style={{ fontSize:'12px', marginBottom:'4px' }}>{item}</li>)}
                </ul>
              </div>
            ) : null)}
          </>
        )}

        {activeTab === 'progress' && (
          <WeeklyChart
            clientId={session.clientId}
            weekNumber={weekNumber}
            workoutJson={workoutJson}
          />
        )}
      </div>
    </div>
  );
}
```

---

### Fix 7: Weekly progress chart

```jsx
// components/WeeklyChart.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function WeeklyChart({ clientId, weekNumber, workoutJson }) {
  const days = workoutJson?.days || [];

  const data = days.map(d => {
    const exs  = d.exercises || [];
    const done = exs.filter(ex =>
      localStorage.getItem(`airfit_${clientId}_w${weekNumber}_${d.day}_${ex.name}`) === 'true'
    ).length;
    const pct  = exs.length > 0 ? Math.round((done / exs.length) * 100) : 0;
    return { day: d.day.slice(0,3).toUpperCase(), done, total: exs.length, pct };
  });

  const totalDone  = data.reduce((a, d) => a + d.done, 0);
  const totalExs   = data.reduce((a, d) => a + d.total, 0);
  const totalPct   = totalExs > 0 ? Math.round((totalDone / totalExs) * 100) : 0;
  const streak     = (() => {
    let s = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].pct === 100) s++; else break;
    }
    return s;
  })();

  const getColor = pct => pct === 100 ? '#22c55e' : pct >= 50 ? '#FF5C1A' : '#2a2a2a';

  return (
    <div>
      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'20px' }}>
        {[
          { label:'Done This Week', value:`${totalDone} / ${totalExs}`, color:'#FF5C1A' },
          { label:'Completion',     value:`${totalPct}%`,               color: totalPct===100?'#22c55e':'#FF5C1A' },
          { label:'Current Streak', value:`${streak} days 🔥`,          color:'#ff8c42' },
          { label:'Best Day',       value: data.reduce((a,d)=>d.done>a.done?d:a, data[0])?.day || '—', color:'#4488ff' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'#111', borderRadius:'10px', padding:'16px', border:'1px solid #1a1a1a' }}>
            <div style={{ color:'#444', fontSize:'11px', marginBottom:'6px', letterSpacing:'1px', textTransform:'uppercase' }}>{label}</div>
            <div style={{ color, fontSize:'20px', fontWeight:'800' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background:'#111', borderRadius:'12px', padding:'20px', border:'1px solid #1a1a1a' }}>
        <p style={{ color:'#888', fontSize:'12px', fontWeight:'700', margin:'0 0 16px', letterSpacing:'1px' }}>
          📊 THIS WEEK
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barSize={28} margin={{ top:0, right:0, bottom:0, left:-20 }}>
            <XAxis dataKey="day" tick={{ fill:'#444', fontSize:12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0,100]} hide />
            <Tooltip
              formatter={(val, _, props) => [`${props.payload.done}/${props.payload.total} exercises`]}
              contentStyle={{ background:'#0d0d0d', border:'1px solid #2a2a2a', borderRadius:'8px', color:'#fff', fontSize:'12px' }}
              cursor={{ fill:'rgba(255,255,255,0.02)' }}
            />
            <Bar dataKey="pct" radius={[4,4,0,0]}>
              {data.map((entry, i) => <Cell key={i} fill={getColor(entry.pct)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:'16px', marginTop:'12px', justifyContent:'center' }}>
          {[['#22c55e','Complete'],['#FF5C1A','In Progress'],['#2a2a2a','Not Started']].map(([c,l]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:c }} />
              <span style={{ color:'#444', fontSize:'11px' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Fix 8: Client login (phone only) — ensure this works

```jsx
// pages/ClientLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClientLogin() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    const raw     = phone.trim().replace(/\s+/g, '');
    const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
    
    // Try matching phone with or without country code
    const client = clients.find(c =>
      c.phone?.trim().replace(/\s+/g,'') === raw ||
      c.phone?.trim().replace(/\s+/g,'').endsWith(raw) ||
      raw.endsWith(c.phone?.trim().replace(/\s+/g,''))
    );

    if (!client) {
      setError('No account found with this phone number. Contact your gym admin.');
      return;
    }

    // Save session
    localStorage.setItem('airfit_client_session', JSON.stringify({
      clientId: client.clientId,
      name:     client.name,
      email:    client.email,
      phone:    client.phone
    }));

    // Route based on plan status
    if (client.planStatus === 'ready') {
      navigate('/client/plan');
    } else if (client.planStatus === 'pending') {
      navigate('/client/waiting');
    } else {
      navigate('/client/dashboard');
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0C0C0C', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'380px' }}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <h1 style={{ color:'#FF5C1A', letterSpacing:'6px', fontWeight:'900', fontSize:'24px', margin:'0 0 8px' }}>AIRFIT GYM</h1>
          <p style={{ color:'#444', fontSize:'13px', margin:0 }}>Client Training Portal</p>
        </div>

        <div style={{ background:'#111', borderRadius:'14px', padding:'28px', border:'1px solid #1a1a1a' }}>
          <p style={{ color:'#888', fontSize:'13px', margin:'0 0 20px', textAlign:'center' }}>
            Enter your registered phone number to login
          </p>

          <input
            type="tel"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="e.g. 9876543210"
            style={{
              width:'100%', background:'#0d0d0d', border:'1px solid #2a2a2a',
              borderRadius:'8px', padding:'12px 14px', color:'#fff', fontSize:'15px',
              outline:'none', boxSizing:'border-box', marginBottom:'6px',
              fontFamily:'monospace', letterSpacing:'2px'
            }}
          />

          {error && <p style={{ color:'#ef4444', fontSize:'12px', margin:'0 0 12px' }}>{error}</p>}

          <button onClick={handleLogin} style={{
            width:'100%', background:'linear-gradient(90deg,#FF5C1A,#cc3300)',
            color:'#fff', border:'none', borderRadius:'8px', padding:'13px',
            fontSize:'14px', fontWeight:'800', cursor:'pointer', marginTop:'8px',
            letterSpacing:'1px'
          }}>
            ENTER PORTAL →
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Fix 9: React Router — add missing routes

```jsx
// App.jsx — ensure these routes exist
import WaitingScreen   from './pages/WaitingScreen';
import WorkoutPlanView from './pages/WorkoutPlanView';

// Add inside <Routes>:
<Route path="/client/waiting" element={<ProtectedClient><WaitingScreen /></ProtectedClient>} />
<Route path="/client/plan"    element={<ProtectedClient><WorkoutPlanView /></ProtectedClient>} />
```

---

## PART 3 — COMPLETE DATA FLOW (how it all connects)

```
ADMIN adds client
  → saves to localStorage airfit_clients[]
  → sends invite email via n8n /airfit-invite webhook
  → email says: "Login at https://workoutplanairfit.vercel.app/client/login
                 Your phone: 9876543210"

CLIENT opens link → ClientLogin page
  → enters phone → found in localStorage
  → session saved → goes to /client/dashboard

CLIENT fills Workout Questionnaire (multi-step form)
  → POST to https://airfitgym.app.n8n.cloud/webhook/airfit-gym-diet
  → body includes: clientId, phone, name, goal, etc.
  → localStorage: client.planStatus = "pending"
  → navigate to /client/waiting

WAITING SCREEN polls every 30s:
  → GET https://airfitgym.app.n8n.cloud/webhook/airfit-get-plan?clientId=xxx
  → n8n responds { status: "pending" }  (60 min processing)

n8n Workflow 1 (after 60 min):
  → Gemini generates 6-day plan JSON
  → YouTube API finds video per exercise
  → Enriched workoutJson (each exercise has videoId, videoTitle, etc.)
  → POSTs to https://airfitgym.app.n8n.cloud/webhook/airfit-plan-ready

n8n Workflow 2:
  → /airfit-plan-ready stores plan in static data by clientId
  → /airfit-get-plan returns plan when polled

WAITING SCREEN poll returns { status: "ready", workoutJson: {...} }
  → saves workoutJson to localStorage airfit_clients[]
  → client.planStatus = "ready"
  → auto-redirects to /client/plan

CLIENT sees full plan:
  → 6 day tabs (MON-SAT + SUN REST)
  → per exercise: name + sets/reps + checkbox + ▶ WATCH button
  → ▶ WATCH expands YouTube iframe (plays IN APP, no redirect)
  → checking exercises updates progress in real time
  → recharts bar chart shows weekly completion by day
```

---

## PART 4 — CHECKLIST BEFORE GOING LIVE

- [ ] Import `airfit_workflow1_plan_generator.json` into n8n, activate it
- [ ] Import `airfit_workflow2_plan_store.json` into n8n as a NEW workflow, activate it
- [ ] Create the simple 3-node invite email workflow in n8n (path: `airfit-invite`)
- [ ] Update `APP_URL` constant everywhere to `https://workoutplanairfit.vercel.app`
- [ ] Verify client login works with a test phone number
- [ ] Test full flow: add client → login → submit form → wait screen polls → plan appears
- [ ] Confirm YouTube iframes load (check iframe allow policy in your host's CSP headers)
- [ ] Deploy to Vercel

---

## PART 5 — IMPORTANT NOTES

**localStorage is single-device.** Admin must use the same browser/device that clients registered on.
For multi-device production use, replace localStorage with a real DB (Supabase free tier is ideal).

**YouTube quota:** The YT Data API has 10,000 units/day free. Each exercise search = 100 units.
30 exercises = 3,000 units per plan. You can generate ~3 plans/day on the free quota.
To increase: create additional Google Cloud projects with separate API keys and rotate them.

**n8n static data** persists until the workflow is deleted or manually cleared.
It is NOT a database — for production, add a Supabase/Airtable node to store plans permanently.

**CORS:** The n8n webhooks already return `Access-Control-Allow-Origin: *` headers.
If you still get CORS errors, add this to your Vercel project's `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [{ "key": "Content-Security-Policy", "value": "frame-src 'self' https://www.youtube.com https://youtube.com;" }]
    }
  ]
}
```