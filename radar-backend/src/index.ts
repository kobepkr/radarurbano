import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import reporteRoutes from "./routes/reporte.routes";
import usuarioRoutes from "./routes/usuario.routes";
import { connectDB } from "./config/db";

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
app.use(express.json());

connectDB();

app.use((req: any, res, next) => {
  req.io = io;
  next();
});

app.use("/api/reportes", reporteRoutes);
app.use("/api/usuarios", usuarioRoutes);

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
