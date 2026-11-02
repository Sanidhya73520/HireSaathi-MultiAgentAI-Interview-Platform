import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const sanitizeDomain = (domain) => {
  if (!domain) return "";
  // Strip protocol (http:// or https://) and trailing slashes
  return domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "").trim();
};

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "hiresaathi-ai";
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const authDomain =
  sanitizeDomain(rawAuthDomain) ||
  (projectId ? `${projectId}.firebaseapp.com` : "hiresaathi-ai.firebaseapp.com");

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    (projectId ? `${projectId}.firebasestorage.app` : undefined),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || undefined,
};

if (!import.meta.env.VITE_FIREBASE_APIKEY) {
  console.warn("⚠️ [WARNING] VITE_FIREBASE_APIKEY is missing in frontend environment variables!");
}

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export { auth, provider };
