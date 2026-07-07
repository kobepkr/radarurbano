import express from "express";
import { Reporte, IReporte } from "../models/reporte";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { Usuario } from "../models/Usuario";
import { io } from '../index'; 
import { subirImagenCloudinary } from "../config/cloudinary";

const router = express.Router();
console.log("🟢 Archivo reporte.routes.ts cargado");

const categoriaMap: { [key: string]: string } = {
  accidente: "transito", delito: "seguridad", trafico: "transito",
  clima: "emergencias", incendio: "emergencias", embotellamiento: "transito",
  choque: "transito", semaforoRoto: "transito", calleCortada: "transito",
  objetoPeligroso: "transito", controlCarabineros: "transito", obrasEnVia: "transito",
  calleInundada: "transito", manifestacion: "transito", emergenciaVehicular: "transito",
  actividadDeportiva: "transito", reduccionCarril: "transito", carreraIlegal: "transito",
  semaforoApagado: "transito", barreraPeaje: "transito", camionVolcado: "transito",
  autoPanne: "transito", gruaEnVia: "transito", pasoSinLuz: "transito",
  motoEnVereda: "transito", autoAltaVelocidad: "transito",
  asalto: "seguridad", actitudSospechosa: "seguridad", balacera: "seguridad",
  carabinerosLugar: "seguridad", patrulla: "seguridad", camaraSeguridad: "seguridad",
  zonaOscura: "seguridad", casaAbandonada: "seguridad",
  alarmaVecinal: "seguridad", intentoRobo: "seguridad", personaMerodeando: "seguridad",
  autoRobado: "seguridad", camaraFalsa: "seguridad", carabineroBici: "seguridad",
  controlIdentidad: "seguridad", ocupacionIlegal: "seguridad", gritosCalle: "seguridad",
  inundacion: "emergencias", accidenteGrave: "emergencias", bomberosLugar: "emergencias",
  personaHerida: "emergencias", rescate: "emergencias", fenomenoClimatico: "emergencias",
  cortoCircuito: "emergencias", derrumbe: "emergencias", alertaSeguridad: "emergencias",
  ambulanciaLugar: "emergencias", rescateAcuatico: "emergencias", rescateAltura: "emergencias",
  fugaGas: "emergencias", derrumbeParcial: "emergencias", tornado: "emergencias",
  incendioForestal: "emergencias", alarmaIncendio: "emergencias",
  bache: "transito", corteLuz: "comunidad", corteAgua: "comunidad",
  escombros: "comunidad", maleza: "comunidad", perrosCallejeros: "comunidad",
  veredaMala: "comunidad", mueblesAbandonados: "comunidad", autoAbandonado: "comunidad",
  arbolCaido: "comunidad", cableCaido: "comunidad", zonaEscolar: "comunidad",
  basuraIlegal: "comunidad", escombrosVereda: "comunidad", plagas: "comunidad",
  perroAbandonado: "comunidad", gatoCallejero: "comunidad", mosquitos: "comunidad",
  ruidoConstruccion: "comunidad", musicaAlta: "comunidad", mueblesCalle: "comunidad",
  senalCaida: "comunidad",
  perroPerdido: "mascotas", gatoPerdido: "mascotas", mascotaEncontrada: "mascotas",
  mascotaAdopcion: "mascotas", animalAtropellado: "mascotas", animalAgresivo: "mascotas",
  gatoHerido: "mascotas", aveHerida: "mascotas", perroEnCelo: "mascotas", refugioAnimales: "mascotas",
  arbolDerribado: "ambiente", basuraParque: "ambiente", quemaBasura: "ambiente",
  aguaEstancada: "ambiente", olorQuimico: "ambiente", talaIlegal: "ambiente",
  puntoReciclaje: "ambiente", arbolEnRiesgo: "ambiente", areaProtegida: "ambiente",
  internetCaido: "servicios", senalCelular: "servicios", centroSalud: "servicios",
  colegio: "servicios", transportePublico: "servicios", estacionamiento: "servicios",
  posteDanado: "servicios", aguaPotable: "servicios", bancoCajero: "servicios",
  construccion: "urbanismo", cierreCalle: "urbanismo", nuevoPavimento: "urbanismo",
  veredaNueva: "urbanismo", areaVerdeNueva: "urbanismo", ciclovia: "urbanismo", edificioConstruccion: "urbanismo"
};

