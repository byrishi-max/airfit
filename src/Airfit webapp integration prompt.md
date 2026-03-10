# AIRFIT GYM — Full Web App Integration Prompt
# Drop this into your existing AirfitGym React codebase

---

## CONTEXT

I have an existing React web app called **AirfitGym** (AirfitGym.jsx) that currently:
- Has a multi-step form collecting client fitness details
- Submits to an n8n webhook: `https://airfitgym.app.n8n.cloud/webhook/airfit-gym-diet`
- n8n backend uses Gemini AI to generate a 6-day workout plan with YouTube links per exercise
- The plan is currently emailed to the client — I want to REMOVE email delivery and show the plan IN the web app instead

## WHAT I NEED BUILT

Build a complete full-stack React SPA with these exact features. Use React + localStorage for state (no backend needed beyond the existing n8n webhook). Use Tailwind utility classes only. Use dark theme matching existing brand: `#0C0C0C` base, `#FF5C1A` orange accent, `#1A1A1A` cards.

---

## 1. AUTH SYSTEM (two roles)

### Admin Login
- Route: `/admin/login`
- Simple hardcoded password check: password = `airfitadmin2025`
- On success → redirect to `/admin/dashboard`
- Store session in localStorage key `airfit_admin_session`

### Client Login  
- Route: `/client/login`
- Login with **phone number only** (no password)
- Look up phone number in localStorage key `airfit_clients` (array of client objects)
- If found → redirect to `/client/dashboard/:clientId`
- If not found → show error "No account found. Contact your gym admin."
- Store session in localStorage key `airfit_client_session` = `{ clientId, name, phone }`

---

## 2. ADMIN DASHBOARD (`/admin/dashboard`)

### Header
- "AIRFIT GYM" logo left, "Admin Panel" badge, Logout button right

### Add Client Panel
A form with these fields:
- **Name** (text)
- **Email** (email) 
- **Phone Number** (tel) — this becomes their login credential
- **[Add Client]** button

On submit:
1. Generate a unique `clientId` = `"client_" + Date.now()`
2. Save client to localStorage `airfit_clients` array:
```json
{
  "clientId": "client_1234567890",
  "name": "Kevin Paul",
  "email": "kevin@example.com",
  "phone": "9876543210",
  "status": "invited",
  "planStatus": "none",
  "workoutPlan": null,
  "dietPlan": null,
  "progress": {},
  "createdAt": "ISO date string"
}
```
3. Show success toast: "Client added! Invite sent to kevin@example.com"
4. (Optional) Send invite email via n8n — make a POST to `https://airfitgym.app.n8n.cloud/webhook/airfit-gym-diet` with body `{ type: "invite", name, email, phone, clientId, appUrl: window.location.origin + "/client/login" }` — n8n can handle this separately

### Client List Table
Columns: Name | Phone | Email | Plan Status | Actions

Plan Status badges:
- `none` → grey "No Plan"
- `pending` → yellow "Generating..."  
- `ready` → green "Plan Ready"

Actions column: **[View Plan]** button → opens a modal showing the client's full workout plan

### Client Plan Modal
When admin clicks View Plan for a client:
- Shows the full workout HTML plan in a scrollable dark modal
- Shows progress stats: X/30 exercises completed this week

---

## 3. CLIENT PORTAL — Landing (`/client/login`)

Dark full-screen page, brand styling.
- "AIRFIT GYM" header
- Subtitle: "Your Personal Training Portal"
- Phone number input field
- "Enter Portal" button
- Small text: "Login with the phone number you registered with"

---

## 4. CLIENT DASHBOARD (`/client/dashboard`)

After client logs in, show their dashboard.

### If client has NO plan yet (`planStatus === "none"`):

Show a welcome card:
- "Welcome, [Name]! 👋"
- Two option cards side by side:
  - **"Get Diet Plan"** (fork icon) — clicking opens the diet plan questionnaire form
  - **"Get Workout Plan"** (dumbbell icon) — clicking opens the workout plan questionnaire form

### Questionnaire Forms

