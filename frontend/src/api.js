// frontend/src/api.js
import axios from "axios";
// ¡Importamos el 'auth' que creamos en el paso anterior!
import { auth } from "./firebaseConfig";

// ¡Esta es tu URL de API desplegada!
const baseURL = "https://southamerica-east1-gesticom-4e956.cloudfunctions.net/api";

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  }
});

// --- ¡LA MAGIA ESTÁ AQUÍ! ---
// Esto es un "Interceptor": se ejecuta ANTES de cada petición que hagas.
apiClient.interceptors.request.use(
  async (config) => {
    // 1. Revisa si hay un usuario con sesión iniciada
    const user = auth.currentUser;

    if (user) {
      // 2. Si hay, le pide a Firebase su token de seguridad
      const token = await user.getIdToken();
      
      // 3. ¡Pega ese token en el "header" de la petición!
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// --- FIN DE LA MAGIA ---

// Exportamos el cliente de Axios listo para usar
export default apiClient;