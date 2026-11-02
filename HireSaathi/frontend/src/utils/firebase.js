import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hiresaathi-1413d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hiresaathi-1413d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hiresaathi-1413d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1027734681670",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1027734681670:web:82e1a1b16aa347300a7247",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