**Workout Plan Form** (multi-step, matching existing AirfitGym.jsx style):
Steps:
1. Goal — Training Goal (dropdown: Muscle Gain, Fat Loss, Strength, Endurance, Toning)
2. About — Current Fitness Level (dropdown: Beginner / Intermediate / Advanced)
3. Access — Gym Access (dropdown: Full Gym / Home / Bodyweight Only)
4. Schedule — Days Available (1-6 slider) + Session Duration (30/45/60/90 min)
5. Details — Injuries or limitations (text), Previous Training (text), Focus Area (dropdown: Full Body / Upper Body / Lower Body / Core)
6. Confirm — Summary of all answers + "Generate My Plan" button

On final submit, POST to `https://airfitgym.app.n8n.cloud/webhook/airfit-gym-diet` with body:
```json
{
  "planType": "Workout Plan",
  "clientId": "client_xxx",
  "name": "Kevin Paul",
  "email": "kevin@example.com",
  "gender": "Male",
  "age": "22",
  "height": "175",
  "weight": "72",
  "goal": "Muscle Gain",
  "activityLevel": "Moderate",
  "gymAccess": "Full Gym",
  "focusArea": "Upper Body",
  "previousWorkout": "Beginner",
  "daysAvailable": "6",
  "sessionDuration": "60"
}
```

After submitting:
1. Set client's `planStatus = "pending"` in localStorage
2. Show a **countdown/waiting screen**:
   - Animated progress bar
   - Text: "🤖 Your AI coach is crafting your personalized plan..."
   - Subtext: "This takes about 60 minutes. You can leave and come back!"
   - Show estimated ready time: current time + 65 minutes
3. Poll localStorage every 10 seconds for `planStatus === "ready"`
4. When plan arrives → auto-transition to the Plan View

**Diet Plan Form**: Similar multi-step form collecting:
- Goal, Diet Preference (Veg/Non-veg/Vegan), Food Culture (Indian/Western/etc), Meals Per Day, Allergies, Wake-up Time

---

## 5. n8n WEBHOOK RESPONSE HANDLER

The n8n workflow currently emails the plan. We need it to instead **save the plan back to the web app**.

Add a new webhook endpoint in the existing n8n workflow (or a separate workflow) that:
1. Receives the completed plan JSON
2. The web app polls for the plan

**Implementation**: Instead of modifying n8n, use this polling approach:

In the web app, after submitting the form:
- Save `{ planStatus: "pending", submittedAt: Date.now() }` to the client object
- The n8n **Build Email** node currently sends an email. We will ALSO have n8n POST the plan back to a second webhook endpoint that updates a shared "plan store"

**Add this to n8n Build Email node** (append to existing code):
```js
// Also store plan for web app retrieval
// POST to a storage webhook with the plan data
const planData = {
  clientId: data.clientId || '',
  planHtml: data.planHtml || '',
  planType: data.planType || '',
  generatedAt: new Date().toISOString()
};
// n8n will handle delivery — web app polls this endpoint
```

**Web App Polling**: Every 30 seconds, make a GET request to:
`https://airfitgym.app.n8n.cloud/webhook/get-plan?clientId=CLIENT_ID`

This requires a second n8n workflow. Alternatively, use **localStorage with a cross-tab broadcast** approach:

Since this is a single-device app, simplest approach:
- After the n8n workflow finishes, it posts the plan HTML back to a webhook
- Web app polls: `GET https://airfitgym.app.n8n.cloud/webhook/airfit-get-plan?clientId=xxx`
- n8n responds with `{ planHtml, planType, generatedAt }` from an in-memory store

**SIMPLEST IMPLEMENTATION** (no second n8n workflow needed):
- Modify the existing n8n workflow's **final node** to POST plan data to:
  `https://airfitgym.app.n8n.cloud/webhook/airfit-plan-ready`
  with body: `{ clientId, planHtml, planType, workoutJson }`
- Store this in n8n's workflow static data
- Add a GET webhook `/airfit-get-plan` that returns stored plan by clientId

---

## 6. WORKOUT PLAN VIEW (the main feature)

When `planStatus === "ready"`, show the full workout plan dashboard.

### Plan Header
- "YOUR 6-DAY WORKOUT PLAN" title
- Client name + plan generated date
- Week selector: "Week 1 / Week 2 / Week 3 / Week 4" tabs (progress resets per week)

### Day Tabs
Horizontal scrollable tabs: MON | TUE | WED | THU | FRI | SAT | SUN(REST)

