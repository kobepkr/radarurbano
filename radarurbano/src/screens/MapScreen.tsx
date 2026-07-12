import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  TextInput,
  Image
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import PulseMarker from '../components/PulseMarker';
import EventCard from '../components/EventCard';
import CustomAlert from '../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse } from 'axios';
import { Share } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { 
  Menu, User,
  X, MapPin, Layout, Car, ShieldPlus, Siren, Home,
  Clock, AlertCircle, Power, XCircle, AlertTriangle,
  EyeOff, Target, Flame, Droplet, Circle, PowerOff,
  DropletOff, CheckCircle, Share2, ScrollText, RefreshCw
} from 'lucide-react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import * as ImagePicker from 'expo-image-picker';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { offlineReportService, OfflineReport } from '../services/OfflineReportService';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { CommentSection } from '../components/CommentSection';
import { Send } from 'lucide-react-native';
import { regionesChile, RegionChile } from '../utils/regiones';
import { getAddress } from '../utils/geocoding';
import { getIconoMarker } from '../utils/iconos';

const ModalIcon = ({ tipo, emoji }: { tipo: string; emoji: string }) => {
  const png = getIconoMarker(tipo);
  return png ? <Image source={png} style={{ width: 32, height: 32 }} resizeMode="contain" /> : <Text style={styles.optionEmoji}>{emoji}</Text>;
};








const API_URL = 'https://radarurbano-1.onrender.com/api';
const SOCKET_URL = 'https://radarurbano-1.onrender.com'

interface Reporte {
  _id: string;
  tipo: string;
  descripcion: string;
  ubicacion: {
    coordinates: [number, number];
  };
  confirmaciones: number;
  reportesFalsos: number;
  estado: string;
  archivado: boolean;
  createdAt?: string;
  confirmadoPor?: string[];
  reacciones?: {
    like?: number;
    urgente?: number;
    peligro?: number;
  };
    comentarios?: Array<{
      _id?: string;
      usuarioId: string;
      nombre: string;
      texto: string;
      createdAt: string;
    }>;
    imagenUrl?: string | null;
  }

interface Coordinate {
  latitude: number;
  longitude: number;
}

type RootDrawerParamList = {
  MapScreen: undefined;
  Profile: undefined;
};

export default function MapScreen({ mapaOscuro }: { mapaOscuro: boolean }) {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();
  
  // ========== STATES ==========
  const [region, setRegion] = useState<any>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'RECENT' | 'TRENDING'>('RECENT');
  const [sheetIndex, setSheetIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const { isOnline } = useNetworkStatus();
  const [pendingOfflineReports, setPendingOfflineReports] = useState<OfflineReport[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [esPremium, setEsPremium] = useState(false);
  const [vistasPorReporte, setVistasPorReporte] = useState<{ [key: string]: number }>({});
  const [comentariosVistos, setComentariosVistos] = useState<{ [key: string]: number }>({});
  const LIMITE_VISTAS = 5;
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [reporteParaComentar, setReporteParaComentar] = useState<Reporte | null>(null);
  const [descripcionCustom, setDescripcionCustom] = useState('');
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editReporteId, setEditReporteId] = useState<string | null>(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [regionSeleccionada, setRegionSeleccionada] = useState(0);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false);
  const [ordenActual, setOrdenActual] = useState<string>('recientes');
  const [ordenDropdownOpen, setOrdenDropdownOpen] = useState(false);
  const [reportesConfirmados, setReportesConfirmados] = useState<Set<string>>(new Set());
  const [userIdActual, setUserIdActual] = useState<string>('');
  const [direcciones, setDirecciones] = useState<{ [key: string]: string }>({});
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
  });

  
  // ========== REFS ==========
  const mapRef = useRef<MapView>(null);
  const socketRef = useRef<any>(null);
  const isSocketConnected = useRef(false);
  const snapPoints = ['15%', '50%', '80%'];
  
  
  // ========== COLORES ==========
  const colores: { [key: string]: string } = {
    embotellamiento: '#FF6B6B',
    choque: '#FF4444',
    semaforoRoto: '#FFD93D',
    calleCortada: '#FF8C42',
    asalto: '#B22222',
    actitudSospechosa: '#9370DB',
    balacera: '#8B0000',
    incendio: '#FF5722',
    inundacion: '#4A90E2',
    bache: '#8B4513',
    corteLuz: '#2C3E50',
    corteAgua: '#3498DB',
    accidente: '#FF9800',
    delito: '#F44336',
    trafico: '#FFC107',
    clima: '#2196F3'
  };



const formatearTiempoRelativo = (fecha: string): string => {
  const ahora = new Date();
  const reporte = new Date(fecha);
  const diffMs = ahora.getTime() - reporte.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  if (diffDias < 7) return `Hace ${diffDias} días`;
  return reporte.toLocaleDateString('es-CL');
};

const getCategoriaReporte = (tipo: string): string => {
  const catMap: { [key: string]: string } = {
    embotellamiento: 'transito', choque: 'transito', semaforoRoto: 'transito',
    calleCortada: 'transito', accidente: 'transito', trafico: 'transito',
    objetoPeligroso: 'transito', controlCarabineros: 'transito', obrasEnVia: 'transito',
    calleInundada: 'transito', manifestacion: 'transito', emergenciaVehicular: 'transito',
    actividadDeportiva: 'transito', bache: 'transito',
    reduccionCarril: 'transito', carreraIlegal: 'transito', semaforoApagado: 'transito',
    barreraPeaje: 'transito', camionVolcado: 'transito', autoPanne: 'transito',
    gruaEnVia: 'transito', pasoSinLuz: 'transito', motoEnVereda: 'transito', autoAltaVelocidad: 'transito',
    asalto: 'seguridad', actitudSospechosa: 'seguridad', balacera: 'seguridad',
    delito: 'seguridad', carabinerosLugar: 'seguridad', patrulla: 'seguridad',
    camaraSeguridad: 'seguridad', zonaOscura: 'seguridad', casaAbandonada: 'seguridad',
    alarmaVecinal: 'seguridad', intentoRobo: 'seguridad', personaMerodeando: 'seguridad',
    autoRobado: 'seguridad', camaraFalsa: 'seguridad', carabineroBici: 'seguridad',
    controlIdentidad: 'seguridad', ocupacionIlegal: 'seguridad', gritosCalle: 'seguridad',
    incendio: 'emergencias', inundacion: 'emergencias', clima: 'emergencias',
    accidenteGrave: 'emergencias', bomberosLugar: 'emergencias', personaHerida: 'emergencias',
    rescate: 'emergencias', fenomenoClimatico: 'emergencias', cortoCircuito: 'emergencias',
    derrumbe: 'emergencias', alertaSeguridad: 'emergencias',
    corteLuz: 'comunidad', corteAgua: 'comunidad',
    escombros: 'comunidad', maleza: 'comunidad', perrosCallejeros: 'comunidad',
    veredaMala: 'comunidad', mueblesAbandonados: 'comunidad', autoAbandonado: 'comunidad',
    arbolCaido: 'comunidad', cableCaido: 'comunidad', zonaEscolar: 'comunidad',
  };
  return catMap[tipo] || 'comunidad';
};

const getNombreTipo = (tipo: string): string => {
  const nombres: { [key: string]: string } = {
    embotellamiento: 'Embotellamiento', choque: 'Choque', semaforoRoto: 'Semáforo roto',
    calleCortada: 'Calle cortada', accidente: 'Accidente', trafico: 'Tráfico',
    objetoPeligroso: 'Objeto peligroso', controlCarabineros: 'Control Carabineros',
    obrasEnVia: 'Obras en la vía', calleInundada: 'Calle inundada',
    manifestacion: 'Manifestación', emergenciaVehicular: 'Emergencia vehicular',
    actividadDeportiva: 'Actividad deportiva',
    asalto: 'Asalto', actitudSospechosa: 'Actitud sospechosa', balacera: 'Balacera',
    delito: 'Delito', carabinerosLugar: 'Carabineros en el lugar', patrulla: 'Patrulla',
    camaraSeguridad: 'Cámara de seguridad', zonaOscura: 'Zona oscura',
    casaAbandonada: 'Casa abandonada',
    incendio: 'Incendio', inundacion: 'Inundación', clima: 'Fenómeno climático',
    accidenteGrave: 'Accidente grave', bomberosLugar: 'Bomberos en el lugar',
    personaHerida: 'Persona herida', rescate: 'Rescate',
    fenomenoClimatico: 'Fenómeno climático severo', cortoCircuito: 'Corto circuito',
    derrumbe: 'Derrumbe', alertaSeguridad: 'Alerta de seguridad',
    bache: 'Bache', corteLuz: 'Corte de luz', corteAgua: 'Corte de agua',
    escombros: 'Escombros', maleza: 'Maleza', perrosCallejeros: 'Perros callejeros',
    veredaMala: 'Vereda en mal estado', mueblesAbandonados: 'Muebles abandonados',
    autoAbandonado: 'Auto abandonado', arbolCaido: 'Árbol caído',
    cableCaido: 'Cable caído', zonaEscolar: 'Zona escolar',
  };
  return nombres[tipo] || tipo;
};

