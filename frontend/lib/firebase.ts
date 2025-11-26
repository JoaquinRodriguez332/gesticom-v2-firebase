// lib/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "your api key",
  authDomain: "your auth domain",
  projectId: "your project id",
  storageBucket: "your storage bucket",
  messagingSenderId: "your messaging sender id",
  appId: "yout app id",
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
