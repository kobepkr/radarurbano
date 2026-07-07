import express from "express";
import { ApiKey } from "../models/ApiKey";
import crypto from "crypto";

const router = express.Router();

router.get("/listar", async (req, res) => {
  const keys = await ApiKey.find().sort({ createdAt: -1 });
  res.json(keys);
});

router.post("/crear", async (req, res) => {
  const { nombre, limiteRequests } = req.body;
  const key = `ru_${crypto.randomBytes(24).toString("hex")}`;
  const nueva = new ApiKey({ key, nombre, limiteRequests: limiteRequests || 10000 });
  await nueva.save();
  res.json(nueva);
});

router.post("/toggle", async (req, res) => {
  const { key } = req.body;
  const apiKey = await ApiKey.findOne({ key });
  if (!apiKey) return res.status(404).json({ error: "No encontrada" });
  apiKey.activo = !apiKey.activo;
  await apiKey.save();
  res.json(apiKey);
});

router.delete("/eliminar", async (req, res) => {
  const { key } = req.body;
  await ApiKey.deleteOne({ key });
  res.json({ success: true });
});

router.post("/reset-contador", async (req, res) => {
  const { key } = req.body;
  await ApiKey.updateOne({ key }, { requestsRealizados: 0 });
  res.json({ success: true });
});

export default router;