const getIconoPorTipo = (tipo: string): string => {
  const iconos: { [key: string]: string } = {
    embotellamiento: '🚗', choque: '💥', semaforoRoto: '🚦',
    calleCortada: '🚧', accidente: '🚘', trafico: '🚙',
    objetoPeligroso: '⚠️', controlCarabineros: '👮',
    obrasEnVia: '🏗️', calleInundada: '💧',
    manifestacion: '✊', emergenciaVehicular: '🛟',
    actividadDeportiva: '🏃', bache: '🕳️',
    asalto: '💀', actitudSospechosa: '👁️', balacera: '💥',
    delito: '⚠', carabinerosLugar: '👮', patrulla: '🚔',
    camaraSeguridad: '📷', zonaOscura: '🌑', casaAbandonada: '🏚',
    incendio: '🔥', inundacion: '🌊', clima: '🌧',
    accidenteGrave: '🚑', bomberosLugar: '🚒', personaHerida: '🩹',
    rescate: '🆘', fenomenoClimatico: '⛈', cortoCircuito: '⚡',
    derrumbe: '🪨', alertaSeguridad: '🚨',
    corteLuz: '💡', corteAgua: '🚰',
    escombros: '🧱', maleza: '🌿', perrosCallejeros: '🐕',
    veredaMala: '👣', mueblesAbandonados: '🛋', autoAbandonado: '🚙',
    arbolCaido: '🌲', cableCaido: '🔌', zonaEscolar: '🏫',
    basuraIlegal: '🗑️', escombrosVereda: '🧱', plagas: '🐀',
    perroAbandonado: '🐕', gatoCallejero: '🐈', mosquitos: '🦟',
    ruidoConstruccion: '🔇', musicaAlta: '🔊', mueblesCalle: '🪑', senalCaida: '🛑',
    perroPerdido: '🐕', gatoPerdido: '🐈', mascotaEncontrada: '🐾',
    mascotaAdopcion: '🏡', animalAtropellado: '🚗', animalAgresivo: '🐕',
    gatoHerido: '🐈', aveHerida: '🐦', perroEnCelo: '❤️', refugioAnimales: '🏠',
    arbolDerribado: '🌳', basuraParque: '🗑️', quemaBasura: '🔥',
    aguaEstancada: '💧', olorQuimico: '⚠️', talaIlegal: '🪓',
    puntoReciclaje: '♻️', arbolEnRiesgo: '🌱', areaProtegida: '🏞️',
    internetCaido: '📡', senalCelular: '📱', centroSalud: '🏥',
    colegio: '🏫', transportePublico: '🚌', estacionamiento: '🅿️',
    posteDanado: '💡', aguaPotable: '🚰', bancoCajero: '🏦',
    reduccionCarril: '🚧', carreraIlegal: '🏍️', semaforoApagado: '🚦',
    barreraPeaje: '🚧', camionVolcado: '🚛', autoPanne: '🚗',
    gruaEnVia: '🏗️', pasoSinLuz: '🚶', motoEnVereda: '🛵', autoAltaVelocidad: '🚗',
    alarmaVecinal: '🚨', intentoRobo: '🏠', personaMerodeando: '🔦',
    autoRobado: '🚗', camaraFalsa: '📷', carabineroBici: '🚴',
    controlIdentidad: '🪪', ocupacionIlegal: '🏚️', gritosCalle: '🔊',
    ambulanciaLugar: '🚑', rescateAcuatico: '🛟', rescateAltura: '⛑️',
    fugaGas: '💨', derrumbeParcial: '🏢', tornado: '🌪️',
    incendioForestal: '🧯', alarmaIncendio: '🚨',
  };
  return iconos[tipo] || '📍';
};



  // ========== FUNCIONES ==========
  const cargarReportes = async (lat: number, lng: number, radio: number = 50) => {
    const storedRadio = await AsyncStorage.getItem('radioBusqueda');
    const radioKm = storedRadio ? Number(storedRadio) : radio;
    const maxRadio = esPremium ? 500 : 100;
    const radioFinal = Math.min(radioKm, maxRadio);
    try {
      const response: AxiosResponse<Reporte[]> = await axios.get(`${API_URL}/reportes/cercanos`, {
        params: { lat, lng, radio: radioFinal }
      });
      
      const reportesLimpios = response.data.map(reporte => ({
        ...reporte,
        confirmadoPor: Array.isArray(reporte.confirmadoPor) ? reporte.confirmadoPor : [],
        confirmaciones: typeof reporte.confirmaciones === 'number' ? reporte.confirmaciones : 0,
        reportesFalsos: typeof reporte.reportesFalsos === 'number' ? reporte.reportesFalsos : 0,
        tipo: reporte.tipo || '',
        descripcion: reporte.descripcion || '',
        estado: reporte.estado || 'no_confirmado',
      }));
      
      setReportes(reportesLimpios);
    } catch (error) {
      console.error('Error cargando reportes:', error); 
    }
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };




const crearReporte = async (tipo: string, coordinate: Coordinate | null) => {
  const targetCoord = selectedCoordinate || coordinate;
  if (!targetCoord) return;
  
  setLoadingReporte(true);
  
  try {
    if (isOnline) {
      const desc = esPremium && descripcionCustom.trim()
        ? descripcionCustom.trim()
        : `Reporte de ${getNombreTipo(tipo)}`;
      
      const response: AxiosResponse<Reporte> = await axios.post(`${API_URL}/reportes`, {
        tipo,
        descripcion: esPremium && descripcionCustom.trim() ? descripcionCustom.trim() : `Reporte de ${getNombreTipo(tipo)}`,
        lat: targetCoord.latitude,
        lng: targetCoord.longitude,
        imagen: imagenSeleccionada
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const nuevoReporte = response.data;
      setReportes(prev => [nuevoReporte, ...prev]);
      setModalVisible(false);
      setSelectedCoordinate(null);
      setDescripcionCustom('');
      setImagenSeleccionada(null);
      await AsyncStorage.setItem('ultimaFechaReporte', new Date().toISOString().split('T')[0]);
      mapRef.current?.animateToRegion({
        latitude: targetCoord.latitude,
        longitude: targetCoord.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
      showAlert('✅ Éxito', 'Reporte creado correctamente', 'success');
      
    } else {
      const offlineId = await offlineReportService.saveOfflineReport({
        tipo,
        descripcion: `Reporte de ${tipo}`,
        lat: targetCoord.latitude,
        lng: targetCoord.longitude
      });
      
      const tempReporte: Reporte = {
        _id: offlineId,
        tipo,
        descripcion: `📱 ${tipo} (pendiente de sincronizar)`,
        ubicacion: {
          coordinates: [targetCoord.longitude, targetCoord.latitude]
        },
        confirmaciones: 0,
        reportesFalsos: 0,
        estado: 'no_confirmado',
        archivado: false,
        createdAt: new Date().toISOString(),
      };
      
      setReportes(prev => [tempReporte, ...prev]);
      
      // Actualizar lista de pendientes
      const pending = await offlineReportService.getPendingReports();
      setPendingOfflineReports(pending.filter(r => r.status === 'pending'));
      
      setModalVisible(false);
      showAlert('📱 Modo offline', 'Reporte guardado localmente. Se sincronizará cuando vuelva internet.', 'info');
    }
    
  } catch (error) {
    console.error('Error creando reporte:', error);
    showAlert('❌ Error', 'No se pudo crear el reporte', 'error');
  } finally {
    setLoadingReporte(false);
  }
};


  const verificarLimiteAntesCrear = async () => {
    try {
      const t = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/usuarios/limite-reportes`, {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      
      if (response.data.es_premium) {
        return true;
      }
      
      if (response.data.restantes <= 0) {
        showAlert(
          'Límite alcanzado',
          `Hoy ya usaste tus ${response.data.limite} reportes. Vuelve mañana.`,
          'info'
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando límite:', error);
      return true;
    }
  };

  const confirmarReporte = async (id: string) => {
    try {
      await axios.post(`${API_URL}/reportes/${id}/confirmar`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReportesConfirmados(prev => new Set(prev).add(id));
      const confDadas = await AsyncStorage.getItem('confirmacionesDadas');
      await AsyncStorage.setItem('confirmacionesDadas', String((confDadas ? Number(confDadas) : 0) + 1));
    } catch (error: any) {
      if (error.response?.status === 400) {
        showAlert('⚠️ Ya confirmado', 'Ya habías confirmado este reporte', 'info');
      } else {
        showAlert('❌ Error', 'No se pudo confirmar el reporte', 'error');
      }
    }
  };

  const reportarFalso = async (id: string) => {
    try {
      await axios.post(`${API_URL}/reportes/${id}/reportar-falso`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showAlert('⚠️ Reportado', 'Reporte marcado como falso', 'info');
    } catch (error) {
      console.error('Error reportando falso:', error);
      showAlert('❌ Error', 'No se pudo reportar como falso', 'error');
    }
  };

  const eliminarReporte = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/reportes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReportes(prev => prev.filter(r => r._id !== id));
      setCardModalVisible(false);
      showAlert('✅ Eliminado', 'Reporte eliminado correctamente', 'success');
    } catch (error) {
      showAlert('❌ Error', 'No se pudo eliminar', 'error');
    }
  };

  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      setImagenSeleccionada(result.assets[0].base64);
    }
  };

  const editarReporte = async () => {
    if (!editReporteId) return;
    try {
      const body: any = {};
      if (editDescripcion.trim()) body.descripcion = editDescripcion.trim();
      if (imagenSeleccionada) body.imagen = imagenSeleccionada;
      if (Object.keys(body).length === 0) { setEditModalVisible(false); return; }
      
      await axios.put(`${API_URL}/reportes/${editReporteId}`, body,
        { headers: { 'Authorization': `Bearer ${token}` } });
      setReportes(prev => prev.map(r => r._id === editReporteId 
        ? { ...r, descripcion: editDescripcion.trim() || r.descripcion } 
        : r));
      setEditModalVisible(false);
      setImagenSeleccionada(null);
      showAlert('✅ Editado', 'Reporte actualizado correctamente', 'success');
    } catch (error) {
      showAlert('❌ Error', 'No se pudo editar', 'error');
    }
  };



  const reaccionarReporte = async (reporteId: string, tipo: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/reportes/${reporteId}/reaccionar`,
      { tipo },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      // Actualizar el reporte en el estado con las nuevas reacciones
      setReportes(prev => prev.map(r => 
        r._id === reporteId 
          ? { ...r, reacciones: response.data.reacciones }
          : r
      ));
    }
  } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'No se pudo agregar la reacción';
      console.error('Error al reaccionar:', error);
      showAlert('❌ Error', msg, 'error');
  }
};




  const compartirReporte = async (reporte: Reporte) => {
    try {
      const [lng, lat] = reporte.ubicacion.coordinates;
      const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
      const mensaje = 
        `🚨 *${getNombreTipo(reporte.tipo)}* 🚨\n\n` +
        `${reporte.descripcion}\n\n` +
        `📍 Ver en mapa: ${mapsLink}\n` +
        `✅ Confirmaciones: ${reporte.confirmaciones}\n` +
        `📊 Estado: ${reporte.estado === 'confirmado' ? 'Confirmado' : reporte.estado === 'falso' ? 'Falso' : 'Pendiente'}\n\n` +
        `🕒 ${new Date(reporte.createdAt || '').toLocaleString()}\n\n` +
        `Compartido desde Radar Urbano`;

      await Share.share({
        message: mensaje,
        title: 'Compartir reporte',
      });
    } catch (error) {
      console.error('Error compartiendo:', error);
      showAlert('Error', 'No se pudo compartir el reporte', 'error');
    }
  };

  const mostrarOpcionesCard = async (reporte: Reporte) => {
    if (!esPremium) {
      const vistasActuales = (vistasPorReporte[reporte._id] || 0) + 1;
      const nuevoVistas = { ...vistasPorReporte, [reporte._id]: vistasActuales };
      setVistasPorReporte(nuevoVistas);
      await AsyncStorage.setItem('vistasPorReporte', JSON.stringify(nuevoVistas));
      if (vistasActuales > LIMITE_VISTAS) {
        Alert.alert(
          '⭐ Límite alcanzado',
          `Ya viste esta alerta ${LIMITE_VISTAS} veces. Hacerte Premium para verla sin límites.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setSelectedReporte(reporte);
    setCardModalVisible(true);
  };

  const formatearDistancia = (distancia: number): string => {
    if (distancia < 0.1) {
      return `${Math.round(distancia * 1000)} m`;
    }
    if (distancia < 1) {
      return `${(distancia * 1000).toFixed(0)} m`;
    }
    return `${distancia.toFixed(1)} km`;
  };

  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

 
  // ========== EFECTO 1: INICIALIZACIÓN ==========
useEffect(() => {
  let isMounted = true;
  
  const inicializar = async () => {
    try {
      console.log('🔵 Inicializando app...');
      
      const t = await AsyncStorage.getItem('token');  
      console.log('🔑 MI TOKEN ES:', t);
      if (isMounted) setToken(t || '');

       
      // ✅ NUEVO: CARGAR DATOS DEL USUARIO PARA SABER SI ES PREMIUM
      const usuarioStr = await AsyncStorage.getItem('usuario');
      console.log('📦 USUARIO EN ASYNCSTORAGE:', usuarioStr);
      if (usuarioStr && isMounted) {
        const usuario = JSON.parse(usuarioStr);
        setEsPremium(usuario.premium || false);
        setUserIdActual(usuario.id || '');
        console.log('👤 Usuario premium:', usuario.premium);
      }

      const vistasStr = await AsyncStorage.getItem('vistasPorReporte');
      if (vistasStr && isMounted) setVistasPorReporte(JSON.parse(vistasStr));
      const comentariosStr = await AsyncStorage.getItem('comentariosVistos');
      if (comentariosStr && isMounted) setComentariosVistos(JSON.parse(comentariosStr));
      
      console.log('🔵 Solicitando permisos...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso de ubicación denegado');
        if (isMounted) setLoading(false);
        return;
      }
      
      console.log('🔵 Obteniendo ubicación...');
      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      console.log('🔵 Ubicación:', newRegion.latitude, newRegion.longitude);
      if (isMounted) setRegion(newRegion);
      
      console.log('🔵 Cargando reportes...');
      await cargarReportes(newRegion.latitude, newRegion.longitude);
      
      const targetLat = await AsyncStorage.getItem('targetLat');
      const targetLng = await AsyncStorage.getItem('targetLng');
      if (targetLat && targetLng && isMounted) {
        const tLat = parseFloat(targetLat);
        const tLng = parseFloat(targetLng);
        setRegion({ latitude: tLat, longitude: tLng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        setTimeout(() => {
          mapRef.current?.animateToRegion({ latitude: tLat, longitude: tLng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 800);
        }, 1000);
        await AsyncStorage.removeItem('targetLat');
        await AsyncStorage.removeItem('targetLng');
      }
      
      console.log('✅ Inicialización completa');
      if (isMounted) setLoading(false);
      
    } catch (error) {
      console.error('❌ Error en inicialización:', error);
      if (isMounted) setLoading(false);
    }
  };
  
  inicializar();
  
  return () => {
    isMounted = false;
  };
}, []);

  // ========== EFECTO 2: SOCKET.IO ==========
  useEffect(() => {
    if (isSocketConnected.current) {
      console.log('⚠️ Socket ya conectado, ignorando');
      return;
    }

    console.log('🔌 Conectando a WebSocket...');
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket conectado correctamente');
      isSocketConnected.current = true;
    });

    socketRef.current.on('nuevo-reporte', (nuevoReporte: Reporte) => {
      console.log('📢 Nuevo reporte recibido:', nuevoReporte._id);
      
      setReportes(prev => {
        const existe = prev.find(r => r._id === nuevoReporte._id);
        if (existe) return prev;

        if (userLocation) {
          const [rLng, rLat] = nuevoReporte.ubicacion.coordinates;
          const dist = calcularDistancia(userLocation.latitude, userLocation.longitude, rLat, rLng);
          if (dist > 50) return prev;
        }

        return [nuevoReporte, ...prev];
      });
    });

    socketRef.current.on('reporte-actualizado', (reporteActualizado: Reporte) => {
      console.log('🔄 Reporte actualizado:', reporteActualizado._id);
      
      setReportes(prev => {
        if (reporteActualizado.archivado) {
          console.log('🗑️ Eliminando reporte archivado');
          return prev.filter(r => r._id !== reporteActualizado._id);
        }
        
        const existe = prev.some(r => r._id === reporteActualizado._id);
        if (existe) {
          return prev.map(r => r._id === reporteActualizado._id ? reporteActualizado : r);
        }
        
        return [reporteActualizado, ...prev];
      });
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔴 Socket desconectado');
      isSocketConnected.current = false;
    });

    socketRef.current.on('connect_error', (error: any) => {
      console.error('❌ Error de conexión:', error.message);
    });

    return () => {
      console.log('🧹 Desconectando socket...');
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      isSocketConnected.current = false;
    };
  }, []);

  // ========== EFECTO 3: ACTUALIZAR UBICACIÓN ==========
  useEffect(() => {
    const actualizar = async () => {
      if (!region || !token) return;
      try {
        await axios.post(`${API_URL}/usuarios/ubicacion`, {
          lat: region.latitude,
          lng: region.longitude
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error actualizando ubicación:', error);
      }
    };
    
    actualizar();
  }, [region, token]);

// ========== EFECTO 4: CARGAR REPORTES PENDIENTES OFFLINE ==========
useEffect(() => {
  const loadPendingReports = async () => {
    const pending = await offlineReportService.getPendingReports();
    setPendingOfflineReports(pending.filter(r => r.status === 'pending' || r.status === 'syncing'));
    console.log('📱 Reportes pendientes offline:', pending.length);
  };
  loadPendingReports();
}, []);

// ========== EFECTO 5: SINCRONIZAR CUANDO HAY CONEXIÓN ==========
useEffect(() => {
  const syncIfOnline = async () => {
    if (isOnline && !syncing) {
      const pendingCount = await offlineReportService.getPendingCount();
      if (pendingCount > 0) {
        setSyncing(true);
        const tokenStored = await AsyncStorage.getItem('token');
        if (tokenStored) {
          console.log('🔄 Iniciando sincronización de reportes offline...');
          const result = await offlineReportService.syncPendingReports(tokenStored);
          console.log(`✅ Sincronización completada: ${result.synced} OK, ${result.failed} fallidos`);
          
          // Recargar reportes después de sincronizar
          if (region) {
            await cargarReportes(region.latitude, region.longitude);
          }
          
          // Actualizar lista de pendientes
          const pending = await offlineReportService.getPendingReports();
          setPendingOfflineReports(pending.filter(r => r.status === 'pending' || r.status === 'syncing'));
        }
        setSyncing(false);
      }
    }
  };
  
  syncIfOnline();
}, [isOnline, region]);

// Obtener ubicación del usuario
useEffect(() => {
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  };
  getLocation();
}, []);

useEffect(() => {
  const resolverDirecciones = async () => {
    for (const r of reportes) {
      if (!direcciones[r._id]) {
        const addr = await getAddress(r.ubicacion.coordinates[1], r.ubicacion.coordinates[0]);
        setDirecciones(prev => ({ ...prev, [r._id]: addr }));
      }
    }
  };
  if (reportes.length > 0) resolverDirecciones();
}, [reportes]);

const centrarMapa = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const cambiarRegion = async (index: number) => {
    setRegionSeleccionada(index);
    const regionData = regionesChile[index];
    
    if (index === 0) {
      // Mi ubicación
      if (userLocation) {
        const newRegion = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
        await cargarReportes(userLocation.latitude, userLocation.longitude, 50);
      }
    } else {
      // Región seleccionada
      const newRegion = {
        latitude: regionData.lat,
        longitude: regionData.lng,
        latitudeDelta: regionData.radio / 50,
        longitudeDelta: regionData.radio / 50,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);
      await cargarReportes(regionData.lat, regionData.lng, regionData.radio);
    }
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  const mapDarkStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
    { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
    { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
    { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] },
  ];

  const mapLightStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  ];

  return (
    <View style={[styles.container, { backgroundColor: mapaOscuro ? '#000' : '#FFF' }]}>
      {region && (
        <MapView
          ref={mapRef}
          provider="google"
          key={mapaOscuro ? 'dark' : 'light'}
          style={styles.map}
          region={region}
          showsUserLocation
          showsMyLocationButton={false}
          customMapStyle={mapaOscuro ? mapDarkStyle : undefined}
          onLongPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedCoordinate({ latitude, longitude });
          }}
        >
          {[...new Map(reportes.map(r => [r._id, r])).values()].map((reporte) => {
            const icono = getIconoPorTipo(reporte.tipo);
            const color = colores[reporte.tipo] || '#757575';
            
            return (
              <PulseMarker
                key={reporte._id}
                coordinate={{
                  latitude: reporte.ubicacion.coordinates[1],
                  longitude: reporte.ubicacion.coordinates[0]
                }}
                color={color}
                icono={icono}
                tipo={reporte.tipo}
                onPress={() => mostrarOpcionesCard(reporte)}
              />
            );
          })}
          
          {selectedCoordinate && (
            <Marker
              coordinate={selectedCoordinate}
              title="Ubicación seleccionada"
              description="Mantené presionado en otro lugar para cambiarla"
              pinColor="#DC2626"
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setSelectedCoordinate({ latitude, longitude });
              }}
            />
          )}
        </MapView>
      )}
      
      <View style={styles.headerContainer}>
        {/* Botón personalizado para centrar mapa */} 
          <TouchableOpacity 
            style={styles.customLocationButton}
            onPress={centrarMapa}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        {/* Botón de refrescar */}
        <TouchableOpacity 
          style={styles.customLocationButton}
          onPress={() => region && cargarReportes(region.latitude, region.longitude)}
        >
          <RefreshCw size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Menu size={28} color={mapaOscuro ? "#FFF" : "#000"} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: '#DC2626' }]}>RADAR URBANO{esPremium ? ' ⭐' : ''}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <User size={28} color={mapaOscuro ? "#FFF" : "#000"} />
        </TouchableOpacity>
      </View>

            {/* Indicador de estado de conexión */}
      <ConnectionStatus pendingCount={pendingOfflineReports.length} />

      <TouchableOpacity    
        style={styles.botonReportar}
        onPress={() => setModalVisible(true)}
        >
        <Text style={styles.botonTexto}>+</Text>
      </TouchableOpacity>



      {/* Modal para crear reportes */}
      {/* Modal para crear reportes */}
<Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
  <View style={styles.modernModalOverlay}>
    <View style={styles.modernModalContent}>
      <View style={styles.modernModalHeader}>
        <View>
          <Text style={styles.modernModalTitle}>Nuevo reporte</Text>
          <Text style={styles.modernModalSubtitle}>¿Qué está pasando?</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modernCloseButton}>
          <X size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.locationCard}>
        <MapPin size={20} color="#DC2626" />
        {selectedCoordinate ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.locationText}>📍 Elegida en el mapa</Text>
            <TouchableOpacity 
              onPress={() => setSelectedCoordinate(null)}
              style={{ padding: 4 }}
            >
              <X size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={() => {
              setModalVisible(false);
              showAlert('🗺️ Elegir ubicación', 'Mantené presionado en cualquier parte del mapa para seleccionar dónde reportar. Luego apretá + de nuevo.', 'info');
            }}
          >
            <Text style={styles.locationText}>📍 Mi ubicación actual</Text>
            <Text style={{ color: '#DC2626', fontSize: 12 }}>Cambiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {esPremium && (
        <>
          <View style={{ marginBottom: 16 }}>
            <TextInput
              style={styles.descripcionInput}
              placeholder="Describí la alerta (opcional, máx 200 caracteres)"
              placeholderTextColor="#8E8E93"
              value={descripcionCustom}
              onChangeText={setDescripcionCustom}
              maxLength={200}
              multiline
            />
          </View>
          <TouchableOpacity style={styles.imagenButton} onPress={seleccionarImagen}>
            <Text style={styles.imagenButtonText}>
              {imagenSeleccionada ? '📸 Foto seleccionada (tocar para cambiar)' : '📷 Agregar foto a la alerta'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.sectionTitle}>Categorías</Text>
      
      <ScrollView style={styles.modernModalScroll} showsVerticalScrollIndicator={false}>

        {/* 🚦 TRÁNSITO */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryIconEmoji}>🚦</Text>
            <Text style={styles.categorySectionTitle}>TRÁNSITO</Text>
          </View>
          <View style={styles.modernOptionsGrid}>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('embotellamiento', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🚗</Text>
              <Text style={styles.modernOptionText}>Embotellamiento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('choque', region)} disabled={loadingReporte}>
              <ModalIcon tipo="choque" emoji="💥" />
              <Text style={styles.modernOptionText}>Choque</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('semaforoRoto', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🚦❌</Text>
              <Text style={styles.modernOptionText}>Semáforo roto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('calleCortada', region)} disabled={loadingReporte}>
              <ModalIcon tipo="calleCortada" emoji="🚧" />
              <Text style={styles.modernOptionText}>Calle cortada</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('objetoPeligroso', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>⚠️</Text>
              <Text style={styles.modernOptionText}>Objeto peligroso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('controlCarabineros', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>👮‍♂️🚔</Text>
              <Text style={styles.modernOptionText}>Control Carabineros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('obrasEnVia', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🏗️</Text>
              <Text style={styles.modernOptionText}>Obras en la vía</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('calleInundada', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>💧🚗</Text>
              <Text style={styles.modernOptionText}>Calle inundada</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('manifestacion', region)} disabled={loadingReporte}>
              <ModalIcon tipo="manifestacion" emoji="✊" />
              <Text style={styles.modernOptionText}>Manifestación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('emergenciaVehicular', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🚘⚠️</Text>
              <Text style={styles.modernOptionText}>Emergencia vehicular</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('actividadDeportiva', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🏃‍♂️</Text>
              <Text style={styles.modernOptionText}>Actividad deportiva</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('bache', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🕳️</Text>
              <Text style={styles.modernOptionText}>Bache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 👮‍♂️ SEGURIDAD */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryIconEmoji}>👮‍♂️</Text>
            <Text style={styles.categorySectionTitle}>SEGURIDAD</Text>
          </View>
          <View style={styles.modernOptionsGrid}>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('asalto', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>👊💰</Text>
              <Text style={styles.modernOptionText}>Asalto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('actitudSospechosa', region)} disabled={loadingReporte}>
              <ModalIcon tipo="actitudSospechosa" emoji="👀" />
              <Text style={styles.modernOptionText}>Actitud sospechosa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('balacera', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>💥💥💥</Text>
              <Text style={styles.modernOptionText}>Balacera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('carabinerosLugar', region)} disabled={loadingReporte}>
              <ModalIcon tipo="carabinerosLugar" emoji="👮‍♂️" />
              <Text style={styles.modernOptionText}>Carabineros en el lugar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('patrulla', region)} disabled={loadingReporte}>
              <ModalIcon tipo="patrulla" emoji="🚔" />
              <Text style={styles.modernOptionText}>Patrulla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('camaraSeguridad', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>📹</Text>
              <Text style={styles.modernOptionText}>Cámara de seguridad</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('zonaOscura', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🌑</Text>
              <Text style={styles.modernOptionText}>Zona oscura</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('casaAbandonada', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🏚️</Text>
              <Text style={styles.modernOptionText}>Casa abandonada</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🚑 EMERGENCIAS */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryIconEmoji}>🚑</Text>
            <Text style={styles.categorySectionTitle}>EMERGENCIAS</Text>
          </View>
          <View style={styles.modernOptionsGrid}>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('incendio', region)} disabled={loadingReporte}>
              <ModalIcon tipo="incendio" emoji="🔥" />
              <Text style={styles.modernOptionText}>Incendio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('inundacion', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🌊</Text>
              <Text style={styles.modernOptionText}>Inundación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('accidenteGrave', region)} disabled={loadingReporte}>
              <ModalIcon tipo="accidenteGrave" emoji="🚑💥" />
              <Text style={styles.modernOptionText}>Accidente grave</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('bomberosLugar', region)} disabled={loadingReporte}>
              <ModalIcon tipo="bomberosLugar" emoji="🚒" />
              <Text style={styles.modernOptionText}>Bomberos en el lugar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('personaHerida', region)} disabled={loadingReporte}>
              <ModalIcon tipo="personaHerida" emoji="🤕" />
              <Text style={styles.modernOptionText}>Persona herida</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('rescate', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🛟</Text>
              <Text style={styles.modernOptionText}>Rescate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('fenomenoClimatico', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🌪️</Text>
              <Text style={styles.modernOptionText}>Fenómeno climático</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('cortoCircuito', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>⚡</Text>
              <Text style={styles.modernOptionText}>Corto circuito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('derrumbe', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🏚️⤵️</Text>
              <Text style={styles.modernOptionText}>Derrumbe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('alertaSeguridad', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🚨</Text>
              <Text style={styles.modernOptionText}>Alerta de seguridad</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 👥 COMUNIDAD */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryIconEmoji}>👥</Text>
            <Text style={styles.categorySectionTitle}>COMUNIDAD</Text>
          </View>
          <View style={styles.modernOptionsGrid}>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('corteLuz', region)} disabled={loadingReporte}>
              <ModalIcon tipo="corteLuz" emoji="💡❌" />
              <Text style={styles.modernOptionText}>Corte de luz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('corteAgua', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>💧❌</Text>
              <Text style={styles.modernOptionText}>Corte de agua</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('escombros', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🧱</Text>
              <Text style={styles.modernOptionText}>Escombros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('maleza', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🌿</Text>
              <Text style={styles.modernOptionText}>Maleza</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('perrosCallejeros', region)} disabled={loadingReporte}>
              <ModalIcon tipo="perroPerdido" emoji="🐕" />
              <Text style={styles.modernOptionText}>Perros callejeros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('veredaMala', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🚶‍♂️⚠️</Text>
              <Text style={styles.modernOptionText}>Vereda en mal estado</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('mueblesAbandonados', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🪑</Text>
              <Text style={styles.modernOptionText}>Muebles abandonados</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('autoAbandonado', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🚙❌</Text>
              <Text style={styles.modernOptionText}>Auto abandonado</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('arbolCaido', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🌳⤵️</Text>
              <Text style={styles.modernOptionText}>Árbol caído</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('cableCaido', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🔌⤵️</Text>
              <Text style={styles.modernOptionText}>Cable caído</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('zonaEscolar', region)} disabled={loadingReporte}>
              <Text style={styles.optionEmoji}>🏫</Text>
              <Text style={styles.modernOptionText}>Zona escolar</Text>
            </TouchableOpacity>
          </View>
        </View>
        {esPremium && (
          <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#3A3A3C', paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 18 }}>⭐</Text>
              <Text style={{ color: '#FFD700', fontSize: 14, fontWeight: 'bold' }}>ALERTAS PREMIUM</Text>
            </View>

            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIconEmoji}>🐾</Text>
                <Text style={styles.categorySectionTitle}>MASCOTAS</Text>
              </View>
              <View style={styles.modernOptionsGrid}>
                <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('perroPerdido', region)} disabled={loadingReporte}>
                  <Text style={styles.optionEmoji}>🐕</Text>
                  <Text style={styles.modernOptionText}>Perro perdido</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('gatoPerdido', region)} disabled={loadingReporte}>
                  <ModalIcon tipo="gatoPerdido" emoji="🐈" />
                  <Text style={styles.modernOptionText}>Gato perdido</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('animalAgresivo', region)} disabled={loadingReporte}>
                  <Text style={styles.optionEmoji}>🐕</Text>
                  <Text style={styles.modernOptionText}>Animal agresivo</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIconEmoji}>🌳</Text>
                <Text style={styles.categorySectionTitle}>MEDIO AMBIENTE</Text>
              </View>
              <View style={styles.modernOptionsGrid}>
                <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('fugaGas', region)} disabled={loadingReporte}>
                  <Text style={styles.optionEmoji}>💨</Text>
                  <Text style={styles.modernOptionText}>Fuga de gas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('incendioForestal', region)} disabled={loadingReporte}>
                  <Text style={styles.optionEmoji}>🧯</Text>
                  <Text style={styles.modernOptionText}>Incendio forestal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('talaIlegal', region)} disabled={loadingReporte}>
                  <Text style={styles.optionEmoji}>🪓</Text>
                  <Text style={styles.modernOptionText}>Tala ilegal</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIconEmoji}>🛠️</Text>
                <Text style={styles.categorySectionTitle}>SERVICIOS</Text>
              </View>
              <View style={styles.modernOptionsGrid}>
                <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('internetCaido', region)} disabled={loadingReporte}>
                  <Text style={styles.optionEmoji}>📡</Text>
                  <Text style={styles.modernOptionText}>Internet caído</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('posteDanado', region)} disabled={loadingReporte}>
                  <Text style={styles.optionEmoji}>💡</Text>
                  <Text style={styles.modernOptionText}>Poste dañado</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]} onPress={() => crearReporte('transportePublico', region)} disabled={loadingReporte}>
                  <Text style={styles.optionEmoji}>🚌</Text>
                  <Text style={styles.modernOptionText}>Transporte público</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {loadingReporte && (
        <View style={styles.modernLoadingOverlay}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.modernLoadingText}>Creando reporte...</Text>
        </View>
      )}
    </View>
  </View>
</Modal>

      {/* Bottom Sheet */}
      <BottomSheet
        index={sheetIndex}
        snapPoints={snapPoints}
        onChange={setSheetIndex}
        backgroundStyle={{ backgroundColor: '#1C1C1E' }}
        handleIndicatorStyle={{ backgroundColor: '#8E8E93', width: 40 }}
      >
        {/* Selector de región - Dropdown */}
        <View style={styles.regionSelector}>
          <TouchableOpacity 
            style={styles.regionDropdown}
            onPress={() => setRegionDropdownOpen(true)}
          >
            <Text style={styles.regionDropdownText}>
              {regionSeleccionada === 0 ? '📍 Mi ubicación' : `📍 ${regionesChile[regionSeleccionada].nombre}`}
            </Text>
            <Text style={styles.regionDropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de selección de región */}
        <Modal visible={regionDropdownOpen} transparent={true} animationType="slide" onRequestClose={() => setRegionDropdownOpen(false)}>
          <View style={styles.regionModalOverlay}>
            <View style={styles.regionModalContent}>
              <View style={styles.regionModalHeader}>
                <Text style={styles.regionModalTitle}>Seleccionar región</Text>
                <TouchableOpacity onPress={() => setRegionDropdownOpen(false)}>
                  <X size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.regionModalList} showsVerticalScrollIndicator={true}>
                {regionesChile.map((region, index) => (
                  <TouchableOpacity
                    key={region.nombre}
                    style={[
                      styles.regionModalItem,
                      regionSeleccionada === index && styles.regionModalItemActive
                    ]}
                    onPress={() => {
                      setRegionSeleccionada(index);
                      setRegionDropdownOpen(false);
                      cambiarRegion(index);
                    }}
                  >
                    <Text style={[
                      styles.regionModalItemText,
                      regionSeleccionada === index && styles.regionModalItemTextActive
                    ]}>
                      {index === 0 ? '📍 Mi ubicación' : region.nombre}
                    </Text>
                    {regionSeleccionada === index && (
                      <Text style={{ color: '#DC2626', fontSize: 16 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Filtro de estado */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <TouchableOpacity 
            style={styles.regionDropdown}
            onPress={() => setEstadoDropdownOpen(true)}
          >
            <Text style={styles.regionDropdownText}>
              {filtroEstado === 'todos' ? '📋 Todos los estados' :
               filtroEstado === 'confirmado' ? '✅ Confirmados' :
               filtroEstado === 'no_confirmado' ? '⏳ Pendientes' : '❌ Falsos'}
            </Text>
            <Text style={styles.regionDropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de selección de estado */}
        <Modal visible={estadoDropdownOpen} transparent={true} animationType="slide" onRequestClose={() => setEstadoDropdownOpen(false)}>
          <View style={styles.regionModalOverlay}>
            <View style={styles.regionModalContent}>
              <View style={styles.regionModalHeader}>
                <Text style={styles.regionModalTitle}>Filtrar por estado</Text>
                <TouchableOpacity onPress={() => setEstadoDropdownOpen(false)}>
                  <X size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              {[
                { key: 'todos', label: '📋 Todos' },
                { key: 'confirmado', label: '✅ Confirmados' },
                { key: 'no_confirmado', label: '⏳ Pendientes' },
                { key: 'falso', label: '❌ Falsos' },
              ].map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.regionModalItem, filtroEstado === item.key && styles.regionModalItemActive]}
                  onPress={() => {
                    setFiltroEstado(item.key);
                    setEstadoDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.regionModalItemText, filtroEstado === item.key && styles.regionModalItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Filtro de orden */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <TouchableOpacity 
            style={styles.regionDropdown}
            onPress={() => setOrdenDropdownOpen(true)}
          >
            <Text style={styles.regionDropdownText}>
              📋 Ordenar por: {ordenActual === 'recientes' ? 'Más recientes' :
               ordenActual === 'confirmados' ? 'Más confirmados' : 'Más cercanos'}
            </Text>
            <Text style={styles.regionDropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de orden */}
        <Modal visible={ordenDropdownOpen} transparent={true} animationType="slide" onRequestClose={() => setOrdenDropdownOpen(false)}>
          <View style={styles.regionModalOverlay}>
            <View style={styles.regionModalContent}>
              <View style={styles.regionModalHeader}>
                <Text style={styles.regionModalTitle}>Ordenar por</Text>
                <TouchableOpacity onPress={() => setOrdenDropdownOpen(false)}>
                  <X size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              {[
                { key: 'recientes', label: '🕐 Más recientes' },
                { key: 'confirmados', label: '✅ Más confirmados' },
                { key: 'cercanos', label: '📍 Más cercanos' },
              ].map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.regionModalItem, ordenActual === item.key && styles.regionModalItemActive]}
                  onPress={() => {
                    setOrdenActual(item.key);
                    setOrdenDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.regionModalItemText, ordenActual === item.key && styles.regionModalItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {!esPremium && (
          <View style={styles.adBanner}>
            <BannerAd
              unitId={TestIds.BANNER}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        )}

        <View style={styles.iconRow}>
          <TouchableOpacity style={[styles.iconButton, filtroCategoria === 'todos' && styles.iconButtonActive]} onPress={() => setFiltroCategoria('todos')}>
            <ScrollText size={20} color={filtroCategoria === 'todos' ? '#FFF' : '#8E8E93'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, filtroCategoria === 'transito' && styles.iconButtonActive]} onPress={() => setFiltroCategoria('transito')}>
            <Car size={20} color={filtroCategoria === 'transito' ? '#FFF' : '#8E8E93'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, filtroCategoria === 'seguridad' && styles.iconButtonActive]} onPress={() => setFiltroCategoria('seguridad')}>
            <ShieldPlus size={20} color={filtroCategoria === 'seguridad' ? '#FFF' : '#8E8E93'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, filtroCategoria === 'emergencias' && styles.iconButtonActive]} onPress={() => setFiltroCategoria('emergencias')}>
            <Siren size={20} color={filtroCategoria === 'emergencias' ? '#FFF' : '#8E8E93'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, filtroCategoria === 'comunidad' && styles.iconButtonActive]} onPress={() => setFiltroCategoria('comunidad')}>
            <Home size={20} color={filtroCategoria === 'comunidad' ? '#FFF' : '#8E8E93'} />
          </TouchableOpacity>
          {esPremium && (
            <>
              <TouchableOpacity style={[styles.iconButton, filtroCategoria === 'mascotas' && styles.iconButtonActive]} onPress={() => setFiltroCategoria('mascotas')}>
                <Text style={{ fontSize: 16, color: filtroCategoria === 'mascotas' ? '#FFF' : '#8E8E93' }}>🐾</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, filtroCategoria === 'ambiente' && styles.iconButtonActive]} onPress={() => setFiltroCategoria('ambiente')}>
                <Text style={{ fontSize: 16, color: filtroCategoria === 'ambiente' ? '#FFF' : '#8E8E93' }}>🌳</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, filtroCategoria === 'servicios' && styles.iconButtonActive]} onPress={() => setFiltroCategoria('servicios')}>
                <Text style={{ fontSize: 16, color: filtroCategoria === 'servicios' ? '#FFF' : '#8E8E93' }}>🛠️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardsContainerVertical}>
          {[...new Map(reportes.map(r => [r._id, r])).values()]
  .sort((a: any, b: any) => {
    if (ordenActual === 'confirmados') return b.confirmaciones - a.confirmaciones;
    if (ordenActual === 'cercanos') {
      const distA = region ? calcularDistancia(region.latitude, region.longitude, a.ubicacion.coordinates[1], a.ubicacion.coordinates[0]) : 0;
      const distB = region ? calcularDistancia(region.latitude, region.longitude, b.ubicacion.coordinates[1], b.ubicacion.coordinates[0]) : 0;
      return distA - distB;
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  })
  .filter(reporte => {
    if (filtroCategoria === 'todos') return true;
    const categorias: { [key: string]: string } = {
      embotellamiento: 'transito', choque: 'transito', semaforoRoto: 'transito',
      calleCortada: 'transito', accidente: 'transito', trafico: 'transito',
      objetoPeligroso: 'transito', controlCarabineros: 'transito', obrasEnVia: 'transito',
      calleInundada: 'transito', manifestacion: 'transito', emergenciaVehicular: 'transito',
      actividadDeportiva: 'transito',
      asalto: 'seguridad', actitudSospechosa: 'seguridad', balacera: 'seguridad',
      delito: 'seguridad', carabinerosLugar: 'seguridad', patrulla: 'seguridad',
      camaraSeguridad: 'seguridad', zonaOscura: 'seguridad', casaAbandonada: 'seguridad',
      incendio: 'emergencias', inundacion: 'emergencias', clima: 'emergencias',
      accidenteGrave: 'emergencias', bomberosLugar: 'emergencias', personaHerida: 'emergencias',
      rescate: 'emergencias', fenomenoClimatico: 'emergencias', cortoCircuito: 'emergencias',
    derrumbe: 'emergencias', alertaSeguridad: 'emergencias',
    ambulanciaLugar: 'emergencias', rescateAcuatico: 'emergencias', rescateAltura: 'emergencias',
    fugaGas: 'emergencias', derrumbeParcial: 'emergencias', tornado: 'emergencias',
    incendioForestal: 'emergencias', alarmaIncendio: 'emergencias',
      bache: 'transito', corteLuz: 'comunidad', corteAgua: 'comunidad',
      escombros: 'comunidad', maleza: 'comunidad', perrosCallejeros: 'comunidad',
      veredaMala: 'comunidad', mueblesAbandonados: 'comunidad', autoAbandonado: 'comunidad',
    arbolCaido: 'comunidad', cableCaido: 'comunidad', zonaEscolar: 'comunidad',
    basuraIlegal: 'comunidad', escombrosVereda: 'comunidad', plagas: 'comunidad',
    perroAbandonado: 'comunidad', gatoCallejero: 'comunidad', mosquitos: 'comunidad',
    ruidoConstruccion: 'comunidad', musicaAlta: 'comunidad', mueblesCalle: 'comunidad', senalCaida: 'comunidad',
    perroPerdido: 'mascotas', gatoPerdido: 'mascotas', mascotaEncontrada: 'mascotas',
    mascotaAdopcion: 'mascotas', animalAtropellado: 'mascotas', animalAgresivo: 'mascotas',
    gatoHerido: 'mascotas', aveHerida: 'mascotas', perroEnCelo: 'mascotas', refugioAnimales: 'mascotas',
    arbolDerribado: 'ambiente', basuraParque: 'ambiente', quemaBasura: 'ambiente',
    aguaEstancada: 'ambiente', olorQuimico: 'ambiente', talaIlegal: 'ambiente',
    puntoReciclaje: 'ambiente', arbolEnRiesgo: 'ambiente', areaProtegida: 'ambiente',
    internetCaido: 'servicios', senalCelular: 'servicios', centroSalud: 'servicios',
    colegio: 'servicios', transportePublico: 'servicios', estacionamiento: 'servicios',
    posteDanado: 'servicios', aguaPotable: 'servicios', bancoCajero: 'servicios',
    construccion: 'urbanismo', cierreCalle: 'urbanismo', nuevoPavimento: 'urbanismo',
    veredaNueva: 'urbanismo', areaVerdeNueva: 'urbanismo', ciclovia: 'urbanismo', edificioConstruccion: 'urbanismo',
    };
    return categorias[reporte.tipo] === filtroCategoria;
  })
  .filter(reporte => {
    if (filtroEstado === 'todos') return true;
    return (reporte.estado || 'no_confirmado') === filtroEstado;
  })
  .map((reporte) => {  // ✅ QUITAR EL INDEX
    const distanciaReal = region ? calcularDistancia(
      region.latitude,
      region.longitude,
      reporte.ubicacion.coordinates[1],
      reporte.ubicacion.coordinates[0]
    ) : 0;
    
    return (
   <EventCard
          key={reporte._id}
          title={getNombreTipo(reporte.tipo)}
          address={direcciones[reporte._id] || 'Cerca de esta zona'}
          distance={formatearDistancia(distanciaReal)}
          time={reporte.createdAt ? formatearTiempoRelativo(reporte.createdAt) : 'Reciente'}
          categoria={getCategoriaReporte(reporte.tipo)}
          description={reporte.descripcion || ''}
          confirmaciones={reporte.confirmaciones}
          reportesFalsos={reporte.reportesFalsos}
          estado={reporte.estado || 'no_confirmado'}
          onPress={() => mostrarOpcionesCard(reporte)}
          onConfirm={() => confirmarReporte(reporte._id)}
          onFalseReport={() => reportarFalso(reporte._id)}
          reacciones={reporte.reacciones}
          onReaccion={(tipo) => reaccionarReporte(reporte._id, tipo)}
          esPremium={esPremium}
          comentariosCount={reporte.comentarios?.length || 0}
          onOpenComments={() => {
            if (!esPremium) {
              const vistasActuales = (comentariosVistos[reporte._id] || 0) + 1;
              const nuevoVistas = { ...comentariosVistos, [reporte._id]: vistasActuales };
              setComentariosVistos(nuevoVistas);
              AsyncStorage.setItem('comentariosVistos', JSON.stringify(nuevoVistas));
              if (vistasActuales > LIMITE_VISTAS) {
                Alert.alert('⭐ Límite alcanzado', `Ya viste los comentarios de esta alerta ${LIMITE_VISTAS} veces. Hacerte Premium.`, [{ text: 'OK' }]);
                return;
              }
            }
            setReporteParaComentar(reporte);
            setCommentModalVisible(true);
          }}
          onLocate={() => {
            const [lng, lat] = reporte.ubicacion.coordinates;
            mapRef.current?.animateToRegion({
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 500);
          }}
          creadoPorNombre={(reporte as any).creadoPorNombre}
          yaConfirmado={reportesConfirmados.has(reporte._id)}
          imagenUrl={(reporte as any).imagenUrl}
          esPropio={(reporte as any).creadoPor === userIdActual}
          vistas={vistasPorReporte[reporte._id] || 0}
          onDelete={() => {
            Alert.alert('Eliminar', '¿Eliminar este reporte?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => eliminarReporte(reporte._id) },
            ]);
          }}
          onEdit={() => {
            setEditReporteId(reporte._id);
            setEditDescripcion(reporte.descripcion || '');
            setEditModalVisible(true);
          }}
          onOcultar={() => {
            setReportes(prev => prev.filter(r => r._id !== reporte._id));
          }}
        />
    );
  })}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Modal de opciones */}
      <Modal transparent={true} visible={cardModalVisible} animationType="fade" onRequestClose={() => setCardModalVisible(false)}>
        <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opciones del reporte</Text>
              <TouchableOpacity onPress={() => setCardModalVisible(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
            {selectedReporte && (
              <>
                <View style={styles.modernCard}>
                  <Text style={styles.modernCardTipo}>{selectedReporte.tipo?.toUpperCase() || ''}</Text>
                  <View style={[styles.estadoPill, { 
                    backgroundColor: selectedReporte.estado === 'confirmado' ? '#4CAF5020' : selectedReporte.estado === 'falso' ? '#F4433620' : '#FFA50020',
                    alignSelf: 'flex-start',
                    marginTop: 4,
                    marginBottom: 8,
                  }]}>
                    <Text style={[styles.estadoPillText, { 
                      color: selectedReporte.estado === 'confirmado' ? '#4CAF50' : selectedReporte.estado === 'falso' ? '#F44336' : '#FFA500'
                    }]}>
                      {selectedReporte.estado === 'confirmado' ? '✓ Confirmado' : selectedReporte.estado === 'falso' ? '✗ Falso' : '⋯ Pendiente'}
                    </Text>
                  </View>
                  <Text style={styles.modernCardDesc}>{selectedReporte.descripcion}</Text>
                  {(selectedReporte as any).imagenUrl ? (
                    <Image source={{ uri: (selectedReporte as any).imagenUrl }} style={styles.modalImagen} resizeMode="cover" />
                  ) : null}
                  <View style={styles.modernCardStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedReporte.confirmaciones}</Text>
                      <Text style={styles.statLabel}>confirmaciones</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedReporte.reportesFalsos}</Text>
                      <Text style={styles.statLabel}>falsos</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.actionsTitle}>Acciones</Text>
                
                <View style={styles.modernActions}>
                  <TouchableOpacity style={[styles.modernActionButton, styles.confirmModern]} onPress={() => {
                    setCardModalVisible(false);
                    if (selectedReporte?._id) confirmarReporte(selectedReporte._id);
                  }}>
                    <CheckCircle size={28} color="#4CAF50" />
                    <View style={styles.modernActionText}>
                      <Text style={styles.modernActionTitle}>Confirmar</Text>
                      <Text style={styles.modernActionSubtitle}>Validar este reporte</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.modernActionButton, styles.falseModern]} onPress={() => {
                    setCardModalVisible(false);
                    if (selectedReporte?._id) reportarFalso(selectedReporte._id);
                  }}>
                    <AlertTriangle size={28} color="#F44336" />
                    <View style={styles.modernActionText}>
                      <Text style={styles.modernActionTitle}>Reportar falso</Text>
                      <Text style={styles.modernActionSubtitle}>Marcar como no válido</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.modernActionButton, styles.shareModern]} onPress={() => {
                    setCardModalVisible(false);
                    if (selectedReporte) compartirReporte(selectedReporte);
                  }}>
                    <Share2 size={28} color="#2196F3" />
                    <View style={styles.modernActionText}>
                      <Text style={styles.modernActionTitle}>Compartir</Text>
                      <Text style={styles.modernActionSubtitle}>Enviar a redes sociales</Text>
                    </View>
                  </TouchableOpacity>
                </View>

              </>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de edición */}
      <Modal visible={editModalVisible} transparent={true} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%', padding: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar descripción</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.descripcionInput}
              value={editDescripcion}
              onChangeText={setEditDescripcion}
              maxLength={200}
              multiline
              placeholder="Nueva descripción..."
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity style={styles.imagenButton} onPress={seleccionarImagen}>
              <Text style={styles.imagenButtonText}>
                {imagenSeleccionada ? '📸 Nueva foto seleccionada' : '📷 Cambiar foto'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#DC2626', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 }} onPress={editarReporte}>
              <Text style={{ color: '#FFF', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 👇 MODAL DE COMENTARIOS - INDEPENDIENTE */}
<Modal
  transparent={true}
  visible={commentModalVisible}
  animationType="slide"
  onRequestClose={() => setCommentModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
      
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          💬 Comentarios
        </Text>
        <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
          <X size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>
      
      {reporteParaComentar && (
        <CommentSection
          reporteId={reporteParaComentar._id}
          esPremium={esPremium}
          token={token}
          onComentarioAgregado={() => {
            if (region) {
              cargarReportes(region.latitude, region.longitude);
            }
          }}
        />
      )}
      
    </View>
  </View>
</Modal>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
        autoClose={3000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#FFF', fontSize: 16, marginTop: 10 },
  regionSelector: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  regionDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  regionDropdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  regionDropdownArrow: {
    color: '#8E8E93',
    fontSize: 12,
  },
  regionDropdownList: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginTop: 4,
  },
  regionDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  regionDropdownItemActive: {
    backgroundColor: '#DC262620',
  },
  regionDropdownItemText: {
    color: '#CCCCCC',
    fontSize: 13,
  },
  regionDropdownItemTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  regionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  regionModalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  regionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  regionModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  regionModalList: {
    paddingVertical: 8,
  },
  regionModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  regionModalItemActive: {
    backgroundColor: '#DC262620',
  },
  regionModalItemText: {
    color: '#CCCCCC',
    fontSize: 15,
  },
  regionModalItemTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  regionScroll: {
    gap: 8,
  },
  regionChip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  regionChipActive: {
    backgroundColor: '#DC2626',
  },
  regionChipText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  regionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  botonReportar: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#DC2626',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 1000,
  },
  botonTexto: { color: 'white', fontSize: 30, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  adBanner: {
    marginHorizontal: 0,
    marginBottom: 8,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  cardsContainerVertical: {
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 8,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modernModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modernModalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modernModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modernModalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  modernModalSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
  },
  modernCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernModalScroll: {
    maxHeight: '70%',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categorySectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modernOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  modernOptionCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  modernOptionText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  optionButtonDisabled: { opacity: 0.5 },
  modernLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  modernLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  modernCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  modernCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernCardTipo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  estadoPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  estadoPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modernCardDesc: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  modalImagen: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
  },
  modernCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2323d1',
  },
  actionsTitle: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  modernActions: {
    gap: 8,
    width: '100%',
  },
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
  },
  modernActionText: {
    flex: 1,
    marginLeft: 12,
  },
  modernActionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  modernActionSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
  },
  confirmModern: {
    backgroundColor: '#4CAF5020',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  falseModern: {
    backgroundColor: '#F4433620',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  shareModern: {
    backgroundColor: '#2196F320',
    borderColor: '#2196F3',
  },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F4433615',
    borderWidth: 1,
    borderColor: '#F44336',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '600',
  },
  categoryIconEmoji: {
  fontSize: 20,
  marginRight: 8,
},
optionEmoji: {
  fontSize: 28,
  marginBottom: 8,
},
customLocationButton: {
  position: 'absolute',
  top: 580,
  right: 30,  // Aumenta este valor para mover más a la izquierda
  backgroundColor: '#000000',
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1,
},
customLocationButtonText: {
  fontSize: 14,
  color: 'white',
},
descripcionInput: {
  backgroundColor: '#2C2C2E',
  borderRadius: 12,
  padding: 12,
  color: '#FFFFFF',
  fontSize: 14,
  minHeight: 50,
  textAlignVertical: 'top',
},
imagenButton: {
  backgroundColor: '#2C2C2E',
  borderRadius: 12,
  padding: 12,
  marginBottom: 16,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#3A3A3C',
  borderStyle: 'dashed',
},
imagenButtonText: {
  color: '#8E8E93',
  fontSize: 13,
},
});