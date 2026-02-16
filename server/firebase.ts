import { initializeApp, cert } from "firebase-admin/app";

export function initializeFirebase() {
  // Initialize Firebase Admin SDK
  // When running on Google Cloud (App Engine, Cloud Functions, etc.),
  // the SDK automatically uses the Application Default Credentials
  if (process.env.FIREBASE_CONFIG) {
    // If explicit config is provided (for local development)
    const config = JSON.parse(process.env.FIREBASE_CONFIG);
    initializeApp({
      credential: cert(config),
      projectId: config.project_id,
    });
  } else {
    // When running on GCP, uses Application Default Credentials
    initializeApp();
  }

  console.log("Firebase initialized successfully");
}
