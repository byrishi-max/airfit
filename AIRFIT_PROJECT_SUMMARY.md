# AirFit Project Summary

Last updated: June 13, 2026

## Overview

AirFit is a gym management and client training portal. It provides:

- Admin client management.
- Phone-based client login.
- Workout and diet questionnaire submission.
- AI-generated plan retrieval through n8n.
- Workout plan viewing, exercise completion tracking, and calorie logging.

Production app: https://airfitworkout.vercel.app

## Architecture

### Frontend

- React `19.2.4`
- Create React App / `react-scripts`
- React Router `7.13.1`
- Tailwind CSS setup plus inline component styles
- Framer Motion
- Lucide React
- Recharts
- Vercel deployment

Active entry path:

```text
public/index.html -> src/index.js -> src/App.js
```

### Backend

There is no in-repo backend server. The app uses external n8n workflows hosted under:

```text
https://airfitplangen.duckdns.org/webhook
```

n8n handles client store operations, invite email, plan generation, and plan retrieval.

## Key Files

- `src/App.js` - active route definitions and protected route wrappers.
- `src/pages/AdminLogin.jsx` - admin passcode login.
- `src/pages/AdminDashboard.jsx` - client list, create client, invite, and plan modal.
- `src/pages/ClientLogin.jsx` - phone-based client login.
- `src/pages/ClientDashboard.jsx` - plan type selection and questionnaire entry.
- `src/pages/WaitingScreen.jsx` - plan-generation waiting/polling screen.
- `src/pages/WorkoutPlanView.jsx` - workout/diet/calorie tabs and exercise progress.
- `src/pages/ProgressDashboard.jsx` - progress and nutrition dashboard.
- `src/components/Questionnaire.jsx` - multi-step workout/diet questionnaire.
- `src/hooks/useAuth.js` - admin/client session helpers.
- `src/hooks/useClientPlan.js` - plan polling and local plan cache sync.
- `src/utils/config.js` - central endpoint definitions.
- `src/utils/storage.js` - localStorage and n8n client helpers.
- `src/utils/inviteClient.js` - invite webhook client.

## Routes

- `/` -> redirects to `/client/login`
- `/admin/login`
- `/admin/dashboard`
- `/client/login`
- `/client/dashboard`
- `/client/waiting`
- `/client/plan`
- `/client/progress`

`src/pages/Landing.jsx` exists but is not wired into the active route tree.

## Environment Variables

See `.env.example`.

Required/known variables:

- `REACT_APP_URL`
- `REACT_APP_N8N_BASE`
- `REACT_APP_ADMIN_PASSWORD`
- `REACT_APP_API_TOKEN`

`REACT_APP_API_TOKEN` is optional in the current frontend request path; the header is only sent when the variable is set.

## API Endpoints

All endpoint URLs are built in `src/utils/config.js`.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/airfit-gym-diet` | POST | Submit questionnaire for plan generation |
| `/airfit-get-plan` | GET | Fetch plan status/data by `clientId` |
| `/airfit-plan-ready` | POST | Store generated plan; used by n8n |
| `/airfit-invite` | POST | Send portal invite email |
| `/airfit-get-clients` | GET | Fetch admin client list |
| `/airfit-verify-client` | GET | Verify client by phone or client ID |
| `/airfit-register-client` | POST | Register new client |

## n8n Workflow Exports

- `wf_5WJMgjRnuIJVdA3h.json` - Airfit Gym - Portal Invite Email.
- `wf_maiz82IchPuO1an9.json` - Airfit Gym - Plan Generator (Web App).
- `wf_N7ujfqztm0xMe1Iu.json` - Airfit Gym - Plan Store.

The checked-in JSON exports are useful for orientation, but live workflow behavior should be verified against the n8n instance when production behavior matters.

## Authentication

Admin:

- Password checked against `REACT_APP_ADMIN_PASSWORD`.
- Session stored as `airfit_admin_session`.
- Protected route: `/admin/dashboard`.

Client:

- Client enters phone number.
- Frontend calls `airfit-verify-client`.
- Session stored as `airfit_client_session`.
- Protected routes: `/client/dashboard`, `/client/waiting`, `/client/plan`, `/client/progress`.

## Local Storage

Important localStorage keys:

- `airfit_admin_session`
- `airfit_client_session`
- `airfit_clients`
- `deleted_clients`
- `airfit_progress_*`
- `airfit_daydone_*`
- `airfit_calories_*`

## Commands

- `npm install`
- `npm start`
- `npm run build`
- `npm test`
- `npm test -- --watchAll=false`

No dedicated lint, format, or typecheck scripts are defined in `package.json`.

## Deployment

Primary production deployment is Vercel.

- Vercel team: `airfitofficial24-hashs-projects`
- Vercel project: `airfit`
- Production URL: https://airfitworkout.vercel.app
- Config file: `vercel.json`

`netlify.toml` exists but is not the primary deployment path used in recent work.

## Verification Notes

Recommended baseline verification:

1. `npm run build`
2. `npm test -- --watchAll=false` when tests or logic changed
3. Route smoke test for the changed UI
4. Safe n8n webhook smoke test when backend behavior is involved

Recent production-readiness checks verified:

- Production build compiled successfully.
- Vercel live routes returned `200` for `/`, `/client/login`, and `/admin/login`.
- n8n QA workflow chain succeeded for register, verify, invite, submit-plan, and get-plan polling.

## Known Unknowns And Risks

- Live n8n workflows can drift from the checked-in JSON exports.
- The repository has minimal automated tests.
- There is no dedicated lint/format/typecheck command.
- Real `.env` files have existed as tracked files; avoid exposing or editing secrets unless explicitly requested.
- Diet plan HTML is rendered with `dangerouslySetInnerHTML`, relying on backend-generated content.
