// functions/src/triggers/auth.js
const functions = require("firebase-functions/v1");

// --- ¡HAZ ESTE CAMBIO! ---
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore(undefined, "gesticom");

exports.onUsuarioCreado = functions;

exports.onUsuarioCreado = functions
    .region("southamerica-east1")
    .auth.user()
    .onCreate(async (user) => {
      try {
        console.log(`Creando perfil para nuevo usuario: ${user.uid}`);

        await db.collection("usuarios").doc(user.uid).set({
          uid: user.uid,
          email: user.email || null,
          fechaCreacion: new Date(),
          rol: "vendedor",
          estado: "habilitado",
        });
      } catch (error) {
        console.error("Error al crear perfil de usuario:", error);
      }
    });

exports.onUsuarioEliminado = functions
    .region("southamerica-east1")
    .auth.user()
    .onDelete(async (user) => {
      try {
        console.log(`Eliminando perfil de usuario: ${user.uid}`);
        await db.collection("usuarios").doc(user.uid).delete();
      } catch (error) {
        console.error("Error al eliminar perfil de usuario:", error);
      }
    });
