import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração real do projeto pmj-sms (PRISMA-SP)
const firebaseConfig = {
  apiKey: "AIzaSyBCedeB-EXWaKHbOFvDTPGJVmZNf4SAo2Q",
  authDomain: "pmj-sms.firebaseapp.com",
  projectId: "pmj-sms",
  storageBucket: "pmj-sms.firebasestorage.app",
  messagingSenderId: "859868807755",
  appId: "1:859868807755:web:7c99d987164343d80ec3ce",
  measurementId: "G-S1TJ14MWFX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
