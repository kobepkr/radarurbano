import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import reporteRoutes from "./routes/reporte.routes";
import usuarioRoutes from "./routes/usuario.routes";
import estadisticasRoutes from "./routes/estadisticas.routes";
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

connectDB();

app.use((req: any, res, next) => {
  req.io = io;
  next();
});

app.use("/api/reportes", reporteRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/estadisticas", estadisticasRoutes);

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
