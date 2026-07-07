import express from "express";
import { Reporte } from "../models/reporte";

const router = express.Router();

router.get("/reportes-por-dia", async (req, res) => {
  try {
    const { desde, hasta, categoria } = req.query;
    const match: any = {};
    if (categoria) match.categoria = categoria;
    if (desde || hasta) {
      match.createdAt = {};
      if (desde) match.createdAt.$gte = new Date(desde as string);
      if (hasta) match.createdAt.$lte = new Date(hasta as string);
    }

    const data = await Reporte.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          confirmados: { $sum: { $cond: [{ $eq: ["$estado", "confirmado"] }, 1, 0] } },
          falsos: { $sum: { $cond: [{ $eq: ["$estado", "falso"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data);
  } catch (error) {
    console.error("Error estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

router.get("/por-categoria", async (req, res) => {
  try {
    const data = await Reporte.aggregate([
      { $match: { archivado: false } },
      {
        $group: {
          _id: "$categoria",
          total: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

router.get("/por-region", async (req, res) => {
  try {
    const data = await Reporte.aggregate([
      { $match: { archivado: false } },
      {
        $group: {
          _id: "$categoria",
          total: { $sum: 1 },
          lat: { $avg: { $arrayElemAt: ["$ubicacion.coordinates", 1] } },
          lng: { $avg: { $arrayElemAt: ["$ubicacion.coordinates", 0] } },
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

router.get("/por-horario", async (req, res) => {
  try {
    const data = await Reporte.aggregate([
      { $match: { archivado: false } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

router.get("/top-usuarios", async (req, res) => {
  try {
    const data = await Reporte.aggregate([
      { $match: { archivado: false } },
      {
        $group: {
          _id: "$creadoPorNombre",
          total: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 20 },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

router.get("/resumen", async (req, res) => {
  try {
    const { categoria } = req.query;
    const match: any = { archivado: false };
    if (categoria) match.categoria = categoria;
    const [total, confirmados, falsos, pendientes, hoy] = await Promise.all([
      Reporte.countDocuments({ ...match, archivado: false }),
      Reporte.countDocuments({ ...match, estado: "confirmado", archivado: false }),
      Reporte.countDocuments({ ...match, estado: "falso", archivado: false }),
      Reporte.countDocuments({ ...match, estado: "no_confirmado", archivado: false }),
      Reporte.countDocuments({
        ...match,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        archivado: false,
      }),
    ]);

    res.json({ total, confirmados, falsos, pendientes, hoy });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener resumen" });
  }
});

export default router;