const horasExpiracion: { [key: string]: number } = {
  accidente: 12, delito: 24, trafico: 8, clima: 12, incendio: 24, embotellamiento: 8,
  choque: 12, semaforoRoto: 12, calleCortada: 12, objetoPeligroso: 8,
  controlCarabineros: 6, obrasEnVia: 24, calleInundada: 8, manifestacion: 12,
  emergenciaVehicular: 6, actividadDeportiva: 8, reduccionCarril: 8, carreraIlegal: 12,
  semaforoApagado: 12, barreraPeaje: 24, camionVolcado: 12, autoPanne: 8,
  gruaEnVia: 8, pasoSinLuz: 12, motoEnVereda: 8, autoAltaVelocidad: 8,
  asalto: 24, actitudSospechosa: 8, balacera: 48, carabinerosLugar: 6, patrulla: 6,
  camaraSeguridad: 48, zonaOscura: 24, casaAbandonada: 72, alarmaVecinal: 8,
  intentoRobo: 12, personaMerodeando: 8, autoRobado: 24, camaraFalsa: 72,
  carabineroBici: 6, controlIdentidad: 8, ocupacionIlegal: 72, gritosCalle: 8,
  inundacion: 12, accidenteGrave: 12, bomberosLugar: 8, personaHerida: 8,
  rescate: 8, fenomenoClimatico: 12, cortoCircuito: 8, derrumbe: 24,
  alertaSeguridad: 8, ambulanciaLugar: 8, rescateAcuatico: 8, rescateAltura: 8,
  fugaGas: 8, derrumbeParcial: 24, tornado: 12, incendioForestal: 24, alarmaIncendio: 8,
  bache: 96, corteLuz: 8, corteAgua: 12, escombros: 72, maleza: 72,
  perrosCallejeros: 48, veredaMala: 96, mueblesAbandonados: 72, autoAbandonado: 72,
  arbolCaido: 48, cableCaido: 48, zonaEscolar: 48, basuraIlegal: 48,
  escombrosVereda: 48, plagas: 24, perroAbandonado: 48, gatoCallejero: 48,
  mosquitos: 24, ruidoConstruccion: 12, musicaAlta: 8, mueblesCalle: 48,
  senalCaida: 48, perroPerdido: 72, gatoPerdido: 72, mascotaEncontrada: 48,
  mascotaAdopcion: 96, animalAtropellado: 24, animalAgresivo: 12,
  gatoHerido: 24, aveHerida: 24, perroEnCelo: 12, refugioAnimales: 168,
  arbolDerribado: 48, basuraParque: 48, quemaBasura: 12, aguaEstancada: 24,
  olorQuimico: 12, talaIlegal: 48, puntoReciclaje: 168, arbolEnRiesgo: 72,
  areaProtegida: 96, internetCaido: 12, senalCelular: 12, centroSalud: 24,
  colegio: 24, transportePublico: 12, estacionamiento: 12, posteDanado: 48,
  aguaPotable: 12, bancoCajero: 12, construccion: 72, cierreCalle: 24,
  nuevoPavimento: 96, veredaNueva: 96, areaVerdeNueva: 168, ciclovia: 72,
  edificioConstruccion: 168
};

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { tipo, descripcion, lat, lng, imagen } = req.body;
    if (!categoriaMap[tipo]) return res.status(400).json({ error: "Tipo de evento no válido" });
    const expiraEn = new Date();
    expiraEn.setHours(expiraEn.getHours() + (horasExpiracion[tipo] || 6));
    const creador = await Usuario.findById(req.usuario.id, 'nombre premium');
    let imagenUrl = null;
    if (imagen && creador?.premium) imagenUrl = await subirImagenCloudinary(imagen);
    const nuevoReporte = new Reporte({ categoria: categoriaMap[tipo], tipo, descripcion, ubicacion: { coordinates: [lng, lat] }, expiraEn, creadoPor: req.usuario.id, creadoPorNombre: creador?.nombre || 'Anónimo', imagenUrl });
    await nuevoReporte.save();
    try {
      const usuariosCerca = await Usuario.find({ ubicacion: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 50000 } }, pushToken: { $exists: true, $ne: null }, notificacionesActivas: true, _id: { $ne: req.usuario.id } });
      for (const usuario of usuariosCerca) {
        await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: usuario.pushToken, sound: 'default', title: '🚨 Nuevo reporte cerca', body: `${tipo} reportado en tu zona`, data: { reporteId: nuevoReporte._id, tipo, lat, lng } }) });
      }
    } catch (notifError) { console.error('Error enviando notificaciones:', notifError); }
    io.emit('nuevo-reporte', nuevoReporte);
    res.status(201).json(nuevoReporte);
  } catch (error) { console.error("❌ Error al crear reporte:", error); res.status(500).json({ error: "Error al crear reporte" }); }
});

