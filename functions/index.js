// functions/index.js
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// ---- Importaciones v2 para HTTP ----
const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");

// Inicializar Firebase Admin SDK
admin.initializeApp();

// Establecer región global (ej: southamerica-east1)
setGlobalOptions({region: "southamerica-east1"});

// ---- Configuración de Express ----
const app = express();
app.use(cors({origin: true}));

// Rutas de la API (ajusta paths si difieren)
const productRoutes = require("./src/routes/products");
const salesRoutes = require("./src/routes/sales");
const userRoutes = require("./src/routes/users");

app.use("/productos", productRoutes);
app.use("/ventas", salesRoutes);
app.use("/usuarios", userRoutes);

// ---- Exportar API HTTP (v2) ----
exports.api = onRequest(app);

// ---- Exportar triggers de Auth (v1) ----
const authTriggers = require("./src/triggers/auth");
exports.onUsuarioCreado = authTriggers.onUsuarioCreado;
exports.onUsuarioEliminado = authTriggers.onUsuarioEliminado;
