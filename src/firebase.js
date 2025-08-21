// Firebase initialization for Vite + React app
// Requires environment variables set as VITE_FIREBASE_*

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Flag indicando se todas as variáveis foram definidas
export const firebaseReady = Object.values(firebaseConfig).every(Boolean);
if (!firebaseReady) {
  console.warn('[Firebase] Variáveis VITE_FIREBASE_* ausentes/incompletas. Operações Firestore serão ignoradas.');
}

let app = null;
let dbInstance = null;
if (firebaseReady) {
  app = initializeApp(firebaseConfig);
  dbInstance = getFirestore(app);
}

export const db = dbInstance; // null quando não configurado
export default app;
