import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Parse Firebase config from .env with error handling
let firebaseConfig: any;
try {
  firebaseConfig = process.env.FIREBASE_CONFIG 
    ? JSON.parse(process.env.FIREBASE_CONFIG) 
    : undefined;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn(`⚠️ FIREBASE_CONFIG is malformed JSON, using Application Default Credentials instead. Error: ${errorMessage}`);
  firebaseConfig = undefined;
}

// 2. Determine project ID from config or environment
const projectId = firebaseConfig?.project_id || process.env.GCP_PROJECT_ID || undefined;
if (!projectId) {
  console.warn("⚠️ No GCP_PROJECT_ID found in config or environment. Firebase may not initialize properly.");
}

// 3. Initialize the App
if (!getApps().length) {
  try {
    initializeApp({
      credential: firebaseConfig ? cert(firebaseConfig) : undefined,
      projectId: projectId
    });
    console.log("🚀 Firebase Admin SDK initialized successfully (Project: " + (projectId || "auto-detected") + ")");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Firebase Admin initialization failed:", errorMessage);
  }
}

export const db = getFirestore();

// 4. Connection Health Check
// This will trigger a real network request to verify the connection.
db.listCollections()
  .then((collections) => {
    console.log("✅ Firestore connection verified successfully.");
    console.log(`📡 Available collections: ${collections.map(c => c.id).join(', ') || 'None'}`);
  })
  .catch((error: any) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Firestore connection check failed: ${errorMessage}`);
    console.warn('This may be OK if using in-memory storage or if Firestore initializes later.');
  });