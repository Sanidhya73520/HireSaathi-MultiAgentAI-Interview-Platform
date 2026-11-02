
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "hiresaathi-1413d.firebaseapp.com",
  projectId: "hiresaathi-1413d",
  storageBucket: "hiresaathi-1413d.firebasestorage.app",
  messagingSenderId: "1027734681670",
  appId: "1:1027734681670:web:82e1a1b16aa347300a7247"
};

const app = initializeApp(firebaseConfig);

const auth=getAuth(app)

const provider=new GoogleAuthProvider()

export {auth,provider}