# AirFit Production Data And Analytics Plan

## Summary

Use Supabase as the primary database for client records, generated plans, workout progress, diet plans, calorie logs, and analytics. Keep n8n as the plan-generation automation layer, but move app-owned state out of browser-only `localStorage` so clients can access the same portal data from any device using the live URL and their phone number.

Recommended database: **Supabase free tier**.

Why Supabase:

- It supports real relational tables for clients, plans, progress, and analytics.
- It can enforce unique emails and phone numbers at the database level.
- It supports realtime subscriptions for live progress/analytics updates.
- It has a generous free tier and works well from React apps.
- n8n can still write generated workout/diet plans into Supabase through REST/API calls.

Alternatives considered:

- n8n tables: closest to the current setup, but weaker for app-side realtime analytics, relational constraints, and long-term data modeling.
- Firebase: strong realtime support, but NoSQL data modeling is less natural for this app's client/plan/progress relationships.

## Current Problems To Solve

1. Client data is partly cached in `localStorage`, so progress and calories are not reliably cross-device.
2. Admin client creation does not enforce duplicate email before local UI update.
3. Workout progress analytics are calculated from local browser state and mocked values, so they are not accurate across devices.
4. Day completion exists locally, but the “done” state is not persisted to a shared database.
5. Workout and diet plan generation are separate enough that users can miss the ability to maintain both in one portal.
6. Logout exists in some screens, but the plan should standardize clear logout behavior across protected client/admin views.

## Proposed Architecture

### Frontend

The React app remains a Create React App SPA.

Primary changes:

- Add a Supabase client utility.
- Replace client/profile/progress/calorie localStorage persistence with Supabase reads/writes.
- Keep localStorage only for lightweight session cache, not source-of-truth data.
- Keep existing routes in `src/App.js`.
- Keep n8n endpoints in `src/utils/config.js` for plan generation and invite workflows.

### Database

Create Supabase tables:

```text
clients
  id uuid primary key
  name text not null
  email text not null unique
  phone text not null unique
  created_at timestamptz default now()
  updated_at timestamptz default now()

plans
  id uuid primary key
  client_id uuid references clients(id)
  plan_type text not null -- workout, diet
  status text not null -- none, pending, ready, failed
  workout_json jsonb
  diet_html text
  generated_at timestamptz
  created_at timestamptz default now()
  updated_at timestamptz default now()

exercise_progress
  id uuid primary key
  client_id uuid references clients(id)
  plan_id uuid references plans(id)
  week_number integer not null
  day_name text not null
  exercise_name text not null
  completed boolean not null default false
  completed_at timestamptz
  updated_at timestamptz default now()

day_progress
  id uuid primary key
  client_id uuid references clients(id)
  plan_id uuid references plans(id)
  week_number integer not null
  day_name text not null
  done boolean not null default false
  done_at timestamptz
  updated_at timestamptz default now()

calorie_logs
  id uuid primary key
  client_id uuid references clients(id)
  log_date date not null
  food text not null
  calories integer not null
  created_at timestamptz default now()
```

Required constraints:

- `clients.email` must be unique.
- `clients.phone` must be unique.
- `exercise_progress` should have a unique key on `client_id`, `plan_id`, `week_number`, `day_name`, `exercise_name`.
- `day_progress` should have a unique key on `client_id`, `plan_id`, `week_number`, `day_name`.

## Feature Plan

### 1. Supabase Setup

Add environment variables:

