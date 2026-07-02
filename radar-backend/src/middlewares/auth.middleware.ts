import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  usuario?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET no está definido en las variables de entorno");
    }

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Acceso denegado. Token requerido" });
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET!);
    
    // Agregar usuario decodificado al request
    req.usuario = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};