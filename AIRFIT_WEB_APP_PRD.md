# AirFit Web App Initiative, Technical Summary, And PRD

Last updated: 2026-06-20

## 1. Initiative Of The Web App

AirFit is a gym client portal and admin automation system for delivering personalized workout plans, diet plans, exercise videos, progress tracking, and client communication at scale.

The initiative is to reduce manual coaching/admin work for the gym while giving each client a simple phone-based portal where they can:

- log in from any device;
- generate and view a one-week reusable workout template;
- generate and view a diet plan;
- watch short exercise tutorial videos;
- mark exercises and training days complete;
- track progress, streaks, calories, and monthly completion;
- receive portal invite and plan-ready emails.

The app is intended to support roughly 400 gym clients. That makes API quota management, workflow reliability, data persistence, and email deliverability core production requirements, not optional improvements.

## 2. Product Vision

AirFit should behave like a lightweight digital coaching system:

- Admins add gym clients once with name, email, and phone number.
- Clients log in with phone number, generate their plan, and access it from mobile/laptop using the portal URL.
- A single generated workout week repeats across the month while tracking each calendar repeat separately.
- The client dashboard is the home base for workout plan, diet plan, progress analytics, calorie logging, and logout.
- n8n handles AI generation, YouTube video lookup, plan storage, and emails.
- Supabase provides persistent cross-device client/progress/calorie data.

## 3. Live System

- Production app: `https://airfitworkout.vercel.app`
- Client login: `https://airfitworkout.vercel.app/client/login`
- Admin login: `https://airfitworkout.vercel.app/admin/login`
- n8n webhook base: `https://airfitplangen.duckdns.org/webhook`
- Primary production host: Vercel
- n8n workflow exports in repo:
  - `wf_maiz82IchPuO1an9.json` - plan generator
  - `wf_N7ujfqztm0xMe1Iu.json` - plan/client store
  - `wf_5WJMgjRnuIJVdA3h.json` - invite and plan-ready email

## 4. Tech Stack

### Frontend

- React `19.2.4`
- Create React App / `react-scripts`
- React Router `7.13.1`
- React Helmet Async
- Lucide React icons
- Recharts for analytics charts
- Framer Motion available for animation
- CSS via `src/index.css`, CRA styles, and component-level inline styles
- Browser `localStorage` as compatibility fallback/session storage

### Backend And Automation

- n8n workflows exposed through production webhooks
- Gemini API call inside n8n for AI workout/diet generation
- YouTube Data API inside n8n for short exercise videos
- Gmail node in n8n for client emails
- Supabase REST API for persistent clients, plans, progress, and calories

### Deployment And Hosting

- Vercel production deployment
- `vercel.json` for SPA rewrites and headers
- Netlify config exists, but Vercel is the active production route

## 5. Repository Structure

```text
public/
  index.html                 CRA HTML shell
  gym-hero-bg.png            visual asset

src/
  index.js                   CRA React entry point
  App.js                     route tree and auth guards
  index.css                  shared app styling

  pages/
    AdminLogin.jsx           admin login
    AdminDashboard.jsx       add/list clients
    ClientLogin.jsx          phone-based client login
    ClientDashboard.jsx      client home/dashboard
    WaitingScreen.jsx        plan generation polling/wait screen
    WorkoutPlanView.jsx      workout, diet, calorie portal
    ProgressDashboard.jsx    analytics/progress screen

  components/
    Questionnaire.jsx        workout/diet questionnaire
    ExerciseCard.jsx         exercise card with YouTube embed
    CalorieTracker.jsx       calorie logging UI
    WeeklyBarChart.jsx       weekly analytics chart
    AdminClientTable.jsx     admin client list

  hooks/
    useAuth.js               admin/client session hooks
    useClientPlan.js         plan polling/sync hook
    useDayProgress.js        exercise/day progress hook
    useProgress.js           progress state helper

  utils/
    config.js                n8n endpoint URLs
    supabaseClient.js        Supabase REST helper
    clientRepository.js      client CRUD/lookup
    planRepository.js        plan lookup
    progressRepository.js    exercise/day/calorie progress
    storage.js               localStorage compatibility helpers
    inviteClient.js          invite email client
    planParser.js            plan parser/demo fallback

supabase/
  schema.sql                 Supabase tables/indexes/RLS policies

wf_*.json                    n8n workflow exports
```

