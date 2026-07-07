import mongoose from "mongoose";

interface IApiKey extends mongoose.Document {
  key: string;
  nombre: string;
  activo: boolean;
  limiteRequests: number;
  requestsRealizados: number;
  createdAt: Date;
}

const apiKeySchema = new mongoose.Schema<IApiKey>({
  key: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  activo: { type: Boolean, default: true },
  limiteRequests: { type: Number, default: 10000 },
  requestsRealizados: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const ApiKey = mongoose.model<IApiKey>("ApiKey", apiKeySchema);
