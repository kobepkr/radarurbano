import { Request, Response, NextFunction } from "express";
import { ApiKey } from "../models/ApiKey";

export const apiKeyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.header("x-api-key") || req.query.api_key as string;

  if (!key) {
    return res.status(401).json({ error: "API Key requerida. Usá el header x-api-key" });
  }

  const apiKey = await ApiKey.findOne({ key, activo: true });

  if (!apiKey) {
    return res.status(403).json({ error: "API Key inválida o desactivada" });
  }

  if (apiKey.requestsRealizados >= apiKey.limiteRequests) {
    return res.status(429).json({ error: "Límite de requests alcanzado" });
  }

  await ApiKey.updateOne({ key }, { $inc: { requestsRealizados: 1 } });
  next();
};
