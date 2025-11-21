// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// ¡Añadimos 'getAuth' para manejar el login!
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// (¡La copiaste perfecto de la consola!)
const firebaseConfig = {
  apiKey: "AIzaSy...", // (Tu API key va aquí)
  authDomain: "gesticom-4e956.firebaseapp.com",
  projectId: "gesticom-4e956",
  storageBucket: "gesticom-4e956.appspot.com", // (Verifiqué este de tu captura)
  messagingSenderId: "158166010651",
  appId: "1:158166010651:web:58b14e98489ea9046a61be"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exportar el servicio de Autenticación (lo usaremos para el login)
export const auth = getAuth(app); 