## 6. Important Entry Points

- App runtime: `public/index.html` -> `src/index.js` -> `src/App.js`
- Routes: `src/App.js`
- API endpoint config: `src/utils/config.js`
- Admin client creation: `src/pages/AdminDashboard.jsx`
- Client plan generation form: `src/components/Questionnaire.jsx`
- Client home: `src/pages/ClientDashboard.jsx`
- Workout/diet view: `src/pages/WorkoutPlanView.jsx`
- Progress analytics: `src/pages/ProgressDashboard.jsx`
- Progress persistence: `src/utils/progressRepository.js`
- Supabase schema: `supabase/schema.sql`
- Plan generator workflow: `wf_maiz82IchPuO1an9.json`

## 7. User Roles

### Admin

The admin is a gym operator/staff member who:

- logs into the admin dashboard;
- adds clients with name, email, and phone;
- sends portal invite emails;
- views client list and plan status.

### Client

The client is a gym member who:

- logs in using phone number;
- fills workout/diet questionnaire;
- waits for plan generation;
- views workout and diet plans;
- watches exercise videos;
- marks exercises complete;
- presses done after finishing a day;
- tracks calories and analytics;
- logs out.

## 8. Current Routes

| Route | Purpose | Guard |
| --- | --- | --- |
| `/` | Redirects to client login | None |
| `/admin/login` | Admin login | None |
| `/admin/dashboard` | Client management | Admin session |
| `/client/login` | Client phone login | None |
| `/client/dashboard` | Client home dashboard | Client session |
| `/client/waiting` | Plan generation wait/poll | Client session |
| `/client/plan` | Workout/diet/calorie portal | Client session |
| `/client/progress` | Progress analytics | Client session |

## 9. Environment Variables

Known frontend variables:

```env
REACT_APP_URL=https://airfitworkout.vercel.app
REACT_APP_N8N_BASE=https://airfitplangen.duckdns.org/webhook
REACT_APP_ADMIN_PASSWORD=...
REACT_APP_API_TOKEN=...
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

Notes:

- `REACT_APP_N8N_BASE` is required for client verification, plan generation, plan polling, registration, and emails.
- `REACT_APP_ADMIN_PASSWORD` controls admin login.
- `REACT_APP_API_TOKEN` is optional in frontend code.
- Supabase URL/key are required for persistent cross-device progress and plan access.
- Real values must stay in `.env`, `.env.production`, and Vercel environment variables, not docs.

## 10. Authentication Flow

### Admin Auth

1. Admin opens `/admin/login`.
2. Admin enters passcode.
3. App compares against `REACT_APP_ADMIN_PASSWORD`.
4. Session is stored in `localStorage` under `airfit_admin_session`.
5. `/admin/dashboard` is available while the session exists.

### Client Auth

1. Client opens `/client/login`.
2. Client enters phone number.
3. App verifies phone through n8n/Supabase-backed client lookup.
4. Session is stored in `localStorage` under `airfit_client_session`.
5. Client can access `/client/dashboard`, `/client/plan`, `/client/progress`, and `/client/waiting`.

Current limitation: this is not full Supabase Auth/OAuth. It is phone lookup plus browser session. For stronger privacy at 400-client scale, authenticated server-side endpoints or Supabase Auth should replace anonymous client-side access policies.

## 11. Database Flow

Supabase schema is defined in `supabase/schema.sql`.

### Tables

| Table | Purpose |
| --- | --- |
| `clients` | Unique client records: client ID, name, email, phone, status |
| `plans` | One workout plan and one diet plan per client |
| `exercise_progress` | Exercise completion by client, repeat week, day, exercise |
| `day_progress` | Day done state by client, repeat week, day |
| `calorie_logs` | Client food/calorie logs by date |

### Key Constraints

- `clients.client_id` unique
- `clients.email` unique
- `clients.phone` unique
- `plans` unique by `(client_id, plan_type)`
- `exercise_progress` unique by `(client_id, week_number, day_name, exercise_name)`
- `day_progress` unique by `(client_id, week_number, day_name)`

### Current RLS Model

The schema enables RLS but includes broad anonymous policies for the current client-side app model. This is workable for a prototype, but not ideal for production privacy. For 400 real gym clients, move writes/reads behind server/n8n endpoints or implement Supabase Auth with row-level user ownership.

## 12. API And n8n Webhook Structure

Frontend endpoints are centralized in `src/utils/config.js`.

| Endpoint | Method | Owner Workflow | Purpose |
| --- | --- | --- | --- |
| `/airfit-register-client` | POST | Plan Store | Create client |
| `/airfit-verify-client` | GET | Plan Store | Verify by phone/client ID |
| `/airfit-get-clients` | GET | Plan Store | Admin client list |
| `/airfit-invite` | POST | Portal Invite Email | Send portal invite or plan-ready email |
| `/airfit-gym-diet` | POST | Plan Generator | Start workout/diet generation |
| `/airfit-get-plan` | GET | Plan Store | Poll completed plan |
| `/airfit-plan-ready` | POST | Plan Store | Save plan from generator |

## 13. n8n Workflow Responsibilities

### Plan Generator: `wf_maiz82IchPuO1an9.json`

Main responsibility: generate workout or diet plan from questionnaire.

Current high-level flow:

1. `Webhook Trigger` receives questionnaire.
2. `Respond to Webhook` responds immediately.
3. `Wait 60 Minutes` node currently waits a short configured delay despite the old name.
4. `Build Gemini Prompt` builds workout/diet prompt.
5. `Generate Plan with Gemini` requests AI output.
6. `Route Plan Type` parses AI output or creates fallback plan if AI fails.
7. Workout path:
   - `Extract Exercises`
   - `Search Exercise Video`
   - `Validate Exercise Videos`
   - `Attach Exercise Video`
   - `Rebuild Workout Plan`
8. Diet path:
   - bypasses video enrichment and keeps diet HTML.
9. `Build Plan Response` creates final payload.
10. `Save Plan to Store` calls `/airfit-plan-ready`.
11. `Send Plan Ready Email` calls `/airfit-invite` with `mode: planReady`.

### Plan Store: `wf_N7ujfqztm0xMe1Iu.json`

Main responsibility: store and retrieve client/plan data through webhook endpoints.

Includes:

- save generated plans;
- get client plan;
- list clients;
- verify client;
- register client.

### Portal Invite Email: `wf_5WJMgjRnuIJVdA3h.json`

Main responsibility: build and send client email using Gmail node.

Supports:

- portal invite emails;
- plan-ready emails when called with `mode: planReady`.

The actual Gmail sending node is in this workflow as `Send Invite Email`. The generator workflow triggers it through `Send Plan Ready Email`.

## 14. Core Product Flows

### Admin Adds Client

1. Admin logs in.
2. Admin enters name, email, phone.
3. App checks duplicate email/phone through repository logic.
4. Client record is saved.
5. Invite email is sent through `/airfit-invite`.
6. Client receives login URL and phone login instructions.

### Client Generates Workout Plan

1. Client logs in.
2. Client opens dashboard.
3. Client starts workout questionnaire.
4. Questionnaire submits to `/airfit-gym-diet`.
5. n8n builds one reusable 7-day workout template.
6. n8n searches YouTube per exercise, prefers videos under 30 seconds, accepts under 60 seconds.
7. n8n stores video metadata with each exercise.
8. n8n saves plan to store.
9. n8n triggers plan-ready email.
10. Client views plan in `/client/plan`.

### Client Generates Diet Plan

1. Client starts diet questionnaire.
2. Questionnaire submits to `/airfit-gym-diet` with `planType: Diet Plan`.
3. n8n generates diet HTML.
4. Diet plan bypasses workout-video enrichment.
5. n8n stores `dietHtml`.
6. Client views diet in `/client/plan?tab=diet`.

### Client Tracks Progress

1. Client opens workout day.
2. Client marks exercises complete.
3. When all exercises are complete, client can mark day done.
4. Exercise progress and day progress are stored with `week_number`.
5. The visible workout is one week only, but monthly analytics use repeat weeks 1-4.
6. `/client/progress` calculates real totals from persisted progress/calorie rows.

## 15. Product Requirements Document

### Objective

Build a reliable gym automation portal that supports 400 clients with personalized workout/diet plans, short exercise videos, cross-device access, and real progress analytics.

### Success Metrics

- 95%+ plan submissions reach `ready` without manual intervention.
- Workout plan generation returns exactly 7 day objects.
- 95%+ workout exercises receive an embeddable YouTube video.
- 90%+ selected workout videos are 60 seconds or shorter.
- Plan-ready email is triggered for each successful plan generation.
- Client can log in from a different device and see the same plan/progress.
- Admin can add and verify clients without duplicate email/phone collisions.

### Functional Requirements

#### Admin

- Add client with required name, email, phone.
- Reject duplicate email or phone.
- Send invite email.
- View client list and plan status.

#### Client

- Log in by phone.
- View Home dashboard.
- Generate workout plan.
- Generate diet plan.
- View one-week workout template.
- View diet plan.
- Watch embedded YouTube exercise videos.
- Mark exercises complete.
- Mark day done only after exercises are completed.
- View monthly progress and analytics.
- Log calorie entries.
- Log out.

#### Workout Plan

- Show one visible week only.
- Include Monday through Sunday.
- Rest days have no exercises.
- Workout days have exercises with name, sets, reps, and video metadata.
- Same week repeats across month.
- Store repeat progress internally as week numbers 1-4.

#### Diet Plan

- Generate a client-specific diet plan.
- Store as `dietHtml`.
- Do not run diet plans through YouTube video enrichment.
- View from client portal.

#### Email

- Invite email when admin adds client.
- Plan-ready email when workout/diet plan is stored.
- Email payload must include name, email, phone, app URL, and plan type.

### Non-Functional Requirements

- Mobile-first responsive UI.
- SPA routes must return 200 from Vercel.
- n8n workflows must respond quickly to frontend submission.
- Plan generation should run async after immediate webhook response.
- Progress analytics must use persisted rows, not UI-only assumptions.
- Workflows must have fallback behavior when AI generation fails.
- API quotas must be managed for 400-client usage.
- Secrets must not be printed, committed, or documented.

## 16. 400-Client Scale And API Limit Strategy

This section is critical. The current automation can serve 400 clients only if generation is controlled, cached, or moved away from per-exercise live YouTube search.

### Current YouTube API Pattern

The current workout workflow does:

- one `search.list` request per exercise;
- one `videos.list` validation request per exercise;
- `maxResults: 10` for candidate search;
- chooses best embeddable candidate, preferring videos under 30 seconds and accepting under 60 seconds.

For a 20-exercise plan:

- `search.list`: about 20 calls per workout plan;
- `videos.list`: about 20 calls per workout plan;
- total: about 40 YouTube API calls per workout generation.

Google's YouTube Data API quota page states that every request costs at least one quota point, `search.list` has its own default daily limit of 100 calls, and `videos.list` costs 1 quota point. Source: https://developers.google.com/youtube/v3/determine_quota_cost

### Risk At 400 Clients

If all 400 clients generate workout plans live:

- 400 clients x 20 exercise searches = 8,000 `search.list` calls.
- This is far beyond the default 100 daily `search.list` call bucket.
- Even 10 clients in a day can exceed or approach default search capacity depending on exercise count.

Therefore, the current direct search-per-exercise design is not enough for 400-client production usage unless Google quota is increased or caching is added.

### Required Scale Improvements

Priority 1 recommendations:

1. Build a Supabase `exercise_video_library` table.
2. Store canonical exercise name, equipment, goal, video ID, title, channel, duration, thumbnail, and reviewed status.
3. Use library lookup first.
4. Call YouTube API only on cache miss.
5. Store new results after lookup.
6. Add an admin review flag for video quality.

Priority 2 recommendations:

1. Batch `videos.list` validation with up to 50 IDs per request instead of one validation call per exercise.
2. Preload common gym exercise videos before onboarding all clients.
3. Reuse video selections across similar clients.
4. Add n8n queue/rate limiting so plan jobs do not run in a burst.
5. Add retry/backoff for YouTube and Gemini HTTP requests.
6. Add daily quota monitoring and alerting.

Priority 3 recommendations:

1. Request increased YouTube API quota only after caching is in place.
2. Move AI/video generation to a dedicated backend worker if n8n queue/concurrency becomes unstable.
3. Add observability table for generation jobs and failures.

### Gemini/API Model Limit Strategy

The AI model call should also be treated as quota-limited:

- queue plan generation jobs;
- do not regenerate if an acceptable plan already exists;
- use deterministic fallback plan if AI fails;
- log AI failures separately from plan-store failures;
- rotate leaked/rejected API keys immediately;
- keep model keys out of workflow exports long-term by using n8n credentials or environment variables.

### Email Scale Strategy

For 400 clients, Gmail can work for low-volume operational emails, but deliverability depends on account limits and reputation. Production recommendations:

- use a transactional email provider for higher reliability;
- keep Gmail workflow for admin/testing or low-volume sends;
- log email status per client/plan;
- add retry on transient email failures;
- include unsubscribe/compliance handling if marketing messages are added later.

## 17. Data To Add For Scale

Recommended additional tables:

```sql
create table exercise_video_library (
  id uuid primary key default gen_random_uuid(),
  canonical_exercise text not null,
  equipment text,
  goal text,
  video_id text not null,
  video_url text not null,
  video_title text,
  channel_name text,
  duration_seconds integer,
  thumb text,
  is_embeddable boolean default true,
  is_reviewed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (canonical_exercise, equipment, goal)
);

