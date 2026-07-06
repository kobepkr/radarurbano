import mongoose from "mongoose";

export interface IComentario {
  usuarioId: mongoose.Types.ObjectId;
  nombre: string;
  texto: string;
  createdAt: Date;
}

export interface IReacciones {
  like: number;
  urgente: number;
  peligro: number;
}

export interface IReporte extends mongoose.Document {
  categoria: string;
  tipo: string;
  descripcion: string;
  ubicacion: {
    type: string;
    coordinates: number[];
  };
  estado: string;
  confirmaciones: number;
  reportesFalsos: number;
  creadoPor: mongoose.Types.ObjectId;
  creadoPorNombre: string;
  confirmadoPor: mongoose.Types.ObjectId[];
  expiraEn: Date;
  archivado: boolean;
  reacciones: IReacciones;
  comentarios: IComentario[];
  createdAt: Date;
  updatedAt: Date;
}

const reporteSchema = new mongoose.Schema({
  categoria: {
    type: String,
    required: true,
    enum: ["transito", "seguridad", "emergencias", "comunidad", "mascotas", "ambiente", "servicios", "urbanismo"]
  },
  tipo: {
    type: String,
    required: true,
    enum: [
      "accidente", "delito", "trafico", "clima",
      "embotellamiento", "choque", "semaforoRoto", "calleCortada",
      "objetoPeligroso", "controlCarabineros", "obrasEnVia",
      "calleInundada", "manifestacion", "emergenciaVehicular",
      "actividadDeportiva", "reduccionCarril", "carreraIlegal",
      "semaforoApagado", "barreraPeaje", "camionVolcado",
      "autoPanne", "gruaEnVia", "pasoSinLuz", "motoEnVereda", "autoAltaVelocidad",
      "asalto", "actitudSospechosa", "balacera",
      "carabinerosLugar", "patrulla", "camaraSeguridad",
      "zonaOscura", "casaAbandonada",
      "alarmaVecinal", "intentoRobo", "personaMerodeando",
      "autoRobado", "camaraFalsa", "carabineroBici",
      "controlIdentidad", "ocupacionIlegal", "gritosCalle",
      "incendio", "inundacion",
      "accidenteGrave", "bomberosLugar", "personaHerida",
      "rescate", "fenomenoClimatico", "cortoCircuito",
      "derrumbe", "alertaSeguridad",
      "ambulanciaLugar", "rescateAcuatico", "rescateAltura",
      "fugaGas", "derrumbeParcial", "tornado",
      "incendioForestal", "alarmaIncendio",
      "bache", "corteLuz", "corteAgua",
      "escombros", "maleza", "perrosCallejeros",
      "veredaMala", "mueblesAbandonados", "autoAbandonado",
      "arbolCaido", "cableCaido", "zonaEscolar",
      "basuraIlegal", "escombrosVereda", "plagas",
      "perroAbandonado", "gatoCallejero", "mosquitos",
      "ruidoConstruccion", "musicaAlta", "mueblesCalle", "senalCaida",
      "perroPerdido", "gatoPerdido", "mascotaEncontrada",
      "mascotaAdopcion", "animalAtropellado", "animalAgresivo",
      "gatoHerido", "aveHerida", "perroEnCelo", "refugioAnimales",
      "arbolDerribado", "basuraParque", "quemaBasura",
      "aguaEstancada", "olorQuimico", "talaIlegal",
      "puntoReciclaje", "arbolEnRiesgo", "areaProtegida",
      "internetCaido", "senalCelular", "centroSalud",
      "colegio", "transportePublico", "estacionamiento",
      "posteDanado", "aguaPotable", "bancoCajero",
      "construccion", "cierreCalle", "nuevoPavimento",
      "veredaNueva", "areaVerdeNueva", "ciclovia", "edificioConstruccion"
    ]
  },
  descripcion: {
    type: String,
    maxlength: 200
  },
  ubicacion: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  estado: {
    type: String,
    enum: ["no_confirmado", "confirmado", "falso"],
    default: "no_confirmado"
  },
  confirmaciones: {
    type: Number,
    default: 0
  },
  reportesFalsos: {
    type: Number,
    default: 0
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario"
  },
  creadoPorNombre: {
    type: String,
    default: ""
  },
  confirmadoPor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario"
  }],
  expiraEn: {
    type: Date,
    required: true
  },
  archivado: {
    type: Boolean,
    default: false
  },
  // ✅ REACCIONES - CAMPO CORRECTO
  reacciones: {
    like: { type: Number, default: 0 },
    urgente: { type: Number, default: 0 },
    peligro: { type: Number, default: 0 }
  },
  // ✅ COMENTARIOS - CAMPO SEPARADO (NO DENTRO DE reacciones)
  comentarios: [{
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    nombre: {
      type: String,
      required: true
    },
    texto: {
      type: String,
      required: true,
      maxlength: 300
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Índice geoespacial
reporteSchema.index({ ubicacion: "2dsphere" });

export const Reporte = mongoose.model<IReporte>("Reporte", reporteSchema);