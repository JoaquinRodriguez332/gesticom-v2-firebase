// lib/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "tu_api_key_aqui",
  authDomain: "tu_auth_domain_aqui",
  projectId: "tu_project_id_aqui",
  storageBucket: "su_storage_bucket_aqui",
  messagingSenderId: "tu_messaging_sender_id_aqui",
  appId: "tu_app_id_aqui",
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