create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  plan_type text not null,
  status text not null default 'queued',
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

create table email_events (
  id uuid primary key default gen_random_uuid(),
  client_id text,
  email text not null,
  email_type text not null,
  status text not null,
  provider_message_id text,
  error_message text,
  created_at timestamptz default now()
);
```

## 18. Acceptance Criteria

A production release is acceptable when:

- Admin can add a new client.
- Duplicate email is blocked.
- Duplicate phone is blocked.
- Invite email workflow returns success.
- Client can log in by phone.
- Workout generation returns status `ready`.
- Workout plan has exactly 7 days.
- Workout plan has videos for exercises.
- Preferred videos are under 30 seconds when available.
- Accepted videos are under 60 seconds where possible.
- Diet generation returns status `ready`.
- Diet plan stores as `dietHtml`, not `workoutJson`.
- Plan-ready email workflow is triggered.
- Client can access plan from another device after login.
- Exercise completion persists.
- Done button persists day completion.
- Progress dashboard shows real persisted analytics.
- `npm run build` passes.
- `npm test -- --watchAll=false` passes.
- Production SPA routes return 200.

## 19. Verification Commands

```bash
npm install
npm run build
npm test -- --watchAll=false
```

Production routes to smoke-check:

```text
https://airfitworkout.vercel.app/client/login
https://airfitworkout.vercel.app/client/dashboard
https://airfitworkout.vercel.app/client/plan
https://airfitworkout.vercel.app/client/progress
https://airfitworkout.vercel.app/admin/login
```

n8n QA checks:

- submit one workout plan with QA client;
- poll `/airfit-get-plan?clientId=...`;
- confirm 7 days, videos, durations, and ready status;
- submit one diet plan with QA client;
- confirm `dietHtml` and no `workoutJson`;
- send one email webhook test to a controlled address;
- inspect n8n executions for errors.

## 20. Current Known Risks

- Gemini key failures can block AI personalization; fallback protects plan readiness but does not replace a working model key.
- YouTube live search per exercise will not scale to 400 clients under default quota limits.
- Gmail deliverability may be insufficient for higher-volume operational email.
- Current persistent database implementation is Supabase. Planned free-tier migration target is Firebase Firestore, but that migration is not implemented yet.
- Supabase RLS policies are broad for the current client-side model.
- n8n workflow exports may contain API keys; migrate to credentials/environment variables.
- `.env` and `.env.production` have existed locally and may contain real secrets. Do not share them through public GitHub commits or screenshots.
- Test suite is currently minimal.

## 21. Recommended Roadmap

### Phase 1: Stability

- Keep current one-week plan model.
- Ensure workout/diet/email workflows pass QA.
- Rotate rejected/leaked API keys.
- Add generation job/error logging.

### Phase 2: Scale

- Migrate persistent client/plan/progress/calorie data from Supabase to Firebase Firestore if the project must stay on a free backend tier.
- Add exercise video cache/library.
- Batch YouTube validation calls.
- Add n8n queue/rate limiting.
- Add email event logging.
- Move secrets to n8n credentials/env only.

### Phase 3: Security

- Replace broad anonymous Supabase policies.
- Add Supabase Auth or trusted server endpoints.
- Add admin audit logs.
- Add data export/delete process for clients.

### Phase 4: Product Depth

- Coach-reviewed video library.
- Admin ability to regenerate only workout/diet.
- Client notifications for missed days.
- Better streak and adherence analytics.
- Trainer notes or manual plan overrides.

## 22. Firebase Migration Direction

The current app uses Supabase for persistent tables and n8n static data/webhooks for backend automation. Because the project must stay on a free tier for now, Firebase Firestore is the preferred free-tier migration target over Appwrite Free for AirFit.

### Why Firebase Is The Preferred Free-Tier Target

Firebase Spark plan is more suitable for AirFit's current free-tier needs because Firestore quotas reset daily and are more practical for a 400-500 client gym portal than Appwrite Free's monthly read/write caps.

Current Firebase Spark limits to design around:

- Firestore storage: 1 GiB
- Firestore document reads: 50,000 per day
- Firestore document writes: 20,000 per day
- Firestore document deletes: 20,000 per day
- Hosting storage: 10 GB
- Hosting transfer: 360 MB per day
- Firebase Auth monthly active users: 50,000

Source: https://firebase.google.com/pricing

### Firebase Fit For AirFit

Firebase Free can support AirFit's expected 400-500 clients if the data model is optimized:

- one document per client profile;
- one workout plan document per client;
- one diet plan document per client;
- compact progress documents by client/month/week/day;
- calorie logs grouped by day or month instead of one read-heavy collection per tiny entry;
- cached plan reads in the browser after first load;
- no video/image files stored in Firebase;
- YouTube video IDs/metadata only, never video files.

Firebase Free is not unlimited. It is production-usable only if reads/writes are controlled. The app should not attach live Firestore listeners to every dashboard/admin view unless strictly required.

### Firebase Data Model Proposal

```text
clients/{clientId}
  name
  email
  phone
  planStatus
  createdAt
  updatedAt

