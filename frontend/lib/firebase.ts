import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeO4RNogxdrDxOJEWfAbsyr67jh19fIFc", // Tu API Key real
  authDomain: "gesticom-4e956.firebaseapp.com",
  projectId: "gesticom-4e956",
  storageBucket: "gesticom-4e956.firebasestorage.app",
  messagingSenderId: "158166010651",
  appId: "1:158166010651:web:58b14e98489ea9046a61be"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, "gesticom"); // Base de datos 'gesticom'z