```env
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Add a Supabase client module:

```text
src/utils/supabaseClient.js
```

Add data helpers:

```text
src/utils/clientRepository.js
src/utils/progressRepository.js
src/utils/planRepository.js
```

These helpers should hide Supabase query details from UI components.

### 2. Admin Client Creation And Duplicate Email

Admin flow:

1. Admin enters name, email, and phone.
2. Before creating the client, query Supabase for existing `email`.
3. If email exists, show: `Email already exists`.
4. Also check phone and show: `Phone number already exists`.
5. If both are unique, insert the client.
6. Trigger n8n invite workflow after successful insert.

Important behavior:

- Do not optimistically add the client to UI before Supabase confirms insert.
- Database unique constraints must be the final source of truth.
- If Supabase returns a unique constraint error, map it to a friendly message.

### 3. Cross-Device Client Login

Client login flow:

1. Client enters phone number.
2. App queries Supabase `clients.phone`.
3. If found, store only a lightweight session in `localStorage`.
4. Load profile, plans, progress, and calories from Supabase.
5. Any device using the same URL and phone number should see the same data.

Session storage:

- Keep `airfit_client_session` for convenience.
- Do not treat it as source-of-truth client data.
- Refresh client data from Supabase after login and when opening protected pages.

### 4. Workout And Diet Plan Generation

Client dashboard should make both plan types clearly available:

- If no workout plan exists, show “Generate Workout Plan”.
- If workout exists but diet does not, show “Generate Diet Plan” inside the plan portal.
- If diet exists but workout does not, show “Generate Workout Plan”.
- If both exist, show tabs for Training, Diet Plan, and Calorie Log.

n8n integration:

- Keep `airfit-gym-diet` for generation requests unless workflows are changed separately.
- Include `clientId`, `planType`, name, email, and phone in the payload.
- n8n should write generated plan output into Supabase `plans`.
- Frontend should poll Supabase or the existing n8n `airfit-get-plan` endpoint until ready.

Preferred final state:

- n8n generates plans.
- Supabase stores plans.
- React reads plans from Supabase.

### 5. Real-Time Progress And Analytics

Replace local-only progress storage with Supabase.

Exercise checkbox behavior:

1. User checks an exercise.
2. Upsert row in `exercise_progress`.
3. UI updates immediately after successful write.
4. Other devices receive updated progress through Supabase realtime or refresh fetch.

Done button behavior:

1. When all exercises in a day are checked, show `Done` button.
2. When clicked, upsert `day_progress.done = true`.
3. Set `done_at`.
4. Analytics should update immediately.

Performance Insight should calculate:

- Total exercises for selected week.
- Completed exercises for selected week.
- Completion percentage.
- Completed days.
- Current streak from `day_progress.done_at` dates.
- Calories logged today and weekly total.

Remove mocked streak values.

### 6. Logout

Standardize logout behavior:

- Admin logout clears `airfit_admin_session` and redirects to `/admin/login`.
- Client logout clears `airfit_client_session` and redirects to `/client/login`.
- Add or verify visible logout button on all protected client/admin experiences:
  - Admin dashboard
  - Client dashboard
  - Waiting screen
  - Plan view
  - Progress dashboard

Logout should not delete Supabase data.

## Implementation Order

1. Add Supabase env variables and client utility.
2. Create Supabase schema and constraints.
3. Build repository helpers for clients, plans, progress, and calories.
4. Update admin client creation to use Supabase and duplicate checks.
5. Update client login to use Supabase phone lookup.
6. Update plan storage/read path so generated workout and diet plans are available cross-device.
7. Move exercise progress, day done state, and calories to Supabase.
8. Fix Performance Insight analytics to use Supabase-backed progress.
9. Add client-side plan portal actions for generating whichever plan type is missing.
10. Standardize logout buttons across protected pages.
11. Run build, tests, and manual route smoke checks.

## Testing Plan

### Automated

Run:

```bash
npm run build
npm test -- --watchAll=false
```

### Manual QA

Admin:

- Add new client with unique email and phone.
- Try adding same email again; expect `Email already exists`.
- Try adding same phone again; expect `Phone number already exists`.
- Confirm client appears after page refresh and on another browser/device.

Client:

- Login with phone on mobile.
- Generate workout plan.
- Login with same phone on laptop and confirm workout plan appears.
- Generate diet plan after workout exists.
- Confirm both Training and Diet Plan tabs are available.
- Check all exercises for a day.
- Click Done.
- Open Progress Dashboard and confirm analytics update.
- Login from another device and confirm progress is still present.

Logout:

- Client logout redirects to `/client/login`.
- Admin logout redirects to `/admin/login`.
- Refresh protected routes after logout; user should be redirected to login.

Backend:

- Confirm n8n plan generation writes a `ready` plan to Supabase.
- Confirm invite email still sends after client creation.
- Confirm failed n8n generation marks plan `failed` or leaves useful error state.

## Acceptance Criteria

The implementation is done when:

- Client records are stored in Supabase.
- Duplicate emails are blocked with `Email already exists`.
- Duplicate phones are blocked with a friendly phone error.
- Client login by phone works from multiple devices.
- Workout plans, diet plans, progress, day done state, and calories are cross-device.
- Performance Insight uses real stored progress, not mocked streaks.
- Done button persists day completion and updates analytics.
- Users can generate and maintain both workout and diet plans in one portal.
- Logout is visible and works on all protected client/admin pages.
- `npm run build` passes.
- `npm test -- --watchAll=false` passes or any failure is documented with cause.

## Open Questions

- Supabase Row Level Security policy needs final approval before production. The simplest first version can use anonymous client access filtered by phone/session, but production should use stronger auth or signed access tokens.
- Existing n8n workflows must be updated to write plans into Supabase, or the frontend must continue bridging through current n8n plan-store endpoints during migration.
- Existing localStorage-only progress data will not automatically migrate unless a migration/import step is added.
