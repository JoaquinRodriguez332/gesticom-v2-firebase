const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// ---- Importaciones v2 para HTTP ----
const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Establecer región global
setGlobalOptions({region: "southamerica-east1"});

// ---- Configuración de Express (Tu API REST) ----
const app = express();
app.use(cors({origin: true}));

// Rutas de la API
try {
  const productRoutes = require("./src/routes/products");
  const salesRoutes = require("./src/routes/sales");
  const userRoutes = require("./src/routes/users");

  app.use("/productos", productRoutes);
  app.use("/ventas", salesRoutes);
  app.use("/usuarios", userRoutes);
} catch (e) {
  console.warn("⚠️ Rutas API no encontradas");
}

// ---- 1. EXPORTAR API PRINCIPAL (v2) ----
exports.api = onRequest(app);

// ---- 2. TRIGGERS DE AUTH (v1) ----
let authTriggers;
try {
  authTriggers = require("./src/triggers/auth");
} catch (e) {
  console.warn("⚠️ Triggers no encontrados");
}

if (authTriggers) {
  // ✅ MANTENIDO: Limpieza automática al borrar un usuario
  exports.onUsuarioEliminado = authTriggers.onUsuarioEliminado;
}

// ---- 3. FUNCIÓN: ELIMINAR USUARIO COMPLETO ----
exports.eliminarUsuarioCompleto = functions.https.onRequest(
    async (req, res) => {
      // Configuración de CORS
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "DELETE, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      // Responder al preflight de CORS
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      const {uid} = req.body;

      if (!uid) {
        res.status(400).json({error: "Falta el UID del usuario"});
        return;
      }

      try {
        console.log(`🗑️ Eliminando usuario: ${uid}`);

        // A. Eliminar de Authentication
        await admin.auth().deleteUser(uid);
        console.log("✅ Eliminado de Auth");

        // B. Eliminar de Firestore
        await admin
            .firestore()
            .collection("usuarios")
            .doc(uid)
            .delete();
        console.log("✅ Eliminado de Firestore");

        res.status(200).json({message: "Usuario eliminado totalmente"});
      } catch (error) {
        console.error("Error eliminando usuario:", error);

        // Si no existe en Auth, intentar borrar de DB
        if (error.code === "auth/user-not-found") {
          await admin
              .firestore()
              .collection("usuarios")
              .doc(uid)
              .delete();
          res.status(200).json({
            message: "Usuario no existía en Auth, limpiado de DB",
          });
        } else {
          res.status(500).json({error: error.message});
        }
      }
    },
);
