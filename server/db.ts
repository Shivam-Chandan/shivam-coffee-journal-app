import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Singleton initialization
if (!getApps().length) {
  initializeApp(); 
}

export const db = getFirestore();