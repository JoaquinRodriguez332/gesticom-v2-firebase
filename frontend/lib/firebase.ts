// lib/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDeO4RNogxdrDxOJEWfAbsyr67jh19fIFc",
  authDomain: "gesticom-4e956.firebaseapp.com",
  projectId: "gesticom-4e956",
  storageBucket: "gesticom-4e956.firebasestorage.app",
  messagingSenderId: "158166010651",
  appId: "1:158166010651:web:58b14e98489ea9046a61be",
}

// App principal (sesión del usuario logueado)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app,"gesticom")

// 🔹 App secundaria solo para crear usuarios (no toca la sesión actual)
let secondaryApp: FirebaseApp

const existing = getApps().find((a) => a.name === "admin-app")
if (existing) {
  secondaryApp = existing
} else {
  secondaryApp = initializeApp(firebaseConfig, "admin-app")
}

export const adminAuth = getAuth(secondaryApp)
