# AirFit Changes Needed

## Database

- Replace Supabase with Firebase Firestore.
- Store clients, workout plans, diet plans, progress, and calories under one client ID.
- Add secure Firestore rules and test the migration before removing Supabase.

## Workout And Diet Plans

- Save name, age, gender, phone, email, goal, and generation date in both plans.
- Sync generated workout and diet plans with the dashboard on every device.
- After diet generation, show `View Diet Plan` instead of asking the client to generate it again.

## Progress Tracker

- Sync exercise completion, completed days, diet status, and calorie logs with Firebase.
- Calculate progress and analytics from Firebase data, not only localStorage.
- Show the latest workout and diet plan status in the dashboard and progress page.

## AI YouTube Videos

- Use AI-driven YouTube video discovery for every exercise based on the client's goal, experience, equipment, limitations, and workout type.
- The n8n workflow must dynamically search YouTube and select the most accurate exercise demonstration.
- Prefer YouTube Shorts or videos under 30 seconds; allow up to 60 seconds as a fallback.
- Validate the exercise name, title, duration, embed availability, and video URL before saving it.
- Store the video ID, URL, title, channel, thumbnail, and duration with the exercise.
- Add caching, rate limiting, retries, and error logs so generation works reliably for about 400 clients.
- Use the official YouTube Data API where possible. Direct page scraping is fragile and may violate YouTube terms, so it must not be the only production dependency.

## UI And Automation

- Replace broken or static emojis with consistent Lucide icons or plain text.
- Ensure n8n saves each plan before sending the client email.
- Log email delivery failures and retry temporary errors.
- Keep Gemini, YouTube, Firebase, and email credentials outside workflow exports.

## Implementation Order

1. Fix diet-plan dashboard synchronization.
2. Add client metadata to both plan types.
3. Sync progress and calories with Firebase.
4. Migrate Supabase data and n8n storage to Firebase.
5. Implement AI YouTube video discovery and validation.
6. Test complete generation, email, dashboard, and progress flows before production migration.