### Exercise Cards (per active day tab)
For each exercise show a card:

```
┌─────────────────────────────────────────────┐
│ Barbell Bench Press          [✓ checkbox]   │
│ 4 sets × 8-10 reps                          │
│ ─────────────────────────────────────────── │
│ ┌───────────────────────────────────────┐   │
│ │  [YOUTUBE EMBED PLAYER - in-app]      │   │
│ │  iframe: youtube.com/embed/VIDEO_ID   │   │
│ │  (no redirect, plays in app)          │   │
│ └───────────────────────────────────────┘   │
│ ▶ Jeff Nippard — "How to Bench Press"       │
└─────────────────────────────────────────────┘
```

**YouTube embed** (plays in app, no redirect):
```jsx
<iframe
  src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
  width="100%"
  height="200"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  style={{ borderRadius: '8px' }}
/>
```

### Checkbox Completion
- Each exercise has a checkbox
- When checked → mark exercise as complete in localStorage:
  ```
  airfit_progress_{clientId}_{weekNumber}_{day}_{exerciseName} = true
  ```
- Checked exercises show with strikethrough text + green checkmark
- Show day completion: "3 / 5 exercises done" progress bar under day tab

### Sunday Rest Day
Special card: "🛌 Rest & Recovery Day" with recovery tips

---

## 7. PROGRESS TRACKING DASHBOARD

A tab in the client dashboard called "Progress" showing:

### Weekly Completion Graph
Use **recharts** `BarChart` — import from 'recharts':
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
```

Data structure:
```js
const data = [
  { day: 'Mon', completed: 5, total: 5 },
  { day: 'Tue', completed: 3, total: 5 },
  { day: 'Wed', completed: 0, total: 5 },
  { day: 'Thu', completed: 5, total: 5 },
  { day: 'Fri', completed: 2, total: 5 },
  { day: 'Sat', completed: 0, total: 5 },
]
```

Bar colors:
- 100% complete → `#22c55e` (green)
- 50%+ complete → `#FF5C1A` (orange) 
- Less than 50% → `#374151` (grey)

### Stats Row (4 cards)
- **Total Exercises Done** this week: X / 30
- **Streak**: X days in a row
- **Best Day**: Day with most completions
- **Completion Rate**: X%

### Weekly History (past 4 weeks)
Line chart showing completion % per week over time.

---

## 8. ROUTING STRUCTURE

```
/                          → redirect to /client/login
/admin/login               → Admin login page
/admin/dashboard           → Admin dashboard (protected)
/client/login              → Client phone login
/client/dashboard          → Client home (protected)
/client/plan               → Workout plan view (protected)
/client/progress           → Progress tracking (protected)
```

Use React Router v6 (`react-router-dom`).

Protected routes: if no session in localStorage → redirect to login.

---

## 9. PARSE PLAN HTML INTO STRUCTURED DATA

The n8n workflow returns `planHtml` (HTML string) and `workoutJson` (structured JSON).

**Always request `workoutJson` from n8n** — it's already in the workflow output.

Parse `workoutJson` in the React app:
```js
// workoutJson structure (already generated by n8n):
{
  greeting: "Hi Kevin!...",
  overview: "This 6-day plan...",
  days: [
    {
      day: "Monday",
      muscle: "Chest & Triceps",
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: "4",
          reps: "8-10",
          videoId: "hWbUlkb5Ms4",       // ← from YouTube API
          videoUrl: "https://youtube.com/watch?v=hWbUlkb5Ms4",
          videoTitle: "How To Bench Press...",
          thumb: "https://i.ytimg.com/..."
        }
      ]
    }
  ],
  warmup: [...],
  cooldown: [...],
  recoveryTips: [...]
}
```

**IMPORTANT**: The n8n workflow already builds this structure in `Rebuild Workout Plan` node. Make the webhook also return `workoutJson` alongside `planHtml`.

---

## 10. n8n CHANGES NEEDED

### Change 1: Accept `clientId` from webhook
In **Build Gemini Prompt** node, add to the returned object:
```js
clientId: body.clientId || ''
```

### Change 2: Pass `clientId` and `workoutJson` all the way through
In every Code node that passes data forward, add `clientId` to the json fields.