router.get("/cercanos", async (req, res) => {
  try {
    const { lat, lng, radio = 5 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "Latitud y longitud requeridas" });
    const reportes = await Reporte.find({ ubicacion: { $near: { $geometry: { type: "Point", coordinates: [parseFloat(lng as string), parseFloat(lat as string)] }, $maxDistance: parseFloat(radio as string) * 1000 } }, archivado: false, expiraEn: { $gt: new Date() } }).limit(50);
    res.json(reportes);
  } catch (error) { console.error("❌ Error al obtener reportes:", error); res.status(500).json({ error: "Error al obtener reportes" }); }
});

router.get("/filtros", async (req, res) => {
  try {
    const { categoria, tipo, estado, desde, hasta, creadoPor, limit = 50, orden = "desc" } = req.query;
    const filtro: any = {};
    if (categoria) filtro.categoria = categoria;
    if (tipo) filtro.tipo = tipo;
    if (estado) filtro.estado = estado;
    if (creadoPor) filtro.creadoPor = creadoPor;
    if (desde || hasta) { filtro.createdAt = {}; if (desde) filtro.createdAt.$gte = new Date(desde as string); if (hasta) filtro.createdAt.$lte = new Date(hasta as string); }
    const ordenamiento = orden === "asc" ? 1 : -1;
    const reportes = await Reporte.find(filtro).sort({ createdAt: ordenamiento }).limit(Number(limit));
    res.json({ success: true, total: reportes.length, reportes });
  } catch (error) { console.error("❌ Error en filtros:", error); res.status(500).json({ error: "Error al filtrar reportes" }); }
});

router.get("/", async (req, res) => {
  try { const reportes = await Reporte.find().sort({ createdAt: -1 }).limit(100); res.json(reportes); }
  catch (error) { console.error("❌ Error al obtener todos los reportes:", error); res.status(500).json({ error: "Error al obtener reportes" }); }
});

router.get("/:id", async (req, res) => {
  try { const reporte = await Reporte.findById(req.params.id); if (!reporte) return res.status(404).json({ error: "Reporte no encontrado" }); res.json(reporte); }
  catch (error) { console.error("❌ Error al obtener reporte:", error); res.status(500).json({ error: "Error al obtener reporte" }); }
});

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) return res.status(404).json({ error: "Reporte no encontrado" });
    if (reporte.creadoPor.toString() !== req.usuario.id) return res.status(403).json({ error: "Solo el creador puede editar" });
    const { descripcion } = req.body;
    if (descripcion) reporte.descripcion = descripcion;
    await reporte.save();
    io.emit('reporte-actualizado', reporte);
    res.json(reporte);
  } catch (error) { console.error("❌ Error al editar:", error); res.status(500).json({ error: "Error al editar" }); }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) return res.status(404).json({ error: "Reporte no encontrado" });
    if (reporte.creadoPor.toString() !== req.usuario.id) return res.status(403).json({ error: "Solo el creador puede eliminar" });
    reporte.archivado = true;
    await reporte.save();
    io.emit('reporte-actualizado', reporte);
    res.json({ success: true });
  } catch (error) { console.error("❌ Error al eliminar:", error); res.status(500).json({ error: "Error al eliminar" }); }
});