clients/{clientId}/plans/workout
  planType: "workout"
  status
  workoutJson
  generatedAt

clients/{clientId}/plans/diet
  planType: "diet"
  status
  dietHtml
  generatedAt

clients/{clientId}/progress/{yyyyMM}
  weeks: {
    "1": {
      Monday: {
        done: true,
        exercises: {
          "Barbell Bench Press": true
        }
      }
    }
  }

clients/{clientId}/calories/{yyyyMM}
  days: {
    "2026-06-22": [
      { food: "Rice bowl", calories: 520, createdAt: "..." }
    ]
  }

exerciseVideoLibrary/{canonicalExerciseKey}
  exerciseName
  equipment
  goal
  videoId
  videoUrl
  videoTitle
  durationSeconds
  channelName
  thumb
  reviewed
```

### Firebase Migration Work Required

Files likely needing rewrite:

- `src/utils/supabaseClient.js` -> replace with Firebase client setup.
- `src/utils/clientRepository.js` -> Firestore clients collection.
- `src/utils/planRepository.js` -> Firestore client plan documents.
- `src/utils/progressRepository.js` -> Firestore monthly progress documents.
- `src/utils/storage.js` -> keep only local session compatibility.
- n8n plan-store workflow -> write/read Firestore or continue as source of truth until migration completes.
- Vercel env vars -> add Firebase public config.

Firebase migration should be treated as a dedicated implementation phase, not a quick provider swap.

### Firebase Production Rules

Before going live on Firebase:

- define Firestore security rules;
- prevent clients from reading other clients' documents;
- avoid using SMS Phone Auth on the free plan;
- use existing phone lookup only if protected by rules/backend logic;
- keep admin operations separated from client operations;
- test daily read/write usage with QA load.

## 23. YouTube Data API Production Readiness For 400 Clients

The YouTube Data API can work for production AirFit usage only if AirFit avoids live per-exercise searches for every client.

### Current Workflow Behavior

The n8n generator currently searches YouTube per exercise, validates returned video IDs, and stores video metadata. It prefers videos under 30 seconds and accepts videos under 60 seconds.

This works functionally, but it is not quota-safe for 400 clients if every plan generation performs fresh YouTube searches.

### Quota Math

For a typical workout plan:

- 20 exercises per plan is common.
- Current search model: roughly 1 `search.list` call per exercise.
- Validation model: roughly 1 `videos.list` call per exercise.
- Total: about 20 YouTube searches and 20 validation calls per generated workout.

For 400 clients:

- 400 clients x 20 search calls = about 8,000 YouTube search calls.
- This is not production-safe under default API quotas.

Google's quota page states that YouTube API requests consume quota and that `videos.list` costs 1 unit. The workflow must be designed as quota-sensitive automation. Source: https://developers.google.com/youtube/v3/determine_quota_cost

### Production-Ready YouTube Strategy

Required before onboarding 400 clients:

1. Create a cached `exerciseVideoLibrary`.
2. Search YouTube only when an exercise/equipment/goal combination is missing.
3. Reuse reviewed videos across similar clients.
4. Batch `videos.list` validation up to the API's allowed batch size instead of validating one exercise at a time.
5. Add a manual review flag so poor video matches can be replaced.
6. Log all YouTube API failures.
7. Add n8n rate limiting and queueing.
8. Avoid regenerating videos when a client regenerates only diet.

### Verdict

YouTube Data API is okay for production with 400 clients only with caching and review. It is not okay if every client generation performs fresh live searches for every exercise.

## 24. Codebase Transfer Guide

This section is for transferring the complete AirFit codebase to another developer without losing or breaking the current work.

### What To Transfer Through GitHub

Safe to transfer through the repository:

- `src/`
- `public/`
- `supabase/schema.sql`
- `wf_*.json` workflow exports
- `package.json`
- `package-lock.json`
- `vercel.json`
- `README.md`
- `AGENTS.md`
- `AIRFIT_WEB_APP_PRD.md`
- `PLAN.md`

Do not transfer secrets through a public GitHub repository.

### Credentials And Access To Transfer Securely

Transfer these through a password manager, encrypted note, or direct account invitation. Do not paste them into GitHub issues, commits, screenshots, or chat logs.

| Credential/Access | Why Friend Needs It | Recommended Transfer Method |
| --- | --- | --- |
| GitHub repo access | Pull/push code | Add friend as collaborator or transfer repo ownership |
| Vercel project access | Deploy frontend and manage env vars | Invite friend to Vercel team/project |
| n8n login/access | Edit workflows and check executions | Add n8n user or securely share admin access |
| n8n MCP/API credentials | Agent/tool access to workflows | Password manager only |
| Gmail account/OAuth used by n8n | Send invite/plan-ready emails | Prefer OAuth connection inside n8n, avoid sharing password |
| Gemini API key | AI plan generation | Rotate key, store in n8n credential/env |
| YouTube Data API key | Exercise video search | Rotate key, store in n8n credential/env |
| Supabase project access | Current database before Firebase migration | Invite to Supabase organization/project |
| Firebase project access | Future database migration | Add friend to Firebase/Google Cloud project |
| Vercel environment variables | Production frontend config | Recreate in Vercel dashboard |
| Domain/DNS access | `airfitworkout.vercel.app`/custom DNS if added | Account invite/password manager |

### Environment Variables To Recreate

Current frontend variables:

```env
REACT_APP_URL=https://airfitworkout.vercel.app
REACT_APP_N8N_BASE=https://airfitplangen.duckdns.org/webhook
REACT_APP_ADMIN_PASSWORD=...
REACT_APP_API_TOKEN=...
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

