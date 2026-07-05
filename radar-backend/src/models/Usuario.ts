import mongoose from "mongoose";
import bcrypt from "bcryptjs";

interface IUsuario extends mongoose.Document {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  rol: string;
  premium: boolean;
  premiumDesde: Date | null;
  premiumHasta: Date | null;
  reputacion: number;
  confirmacionesRealizadas: number;
  reportesCreados: number;
  activo: boolean;
  ubicacion: {
    type: string;
    coordinates: number[];
  };
  pushToken: string | null;
  notificacionesActivas: boolean;
  compararPassword(password: string): Promise<boolean>;
}

const usuarioSchema = new mongoose.Schema<IUsuario>({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true,
    unique: true
  },
  rol: {
    type: String,
    enum: ["usuario", "admin"],
    default: "usuario"
  },
  premium: {
  type: Boolean,
  default: false
},
premiumDesde: {
  type: Date,
  default: null
},
premiumHasta: {
  type: Date,
  default: null
},
  reputacion: {
    type: Number,
    default: 0
  },
  confirmacionesRealizadas: {
    type: Number,
    default: 0
  },
  reportesCreados: {
    type: Number,
    default: 0
  },
  activo: {
    type: Boolean,
    default: true
  },
  
  // Ubicación del usuario (para notificaciones cercanas)
  ubicacion: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // [longitud, latitud]
    }
  },
  
  // Token para notificaciones push
  pushToken: {
    type: String,
    default: null
  },
  
  notificacionesActivas: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// Índice geoespacial para búsquedas por cercanía
usuarioSchema.index({ ubicacion: "2dsphere" });

// Hash de contraseña antes de guardar
usuarioSchema.pre("save", async function(this: IUsuario) {
  if (!this.isModified("password")) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.error("Error al hashear password:", error);
    throw error;
  }
});

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function(this: IUsuario, password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error("Error comparando passwords:", error);
    return false;
  }
};

export const Usuario = mongoose.model<IUsuario>("Usuario", usuarioSchema);