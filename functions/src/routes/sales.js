const express = require("express");
const admin = require("firebase-admin");

// --- ¡ESTO ES LO IMPORTANTE! ---
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore(undefined, "gesticom");

// eslint-disable-next-line new-cap
const router = express.Router();
// GET /api/ventas - Obtener todas las ventas
router.get("/", async (req, res) => {
  try {
    const ventasSnapshot = await db
        .collection("ventas")
        .orderBy("fecha", "desc")
        .get();
    const ventas = [];

    for (const doc of ventasSnapshot.docs) {
      const ventaData = doc.data();

      const detalleSnapshot = await db
          .collection("ventas")
          .doc(doc.id)
          .collection("detalle")
          .get();
      const items = [];
      detalleSnapshot.forEach((itemDoc) => {
        items.push({id: itemDoc.id, ...itemDoc.data()});
      });

      ventas.push({
        id: doc.id,
        ...ventaData,
        items: items,
      });
    }
    res.status(200).send(ventas);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).send({mensaje: "Error al obtener ventas."});
  }
});

// POST /api/ventas - Crear nueva venta
router.post("/", async (req, res) => {
  try {
    const {items, total, usuario} = req.body;
    const usuarioId = usuario.id;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "La venta debe tener al menos un producto",
      });
    }

    await db.runTransaction(async (transaction) => {
      const ventaRef = db.collection("ventas").doc();
      const promesasStock = [];

      // 1. Verificar stock
      for (const item of items) {
        const productoRef = db.collection("productos").doc(item.producto_id);
        const promesa = transaction.get(productoRef).then((doc) => {
          if (!doc.exists) {
            throw new Error(`Producto no encontrado: ${item.producto_id}`);
          }
          const stockActual = doc.data().stock;
          if (stockActual < item.cantidad) {
            throw new Error(
                `Stock insuficiente para: ${doc.data().nombre}`,
            );
          }
          // 2. Actualizar stock
          const nuevoStock = stockActual - item.cantidad;
          transaction.update(productoRef, {stock: nuevoStock});
        });
        promesasStock.push(promesa);
      }

      await Promise.all(promesasStock);

      // 3. Crear la venta
      transaction.set(ventaRef, {
        fecha: new Date(),
        total: total,
        estado: "activa",
        usuario: usuario,
        usuarioId: usuarioId,
      });

      // 4. Guardar el detalle y registrar movimientos
      for (const item of items) {
        // Guardar detalle
        const detalleVentaRef = db
            .collection("ventas")
            .doc(ventaRef.id)
            .collection("detalle")
            .doc();
        transaction.set(detalleVentaRef, item);

        // 5. Registrar movimiento
        const movRef = db.collection("movimientos_inventario").doc();
        transaction.set(movRef, {
          productoId: item.producto_id,
          tipo: "salida",
          cantidad: item.cantidad,
          usuario: usuario.nombre,
          motivo: `Venta #${ventaRef.id}`,
          fecha: new Date(),
        });
      }

      // 6. Registrar actividad
      const actRef = db.collection("actividad_sistema").doc();
      transaction.set(actRef, {
        usuarioId: usuarioId,
        modulo: "ventas",
        accion: `Venta procesada #${ventaRef.id} por $${total}`,
        fecha: new Date(),
      });
    });

    res.status(201).send({mensaje: "Venta creada exitosamente."});
  } catch (error) {
    console.error("Error al crear la venta:", error);
    res.status(500).send({
      mensaje: error.message || "Error al procesar la venta.",
    });
  }
});

// PUT /api/ventas/:id/anular - Anular venta
router.put("/:id/anular", async (req, res) => {
  try {
    const {id} = req.params;
    const userNombre = "Admin";

    await db.runTransaction(async (transaction) => {
      const ventaRef = db.collection("ventas").doc(id);
      const ventaDoc = await transaction.get(ventaRef);

      if (!ventaDoc.exists || ventaDoc.data().estado !== "activa") {
        throw new Error("Venta no encontrada o ya anulada");
      }

      // 1. Obtener items de la venta
      const detalleSnapshot = await ventaRef.collection("detalle").get();

      // 2. Restaurar stock
      for (const itemDoc of detalleSnapshot.docs) {
        const item = itemDoc.data();
        const productoRef = db.collection("productos").doc(item.producto_id);

        transaction.update(productoRef, {
          stock: admin.firestore.FieldValue.increment(item.cantidad),
        });

        // 3. Registrar movimiento de anulación
        const movRef = db.collection("movimientos_inventario").doc();
        transaction.set(movRef, {
          productoId: item.producto_id,
          tipo: "entrada",
          cantidad: item.cantidad,
          usuario: userNombre,
          motivo: `Anulación venta #${id}`,
          fecha: new Date(),
        });
      }

      // 4. Marcar venta como anulada
      transaction.update(ventaRef, {estado: "anulada"});

      // 5. Registrar actividad
      const actRef = db.collection("actividad_sistema").doc();
      transaction.set(actRef, {
        modulo: "ventas",
        accion: `Venta anulada #${id}`,
        fecha: new Date(),
      });
    });

    res.status(200).send({message: "Venta anulada exitosamente"});
  } catch (error) {
    console.error("Error al anular venta:", error);
    res.status(500).send({
      mensaje: error.message || "Error al anular venta.",
    });
  }
});

module.exports = router;