Future Firebase variables after migration:

```env
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

Important: Firebase public config is not a server secret, but Firestore security rules must be correct because browser apps expose these values.

### Recommended Transfer Process

1. Push latest code to GitHub.
2. Add friend as GitHub collaborator.
3. Friend clones repo:

```bash
git clone <repo-url>
cd airfit
npm install
npm start
```

4. Share `.env` values privately.
5. Friend creates local `.env` from private values.
6. Friend runs:

```bash
npm test -- --watchAll=false
npm run build
```

7. Invite friend to Vercel project.
8. Confirm Vercel env vars match local env vars.
9. Invite friend to n8n.
10. Friend verifies workflows:
    - Plan Generator
    - Plan Store
    - Portal Invite Email
11. Run one QA workout generation.
12. Run one QA diet generation.
13. Run one QA invite/plan-ready email.
14. Confirm production routes return 200.

### What Not To Do

- Do not send `.env` files through GitHub.
- Do not commit new API keys.
- Do not share Gmail password directly if OAuth/user invite is possible.
- Do not let the friend regenerate workflows without saving exports.
- Do not migrate to Firebase and change n8n storage in the same untested deployment.
- Do not onboard all 400 clients before YouTube caching is implemented.

### Handoff Checklist

- GitHub collaborator added.
- Vercel collaborator added.
- n8n access confirmed.
- Supabase access confirmed for current database.
- Firebase project created/invited for migration.
- Gemini key rotated and stored safely.
- YouTube key rotated and stored safely.
- Gmail sending path tested.
- `.env` recreated locally by friend.
- `npm install`, `npm test -- --watchAll=false`, and `npm run build` pass.
- Production app route smoke test passes.
- QA workout generation passes.
- QA diet generation passes.
- QA email send passes.

## 25. Source References

- Repository source files listed above.
- Supabase schema: `supabase/schema.sql`
- n8n workflow exports: `wf_*.json`
- YouTube API quota costs: https://developers.google.com/youtube/v3/determine_quota_cost
- Firebase pricing and Spark limits: https://firebase.google.com/pricing
