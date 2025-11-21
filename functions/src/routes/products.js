const express = require("express");

// --- ¡ESTO ES LO IMPORTANTE! ---
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore(undefined, "gesticom");

// eslint-disable-next-line new-cap
const router = express.Router();

// GET /api/productos - Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const {search} = req.query;
    let query = db.collection("productos").orderBy("nombre");

    if (search) {
      query = query
          .where("nombre", ">=", search)
          .where("nombre", "<=", search + "\uf8ff");
    }

    const snapshot = await query.get();
    const productos = [];
    snapshot.forEach((doc) => {
      productos.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    res.status(200).send(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).send({mensaje: "Error al obtener productos."});
  }
});

// GET /api/productos/stock-bajo
router.get("/stock-bajo", async (req, res) => {
  try {
    const limite = Number(req.query.limite) || 5;

    const snapshot = await db.collection("productos")
        .where("stock", "<=", limite)
        .orderBy("stock", "asc")
        .get();

    const productos = [];
    snapshot.forEach((doc) => {
      productos.push({id: doc.id, ...doc.data()});
    });
    res.status(200).send(productos);
  } catch (error) {
    console.error("Error al obtener stock bajo:", error);
    res.status(500).send({mensaje: "Error al obtener stock bajo."});
  }
});

// GET /api/productos/:id - Obtener un producto por ID
router.get("/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const doc = await db.collection("productos").doc(id).get();

    if (!doc.exists) {
      return res.status(404).send({mensaje: "Producto no encontrado"});
    }

    res.status(200).send({id: doc.id, ...doc.data()});
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).send({mensaje: "Error al obtener producto."});
  }
});

// POST /api/productos - Crear un nuevo producto
router.post("/", async (req, res) => {
  try {
    const nuevoProducto = req.body;
    const docRef = await db.collection("productos").add(nuevoProducto);
    res.status(201).send({id: docRef.id, ...nuevoProducto});
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).send({mensaje: "Error al crear producto."});
  }
});

// PUT /api/productos/:id - Actualizar un producto
router.put("/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const actualizacion = req.body;
    await db.collection("productos").doc(id).update(actualizacion);
    res.status(200).send({mensaje: "Producto actualizado."});
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).send({mensaje: "Error al actualizar producto."});
  }
});

// DELETE /api/productos/:id - Eliminar un producto
router.delete("/:id", async (req, res) => {
  try {
    const {id} = req.params;
    await db.collection("productos").doc(id).delete();
    res.status(200).send({mensaje: "Producto eliminado."});
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).send({mensaje: "Error al eliminar producto."});
  }
});

module.exports = router;
