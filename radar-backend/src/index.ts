import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import reporteRoutes from "./routes/reporte.routes";
import usuarioRoutes from "./routes/usuario.routes";
import estadisticasRoutes from "./routes/estadisticas.routes";
import adminRoutes from "./routes/admin.routes";
import { connectDB } from "./config/db";
import { swaggerSpec } from "./config/swagger";
import swaggerUi from "swagger-ui-express";

const app = express();
const httpServer = createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || "*";

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '50mb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Demasiados intentos. Esperá 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/usuarios/login", loginLimiter);
app.use("/api/usuarios/registro", rateLimit({ windowMs: 60 * 60 * 1000, max: 3, message: { error: "Demasiados registros. Esperá 1 hora." } }));
app.use("/api/usuarios/recuperar-password", rateLimit({ windowMs: 60 * 60 * 1000, max: 3, message: { error: "Demasiados intentos. Esperá 1 hora." } }));

connectDB();

app.use((req: any, res, next) => {
  req.io = io;
  next();
});

app.use("/api/reportes", reporteRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/estadisticas", estadisticasRoutes);
app.use("/api/admin", adminRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado a WebSockets:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Servidor HTTP con WebSockets corriendo en puerto ${PORT}`);
});

export { io };