### Change 3: Change final delivery from email to webhook POST
Replace (or supplement) the **Send Email** node with an **HTTP Request** node that POSTs to:
`https://airfitgym.app.n8n.cloud/webhook/airfit-plan-ready`

Body:
```json
{
  "clientId": "{{ clientId }}",
  "planHtml": "{{ planHtml }}",
  "planType": "{{ planType }}",
  "workoutJson": "{{ workoutJson }}",
  "generatedAt": "{{ new Date().toISOString() }}"
}
```

### Change 4: Add GET webhook for polling
New n8n workflow with:
- **Webhook Trigger** (GET) path: `airfit-get-plan` 
- **Code node** that reads from workflow static data by `clientId`
- **Respond to Webhook** with the plan data

Static data storage in n8n Code node:
```js
// Store plan
const store = $getWorkflowStaticData('global');
store[body.clientId] = { planHtml, workoutJson, planType, generatedAt };

// Retrieve plan  
const store = $getWorkflowStaticData('global');
const plan = store[query.clientId];
return [{ json: plan || { error: 'not ready' } }];
```

---

## 11. COMPONENT FILE STRUCTURE

```
src/
  pages/
    AdminLogin.jsx
    AdminDashboard.jsx
    ClientLogin.jsx
    ClientDashboard.jsx
    WorkoutPlanView.jsx
    ProgressDashboard.jsx
  components/
    ExerciseCard.jsx       ← card with YouTube embed + checkbox
    DayTabs.jsx            ← MON-SUN tab switcher
    ProgressBar.jsx        ← per-day completion bar
    WeeklyBarChart.jsx     ← recharts bar chart
    PlanWaitingScreen.jsx  ← animated waiting with countdown
    AdminClientTable.jsx   ← client list with status badges
    WorkoutQuestionnaire.jsx ← multi-step form
    DietQuestionnaire.jsx
  hooks/
    useAuth.js             ← reads localStorage session
    useClientPlan.js       ← polls for plan readiness
    useProgress.js         ← reads/writes exercise checkboxes
  utils/
    storage.js             ← localStorage helpers
    planParser.js          ← parses workoutJson into React state
```

---

## 12. EXACT YOUTUBE EMBED IMPLEMENTATION

This is critical — videos must play IN the app, zero redirect to YouTube:

```jsx
// ExerciseCard.jsx
function ExerciseCard({ exercise, clientId, weekNumber, day }) {
  const progressKey = `airfit_progress_${clientId}_w${weekNumber}_${day}_${exercise.name}`;
  const [completed, setCompleted] = useState(
    localStorage.getItem(progressKey) === 'true'
  );
  const [videoExpanded, setVideoExpanded] = useState(false);

  const toggleComplete = () => {
    const next = !completed;
    setCompleted(next);
    localStorage.setItem(progressKey, String(next));
  };

  return (
    <div style={{
      background: completed ? '#0d2818' : '#1a1a1a',
      border: `1px solid ${completed ? '#22c55e' : '#2a2a2a'}`,
      borderRadius: '10px',
      marginBottom: '12px',
      overflow: 'hidden',
      transition: 'all 0.2s'
    }}>
      {/* Exercise header row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
        {/* Checkbox */}
        <div
          onClick={toggleComplete}
          style={{
            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
            border: `2px solid ${completed ? '#22c55e' : '#444'}`,
            background: completed ? '#22c55e' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {completed && <span style={{ color: '#fff', fontSize: '13px' }}>✓</span>}
        </div>

        {/* Exercise info */}
        <div style={{ flex: 1 }}>
          <div style={{
            color: completed ? '#6b7280' : '#f0f0f0',
            fontWeight: '600', fontSize: '14px',
            textDecoration: completed ? 'line-through' : 'none'
          }}>
            {exercise.name}
          </div>
          <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
            {exercise.sets} sets × {exercise.reps} reps
          </div>
        </div>

        {/* Video toggle button */}
        {exercise.videoId && (
          <button
            onClick={() => setVideoExpanded(v => !v)}
            style={{
              background: videoExpanded ? '#FF5C1A' : '#2a2a2a',
              color: '#fff', border: 'none', borderRadius: '6px',
              padding: '6px 12px', fontSize: '11px', fontWeight: '700',
              cursor: 'pointer', letterSpacing: '0.5px', whiteSpace: 'nowrap'
            }}
          >
            {videoExpanded ? '▼ HIDE' : '▶ WATCH'}
          </button>
        )}
      </div>

      {/* YouTube embed — in-app, no redirect */}
      {videoExpanded && exercise.videoId && (
        <div style={{ padding: '0 16px 14px' }}>
          <iframe
            src={`https://www.youtube.com/embed/${exercise.videoId}?modestbranding=1&rel=0&showinfo=0`}
            width="100%"
            height="210"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ borderRadius: '8px', display: 'block' }}
            title={exercise.videoTitle || exercise.name}
          />
          {exercise.videoTitle && (
            <div style={{ color: '#555', fontSize: '11px', marginTop: '6px' }}>
              📺 {exercise.videoTitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 13. PROGRESS BAR PER DAY

```jsx
function DayProgress({ clientId, weekNumber, day, exercises }) {
  const completed = exercises.filter(ex => 
    localStorage.getItem(`airfit_progress_${clientId}_w${weekNumber}_${day}_${ex.name}`) === 'true'
  ).length;
  const total = exercises.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: '#888', fontSize: '12px' }}>{completed}/{total} exercises</span>
        <span style={{ color: pct === 100 ? '#22c55e' : '#FF5C1A', fontSize: '12px', fontWeight: '700' }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: '4px', background: '#2a2a2a', borderRadius: '2px' }}>
        <div style={{
          height: '100%', borderRadius: '2px',
          width: `${pct}%`,
          background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg, #FF5C1A, #ff8c42)',
          transition: 'width 0.4s ease'
        }} />
      </div>
    </div>
  );
}
```

---

## 14. WAITING SCREEN WITH COUNTDOWN

```jsx
function PlanWaitingScreen({ submittedAt }) {
  const WAIT_MS = 65 * 60 * 1000; // 65 minutes
  const readyAt = submittedAt + WAIT_MS;
  const [timeLeft, setTimeLeft] = useState(Math.max(0, readyAt - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      const remaining = Math.max(0, readyAt - Date.now());
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(t);
  }, [readyAt]);

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  const progress = Math.min(100, ((WAIT_MS - timeLeft) / WAIT_MS) * 100);

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      {/* Animated spinner */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        border: '3px solid #2a2a2a', borderTop: '3px solid #FF5C1A',
        animation: 'spin 1s linear infinite', margin: '0 auto 24px'
      }} />
      <h2 style={{ color: '#FF5C1A', fontSize: '22px', fontWeight: '800', margin: '0 0 8px' }}>
        🤖 Your AI Coach is Working...
      </h2>
      <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px' }}>
        Crafting your personalized 6-day plan with YouTube tutorials for every exercise
      </p>
      {/* Countdown */}
      <div style={{
        background: '#1a1a1a', borderRadius: '12px', padding: '20px 32px',
        display: 'inline-block', marginBottom: '24px'
      }}>
        <div style={{ color: '#fff', fontSize: '36px', fontWeight: '900', fontFamily: 'monospace' }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <div style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>remaining</div>
      </div>
      {/* Progress bar */}
      <div style={{ maxWidth: '320px', margin: '0 auto' }}>
        <div style={{ height: '6px', background: '#2a2a2a', borderRadius: '3px' }}>
          <div style={{
            height: '100%', borderRadius: '3px', width: `${progress}%`,
            background: 'linear-gradient(90deg, #FF5C1A, #ff8c42)',
            transition: 'width 1s linear'
          }} />
        </div>
        <p style={{ color: '#444', fontSize: '11px', marginTop: '8px' }}>
          You can close this tab and come back. Your plan will be ready!
        </p>
      </div>
    </div>
  );
}
```

---

## 15. RECHARTS WEEKLY PROGRESS BAR CHART

```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function WeeklyChart({ clientId, weekNumber, workoutJson }) {
  const days = workoutJson?.days || [];
  
  const data = days.map(d => {
    const exs = d.exercises || [];
    const completed = exs.filter(ex =>
      localStorage.getItem(`airfit_progress_${clientId}_w${weekNumber}_${d.day}_${ex.name}`) === 'true'
    ).length;
    return {
      day: d.day.slice(0, 3).toUpperCase(),
      completed,
      total: exs.length,
      pct: exs.length > 0 ? Math.round((completed / exs.length) * 100) : 0
    };
  });

  const getColor = (pct) => {
    if (pct === 100) return '#22c55e';
    if (pct >= 50) return '#FF5C1A';
    return '#2a2a2a';
  };

  return (
    <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px' }}>
      <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: '700', margin: '0 0 20px' }}>
        📊 This Week's Progress
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={32}>
          <XAxis
            dataKey="day"
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[0, 100]} hide
          />
          <Tooltip
            formatter={(val, name, props) => [`${props.payload.completed}/${props.payload.total}`, 'Done']}
            contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.pct)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 16. FULL APP ENTRY POINT

```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ClientLogin from './pages/ClientLogin';
import ClientDashboard from './pages/ClientDashboard';

function ProtectedAdmin({ children }) {
  const session = localStorage.getItem('airfit_admin_session');
  return session ? children : <Navigate to="/admin/login" replace />;
}

function ProtectedClient({ children }) {
  const session = localStorage.getItem('airfit_client_session');
  return session ? children : <Navigate to="/client/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/client/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedAdmin><AdminDashboard /></ProtectedAdmin>
        } />
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/client/dashboard" element={
          <ProtectedClient><ClientDashboard /></ProtectedClient>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 17. KEY BEHAVIORS SUMMARY

| Behavior | Implementation |
|---|---|
| Client login | Phone number → lookup in localStorage `airfit_clients` |
| Plan submission | POST to n8n webhook with `clientId` |
| Plan waiting | Countdown timer + poll localStorage every 30s |
| Plan delivery | n8n POSTs to `/airfit-plan-ready` → saved to localStorage by clientId |
| Plan display | Parse `workoutJson` → day tabs → exercise cards |
| YouTube videos | `<iframe src="youtube.com/embed/VIDEO_ID">` — in-app, no redirect |
| Exercise completion | localStorage key per exercise, updates chart in real time |
| Progress chart | recharts BarChart — green=100%, orange=50%+, grey=<50% |
| Admin view | Can see all clients + their plan + progress |
| Sunday | Special rest card shown automatically |

---

## 18. n8n WORKFLOW MODIFICATION (final step)

After building the web app, modify the existing n8n workflow one final time:

In the **Build Email** node, change it to **Build Plan Response**:
- Remove email HTML building
- Instead return clean JSON:
```js
return [{ json: {
  clientId: data.clientId,
  planType: data.planType,
  workoutJson: data.workoutJson,  // structured with videoId per exercise
  generatedAt: new Date().toISOString()
}}];
```

Replace **Send Email** node with **HTTP Request** node:
- Method: POST
- URL: `https://airfitgym.app.n8n.cloud/webhook/airfit-plan-ready`
- Body: `={{ JSON.stringify($json) }}`
- contentType: raw/json

Add a second **n8n workflow** (2 nodes only):
1. **Webhook** (POST) path: `airfit-plan-ready`
   - Receives plan from first workflow
   - Stores in static data: `$getWorkflowStaticData('global')[body.clientId] = body`
   - Responds: `{ success: true }`

2. **Webhook** (GET) path: `airfit-get-plan`
   - Query param: `clientId`
   - Returns: `$getWorkflowStaticData('global')[query.clientId] || { status: "pending" }`

Web app polling code:
```js
// useClientPlan.js hook
async function checkPlanReady(clientId) {
  try {
    const res = await fetch(
      `https://airfitgym.app.n8n.cloud/webhook/airfit-get-plan?clientId=${clientId}`
    );
    const data = await res.json();
    if (data.workoutJson) {
      // Plan ready! Save to localStorage
      const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
      const idx = clients.findIndex(c => c.clientId === clientId);
      if (idx !== -1) {
        clients[idx].workoutPlan = data.workoutJson;
        clients[idx].planStatus = 'ready';
        localStorage.setItem('airfit_clients', JSON.stringify(clients));
      }
      return true;
    }
  } catch(e) {}
  return false;
}
```

---

**That's the complete integration.** Build each component file separately, wire up the routes, and the existing n8n backend handles all AI generation. The web app is purely React + localStorage + recharts.