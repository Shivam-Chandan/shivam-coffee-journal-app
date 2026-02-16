import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Parse your config from .env
const firebaseConfig = process.env.FIREBASE_CONFIG 
  ? JSON.parse(process.env.FIREBASE_CONFIG) 
  : undefined;

// 2. Initialize the App
if (!getApps().length) {
  try {
    initializeApp({
      credential: firebaseConfig ? cert(firebaseConfig) : undefined
    });
    console.log("🚀 Firebase Admin initialized successfully.");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Firebase Admin initialization failed:", errorMessage);
  }
}

export const db = getFirestore();

// 3. Connection Health Check
// This will trigger a real network request to verify the connection.
db.listCollections()
  .then((collections) => {
    console.log("✅ Firestore connection verified.");
    console.log(`📡 Available collections: ${collections.map(c => c.id).join(', ') || 'None'}`);
  })
  .catch((error) => {
    console.error("❌ Firestore connection failed. Check your Service Account permissions or Project ID.");
    console.error(`Details: ${error.message}`);
  });