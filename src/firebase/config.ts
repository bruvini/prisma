import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // TODO: Add your Firebase project configuration
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "prisma-sp.firebaseapp.com",
  projectId: "prisma-sp",
  storageBucket: "prisma-sp.appspot.com",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
