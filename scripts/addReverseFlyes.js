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
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addReverseFlyes() {
  const exerciseName = "Reverse Flyes";
  const slug = "reverse-flyes";
  const videoId = "95ZCBbVj5X0"; // Dumbbell Reverse Flyes technique
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    await setDoc(doc(db, 'curated_videos', slug), {
      name: exerciseName,
      slug: slug,
      videoId: videoId,
      url: url,
      thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      updatedAt: new Date().toISOString()
    });
    console.log(`Successfully added: ${exerciseName} -> ${slug} (${videoId})`);
  } catch (err) {
    console.error(`Error saving ${exerciseName}:`, err.message);
  }
  process.exit(0);
}

addReverseFlyes();
