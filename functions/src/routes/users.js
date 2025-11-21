const express = require("express");
const admin = require("firebase-admin");

// --- ¡ESTO ES LO IMPORTANTE! ---
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore(undefined, "gesticom");

// eslint-disable-next-line new-cap
const router = express.Router();

// GET /api/usuarios - Obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    // 1. Obtener usuarios de Firebase Auth
    const listUsersResult = await admin.auth().listUsers(1000);

    // 2. Obtener datos de la colección Firestore
    const snapshot = await db.collection("usuarios").get();
    const perfilesDB = {};
    snapshot.forEach((doc) => {
      perfilesDB[doc.id] = doc.data();
    });

    // 3. Combinar datos
    const usuarios = listUsersResult.users.map((user) => {
      const perfil = perfilesDB[user.uid] || {};
      return {
        id: user.uid,
        email: user.email,
        nombre: perfil.nombre || user.displayName,
        rol: perfil.rol,
        activo: perfil.estado === "habilitado",
        fechaCreacion: perfil.fecha_creacion,
        rut: perfil.rut || "No Asignado",
      };
    });

    res.status(200).send(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).send({mensaje: "Error al obtener usuarios."});
  }
});

// POST /api/usuarios - Crear nuevo usuario
router.post("/", async (req, res) => {
  try {
    const {nombre, email, password, rut, rol} = req.body;

    // 1. Crear usuario en Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: nombre,
    });

    // 2. Actualizar su perfil en Firestore
    // ESTA LÍNEA ES MÁS LIMPIA Y CORRECTA
    await db.collection("usuarios").doc(userRecord.uid).set({
      nombre: nombre,
      rut: rut,
      rol: rol, // <-- ¡Usa el 'rol' que mandaste en el JSON!
    }, {merge: true});

    res.status(201).send({id: userRecord.uid, email: userRecord.email});
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).send({
      mensaje: "Error al crear usuario.",
      error: error.message,
    });
  }
});

// PUT /api/usuarios/:id - Actualizar usuario
router.put("/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const {nombre, email, rol, rut} = req.body;

    // 1. Actualizar en Firebase Auth
    await admin.auth().updateUser(id, {
      email: email,
      displayName: nombre,
    });

    // 2. Actualizar en Firestore
    await db.collection("usuarios").doc(id).update({
      nombre: nombre,
      email: email,
      rol: rol,
      rut: rut,
    });

    res.status(200).send({mensaje: "Usuario actualizado."});
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).send({mensaje: "Error al actualizar usuario."});
  }
});

// PUT /api/usuarios/:id/toggle-status - Activar/Desactivar usuario
router.put("/:id/toggle-status", async (req, res) => {
  try {
    const {id} = req.params;
    const doc = await db.collection("usuarios").doc(id).get();

    if (!doc.exists) {
      return res.status(404).send({
        mensaje: "Usuario no encontrado en DB",
      });
    }

    const estadoActual = doc.data().estado;
    const nuevoEstado = estadoActual === "habilitado" ?
      "deshabilitado" :
      "habilitado";
    const authDisabled = nuevoEstado === "deshabilitado";

    // 1. Activar/Desactivar en Firebase Auth
    await admin.auth().updateUser(id, {
      disabled: authDisabled,
    });

    // 2. Actualizar en Firestore
    await db.collection("usuarios").doc(id).update({
      estado: nuevoEstado,
    });

    res.status(200).send({
      mensaje: `Usuario ${nuevoEstado}.`,
      activo: !authDisabled,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).send({mensaje: "Error al cambiar estado."});
  }
});

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete("/:id", async (req, res) => {
  try {
    const {id} = req.params;

    // 1. Eliminar de Firebase Auth
    await admin.auth().deleteUser(id);

    res.status(200).send({mensaje: "Usuario eliminado."});
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).send({mensaje: "Error al eliminar usuario."});
  }
});

module.exports = router;
