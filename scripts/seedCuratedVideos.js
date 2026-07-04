import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function extractVideoId(url) {
  let videoId = null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.split('/shorts/')[1];
    } else if (parsed.searchParams.has('v')) {
      videoId = parsed.searchParams.get('v');
    }
  } catch (e) {
    // Ignore invalid URLs
  }
  return videoId;
}

async function seed() {
  const rawText = fs.readFileSync(path.resolve(__dirname, 'raw_exercises.txt'), 'utf8');
  const lines = rawText.split('\n');
  
  let successCount = 0;
  let errorCount = 0;

  console.log('Starting seed process...');

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Match lines like: 1 TREADMILL = https://youtu.be/...
    // or 1. Bench Dips - https://...
    const match = line.match(/^\d+\.?\s*(.+?)\s*[-=]\s*(https?:\/\/\S+)/i);
    if (match) {
      let exerciseName = match[1].trim();
      let url = match[2].trim();
      
      const videoId = extractVideoId(url);
      if (!videoId) {
        console.warn(`Could not extract video ID for ${exerciseName} (${url})`);
        continue;
      }
      
      const slug = slugify(exerciseName);
      
      try {
        await setDoc(doc(db, 'curated_videos', slug), {
          name: exerciseName,
          slug: slug,
          videoId: videoId,
          url: url,
          thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          updatedAt: new Date().toISOString()
        });
        console.log(`Saved: ${exerciseName} -> ${slug} (${videoId})`);
        successCount++;
      } catch (err) {
        console.error(`Error saving ${exerciseName}:`, err.message);
        errorCount++;
      }
    }
  }

  console.log(`Seed complete! Successfully added: ${successCount}. Errors: ${errorCount}.`);
  process.exit(0);
}

seed();