router.post("/:id/confirmar", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) return res.status(404).json({ error: "Reporte no encontrado" });
    const yaConfirmo = reporte.confirmadoPor?.includes(req.usuario.id);
    if (yaConfirmo) return res.status(400).json({ error: "Ya confirmaste este reporte" });
    reporte.confirmaciones += 1;
    reporte.confirmadoPor?.push(req.usuario.id);
    if (reporte.confirmaciones >= 3) reporte.estado = "confirmado";
    await reporte.save();
    io.emit('reporte-actualizado', reporte);
    res.json(reporte);
  } catch (error) { console.error("❌ Error al confirmar reporte:", error); res.status(500).json({ error: "Error al confirmar reporte" }); }
});

router.post("/:id/reportar-falso", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) return res.status(404).json({ error: "Reporte no encontrado" });
    reporte.reportesFalsos += 1;
    if (reporte.reportesFalsos >= 3) { reporte.estado = "falso"; reporte.archivado = true; }
    await reporte.save();
    io.emit('reporte-actualizado', reporte);
    res.json(reporte);
  } catch (error) { console.error("❌ Error al reportar como falso:", error); res.status(500).json({ error: "Error al reportar como falso" }); }
});

router.post("/:id/reaccionar", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params; const { tipo } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    const reporte = await Reporte.findById(id);
    if (!reporte) return res.status(404).json({ error: "Reporte no encontrado" });
    const tiposValidos = ['like', 'urgente', 'peligro'];
    if (!tiposValidos.includes(tipo)) return res.status(400).json({ error: "Tipo no válido" });
    if (!reporte.reacciones) reporte.reacciones = { like: 0, urgente: 0, peligro: 0 };
    if (tipo === 'like') reporte.reacciones.like = (reporte.reacciones.like || 0) + 1;
    else if (tipo === 'urgente') reporte.reacciones.urgente = (reporte.reacciones.urgente || 0) + 1;
    else if (tipo === 'peligro') reporte.reacciones.peligro = (reporte.reacciones.peligro || 0) + 1;
    await reporte.save();
    io.emit('reporte-actualizado', reporte);
    res.json({ success: true, reacciones: reporte.reacciones });
  } catch (error) { console.error("❌ Error al reaccionar:", error); res.status(500).json({ error: "Error al reaccionar" }); }
});

router.post("/:id/comentarios", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params; const { texto } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    if (!texto || texto.trim().length === 0) return res.status(400).json({ error: "El comentario no puede estar vacío" });
    if (texto.length > 300) return res.status(400).json({ error: "Máximo 300 caracteres" });
    const result = await Reporte.updateOne({ _id: id }, { $push: { comentarios: { usuarioId: req.usuario.id, nombre: usuario.nombre, texto: texto.trim(), createdAt: new Date() } } });
    if (result.matchedCount === 0) return res.status(404).json({ error: "Reporte no encontrado" });
    const reporteActualizado = await Reporte.findById(id);
    if (reporteActualizado) io.emit('reporte-actualizado', reporteActualizado);
    res.json({ success: true, mensaje: "Comentario agregado correctamente" });
  } catch (error) { console.error("❌ Error al agregar comentario:", error); res.status(500).json({ error: "Error al agregar comentario" }); }
});

router.get("/:id/comentarios", async (req, res) => {
  try { const { id } = req.params; const reporte = await Reporte.findById(id).select('comentarios').lean(); if (!reporte) return res.status(404).json({ error: "Reporte no encontrado" }); const comentarios = (reporte as any).comentarios || []; res.json({ success: true, comentarios, total: comentarios.length }); }
  catch (error) { console.error("❌ Error al obtener comentarios:", error); res.status(500).json({ error: "Error al obtener comentarios" }); }
});

router.post("/test-notification", async (req, res) => {
  try {
    const { to, title, body, sound = 'default' } = req.body;
    const message = { to, sound, title: title || 'Radar Urbano', body: body || 'Notificación de prueba', priority: 'high', data: { type: 'test' } };
    const response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
    const result = await response.json();
    res.json({ success: true, expoResponse: result });
  } catch (error) { console.error('❌ Error:', error); res.status(500).json({ error: 'Error al enviar notificación' }); }
});

export default router;
