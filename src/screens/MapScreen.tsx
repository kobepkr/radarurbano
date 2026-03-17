import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import PulseMarker from '../components/PulseMarker';
import EventCard from '../components/EventCard';
import CustomAlert from '../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse } from 'axios';
import { Share } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { 
  Menu, User,
  X, MapPin, Layout, Car, ShieldPlus, Siren, Home,
  Clock, AlertCircle, Power, XCircle, AlertTriangle,
  EyeOff, Target, Flame, Droplet, Circle, PowerOff,
  DropletOff, CheckCircle, Share2
} from 'lucide-react-native';

import { AppState } from 'react-native';



const API_URL = 'http://192.168.1.84:4000/api';
const SOCKET_URL = 'http://192.168.1.84:4000'

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
  createdAt?: string;
  confirmadoPor?: string[];
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
  const [region, setRegion] = useState<any>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'RECENT' | 'TRENDING'>('RECENT');
  const mapRef = useRef<MapView>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const snapPoints = ['15%', '50%', '80%'];
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const socketRef = useRef<any>(null);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
  });

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

useEffect(() => {
  const getToken = async () => {
    const t = await AsyncStorage.getItem('token');
    setToken(t || '');
  };
  getToken();

  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permiso denegado');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const newRegion = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setRegion(newRegion);
    cargarReportes(newRegion.latitude, newRegion.longitude);
    setLoading(false);
  })();
}, []);

useEffect(() => {
  if (socketRef.current) return;

  socketRef.current = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socketRef.current.on('connect', () => {
    console.log('🟢 Conectado a WebSocket');
  });

  // Escuchar nuevos reportes
  socketRef.current.on('nuevo-reporte', (nuevoReporte: Reporte) => {
    setReportes(prev => {
      if (prev.some(r => r._id === nuevoReporte._id)) return prev;
      return [nuevoReporte, ...prev];
    });
  });

  // 👇 ESCUCHAR ACTUALIZACIONES (confirmaciones)
  socketRef.current.on('reporte-actualizado', (reporteActualizado: Reporte) => {
    console.log('📢 Reporte actualizado recibido:', reporteActualizado._id);
    
    setReportes(prev => 
      prev.map(r => r._id === reporteActualizado._id ? reporteActualizado : r)
    );
  });

  socketRef.current.on('disconnect', () => {
    console.log('🔴 Desconectado de WebSocket');
  });

  return () => {
    if (socketRef.current) {
      socketRef.current.off('nuevo-reporte');
      socketRef.current.off('reporte-actualizado');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
}, []);


// 👇 NUEVO EFECTO PARA RECARGAR CADA 5 SEGUNDOS




  const cargarReportes = async (lat: number, lng: number) => {
    try {
      const response: AxiosResponse<Reporte[]> = await axios.get(`${API_URL}/reportes/cercanos`, {
        params: { lat, lng, radio: 5 }
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
  if (!coordinate) return;
  
  setLoadingReporte(true);
  
  try {
    const response: AxiosResponse<Reporte> = await axios.post(`${API_URL}/reportes`, {
      tipo,
      descripcion: `Reporte de ${tipo}`,
      lat: coordinate.latitude,
      lng: coordinate.longitude
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 👇 AGREGAR EL NUEVO REPORTE Y RECARGAR
    setReportes(prev => [response.data, ...prev]);
    if (region) {
      await cargarReportes(region.latitude, region.longitude);
    }
    
    setModalVisible(false);
    showAlert('✅ Éxito', 'Reporte creado correctamente', 'success');
    
  } catch (error) {
    console.error('Error creando reporte:', error);
    showAlert('❌ Error', 'No se pudo crear el reporte', 'error');
  } finally {
    setLoadingReporte(false);
  }
};

const confirmarReporte = async (id: string) => {
  try {
    await axios.post(`${API_URL}/reportes/${id}/confirmar`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 👇 RECARGAR REPORTES DESPUÉS DE CONFIRMAR
    if (region) {
      const response = await axios.get(`${API_URL}/reportes/cercanos`, {
        params: { lat: region.latitude, lng: region.longitude, radio: 5 }
      });
      
      const reportesLimpios = response.data.map((reporte: any) => ({
        ...reporte,
        confirmadoPor: Array.isArray(reporte.confirmadoPor) ? reporte.confirmadoPor : [],
        confirmaciones: typeof reporte.confirmaciones === 'number' ? reporte.confirmaciones : 0,
        reportesFalsos: typeof reporte.reportesFalsos === 'number' ? reporte.reportesFalsos : 0,
        tipo: reporte.tipo || '',
        descripcion: reporte.descripcion || '',
        estado: reporte.estado || 'no_confirmado',
      }));
      
      setReportes(reportesLimpios);
    }
    
    showAlert('✅ Confirmado', 'Reporte confirmado correctamente', 'success');
    
  } catch (error: any) {
    if (error.response?.status === 400) {
      showAlert('⚠️ Ya confirmado', 'Ya has confirmado este reporte anteriormente', 'info');
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
    
    // 👇 NO necesitas recargar todos los reportes
    // El WebSocket se encargará de actualizar este reporte específico
    
    showAlert('⚠️ Reportado', 'Reporte marcado como falso', 'info');
    
  } catch (error) {
    console.error('Error reportando falso:', error);
    showAlert('❌ Error', 'No se pudo reportar como falso', 'error');
  }
};
  const compartirReporte = async (reporte: Reporte) => {
    try {
      const mensaje = 
        `🚨 *${reporte.tipo.toUpperCase()}* 🚨\n\n` +
        `${reporte.descripcion}\n\n` +
        `📍 Ubicación cercana\n` +
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

  

  const mostrarOpcionesCard = (reporte: Reporte) => {
    setSelectedReporte(reporte);
    setCardModalVisible(true);
  };

  const actualizarUbicacion = async () => {
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

  actualizarUbicacion();

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }


  const mapDarkStyle = [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#746855" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#d59563" }]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#d59563" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "color": "#263c3f" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#6b9a76" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#38414e" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#212a37" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9ca5b3" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [{ "color": "#746855" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#1f2835" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#f3d19c" }]
    },
    {
      "featureType": "transit",
      "elementType": "geometry",
      "stylers": [{ "color": "#2f3948" }]
    },
    {
      "featureType": "transit.station",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#d59563" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#17263c" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#515c6d" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#17263c" }]
    },
    
  ];

  const mapLightStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },

  ];

  
  return (
    <View style={[styles.container, { backgroundColor: mapaOscuro ? '#000' : '#FFF' }]}>
      {region && (
        <MapView
          key={mapaOscuro ? 'dark' : 'light'} // 👈 FORZAMOS RE-RENDER
          style={styles.map} 
          region={region} 
          showsUserLocation
          showsMyLocationButton
          customMapStyle={mapaOscuro ? mapDarkStyle : undefined}
        >
          {reportes.map((reporte) => (
            <PulseMarker
              key={reporte._id}
              coordinate={{
                latitude: reporte.ubicacion.coordinates[1],
                longitude: reporte.ubicacion.coordinates[0]
              }}
              color={colores[reporte.tipo] || '#757575'}
              onPress={() => mostrarOpcionesCard(reporte)}
            />
          ))}
        </MapView>
      )}
    
         {/* Header con colores según tema */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Menu size={28} color={mapaOscuro ? "#FFF" : "#000"} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: '#DC2626' }]}>
          RADAR URBANO
        </Text>
        
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <User size={28} color={mapaOscuro ? "#FFF" : "#000"} />
        </TouchableOpacity>
      </View>

{/* Botón flotante para crear reporte */}
<TouchableOpacity 
  style={styles.botonReportar}
  onPress={() => setModalVisible(true)}
>
  <Text style={styles.botonTexto}>+</Text>
</TouchableOpacity>

      
            {/* Modal para crear reportes - NUEVO DISEÑO */}

            {/* Modal para crear reportes - TODO CON LUCIDE */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modernModalOverlay}>
              <View style={styles.modernModalContent}>
                
                {/* Header con título e ícono de cierre (Lucide) */}
                <View style={styles.modernModalHeader}>
                  <View>
                    <Text style={styles.modernModalTitle}>Nuevo reporte</Text>
                    <Text style={styles.modernModalSubtitle}>¿Qué está pasando?</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modernCloseButton}>
                    <X size={24} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                {/* Tarjeta de ubicación (Lucide) */}
      <View style={styles.locationCard}>
        <MapPin size={20} color="#DC2626" />
        <Text style={styles.locationText}>Reportando en mi ubicación actual</Text>
      </View>

      {/* Categorías en cards */}
      <Text style={styles.sectionTitle}>Categorías</Text>
      
      <ScrollView style={styles.modernModalScroll} showsVerticalScrollIndicator={false}>
        
        {/* TRANSITO */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Car size={20} color="#FF6B6B" />
            <Text style={styles.categorySectionTitle}>TRÁNSITO</Text>
          </View>
          <View style={styles.modernOptionsGrid}>
            {[
              { tipo: 'embotellamiento', label: 'Embotellamiento', Icon: Clock },
              { tipo: 'choque', label: 'Choque', Icon: AlertCircle },
              { tipo: 'semaforoRoto', label: 'Semáforo roto', Icon: Power },
              { tipo: 'calleCortada', label: 'Calle cortada', Icon: XCircle }
            ].map((item) => (
              <TouchableOpacity
                key={item.tipo}
                style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]}
                onPress={() => crearReporte(item.tipo, region)}
                disabled={loadingReporte}
              >
                <item.Icon size={24} color="#FF6B6B" />
                <Text style={styles.modernOptionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SEGURIDAD */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <ShieldPlus size={20} color="#B22222" />
            <Text style={styles.categorySectionTitle}>SEGURIDAD</Text>
          </View>
          <View style={styles.modernOptionsGrid}>
            {[
              { tipo: 'asalto', label: 'Asalto', Icon: AlertTriangle },
              { tipo: 'actitudSospechosa', label: 'Actitud sospechosa', Icon: EyeOff },
              { tipo: 'balacera', label: 'Balacera', Icon: Target }
            ].map((item) => (
              <TouchableOpacity
                key={item.tipo}
                style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]}
                onPress={() => crearReporte(item.tipo, region)}
                disabled={loadingReporte}
              >
                <item.Icon size={24} color="#B22222" />
                <Text style={styles.modernOptionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* EMERGENCIAS */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Siren size={20} color="#FF5722" />
            <Text style={styles.categorySectionTitle}>EMERGENCIAS</Text>
          </View>
          <View style={styles.modernOptionsGrid}>
            {[
              { tipo: 'incendio', label: 'Incendio', Icon: Flame },
              { tipo: 'inundacion', label: 'Inundación', Icon: Droplet }
            ].map((item) => (
              <TouchableOpacity
                key={item.tipo}
                style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]}
                onPress={() => crearReporte(item.tipo, region)}
                disabled={loadingReporte}
              >
                <item.Icon size={24} color="#FF5722" />
                <Text style={styles.modernOptionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* COMUNIDAD */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Home size={20} color="#8B4513" />
            <Text style={styles.categorySectionTitle}>COMUNIDAD</Text>
          </View>
          <View style={styles.modernOptionsGrid}>
            {[
              { tipo: 'bache', label: 'Bache', Icon: Circle },
              { tipo: 'corteLuz', label: 'Corte de luz', Icon: PowerOff },
              { tipo: 'corteAgua', label: 'Corte de agua', Icon: DropletOff }
            ].map((item) => (
              <TouchableOpacity
                key={item.tipo}
                style={[styles.modernOptionCard, loadingReporte && styles.optionButtonDisabled]}
                onPress={() => crearReporte(item.tipo, region)}
                disabled={loadingReporte}
              >
                <item.Icon size={24} color="#8B4513" />
                <Text style={styles.modernOptionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Espacio extra al final */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Loading overlay */}
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




       {/* Filtros de categoría con íconos - LUCIDE */}
<View style={styles.iconRow}>
  <TouchableOpacity 
    style={[styles.iconButton, filtroCategoria === 'todos' && styles.iconButtonActive]}
    onPress={() => setFiltroCategoria('todos')}
  >
    <Layout 
      size={24} 
      color={filtroCategoria === 'todos' ? '#FFF' : '#8E8E93'} 
    />
  </TouchableOpacity>

  <TouchableOpacity 
    style={[styles.iconButton, filtroCategoria === 'transito' && styles.iconButtonActive]}
    onPress={() => setFiltroCategoria('transito')}
  >
    <Car 
      size={24} 
      color={filtroCategoria === 'transito' ? '#FFF' : '#8E8E93'} 
    />
  </TouchableOpacity>

  <TouchableOpacity 
    style={[styles.iconButton, filtroCategoria === 'seguridad' && styles.iconButtonActive]}
    onPress={() => setFiltroCategoria('seguridad')}
  >
    <ShieldPlus 
      size={24} 
      color={filtroCategoria === 'seguridad' ? '#FFF' : '#8E8E93'} 
    />
  </TouchableOpacity>

  <TouchableOpacity 
    style={[styles.iconButton, filtroCategoria === 'emergencias' && styles.iconButtonActive]}
    onPress={() => setFiltroCategoria('emergencias')}
  >
    <Siren 
      size={24} 
      color={filtroCategoria === 'emergencias' ? '#FFF' : '#8E8E93'} 
    />
  </TouchableOpacity>

  <TouchableOpacity 
    style={[styles.iconButton, filtroCategoria === 'comunidad' && styles.iconButtonActive]}
    onPress={() => setFiltroCategoria('comunidad')}
  >
    <Home 
      size={24} 
      color={filtroCategoria === 'comunidad' ? '#FFF' : '#8E8E93'} 
    />
  </TouchableOpacity>
</View>


        <BottomSheetScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainerVertical}
        >
          {reportes
            .filter(reporte => {
              if (filtroCategoria === 'todos') return true;
              const categorias: { [key: string]: string } = {
                embotellamiento: 'transito', choque: 'transito', semaforoRoto: 'transito', calleCortada: 'transito',
                asalto: 'seguridad', actitudSospechosa: 'seguridad', balacera: 'seguridad',
                incendio: 'emergencias', inundacion: 'emergencias',
                bache: 'comunidad', corteLuz: 'comunidad', corteAgua: 'comunidad',
                accidente: 'transito', delito: 'seguridad', trafico: 'transito', clima: 'emergencias'
              };
              return categorias[reporte.tipo] === filtroCategoria;
            })
            .map((reporte, index) => {
              const distanciaReal = region ? calcularDistancia(
                region.latitude,
                region.longitude,
                reporte.ubicacion.coordinates[1],
                reporte.ubicacion.coordinates[0]
              ) : 0;
              
              return (
                <EventCard
                  key={reporte._id}
                  title={`${reporte.tipo?.toUpperCase() || ''} ${index === 0 ? '🚨' : ''}`}
                  address="Ubicación cercana"
                  distance={formatearDistancia(distanciaReal)}
                  time={reporte.createdAt ? new Date(reporte.createdAt).toLocaleTimeString() : 'Reciente'}
                  description={reporte.descripcion || ''}
                  confirmaciones={reporte.confirmaciones}
                  reportesFalsos={reporte.reportesFalsos}
                  estado={reporte.estado || 'no_confirmado'}
                  onPress={() => mostrarOpcionesCard(reporte)}
                  onConfirm={() => confirmarReporte(reporte._id)}
                  onFalseReport={() => reportarFalso(reporte._id)}
                />
              );
            })}
        </BottomSheetScrollView>
      </BottomSheet>

    
{/* Modal de opciones - NUEVO DISEÑO */}
{/* Modal de opciones - TODO CON LUCIDE */}
<Modal
  transparent={true}
  visible={cardModalVisible}
  animationType="fade"
  onRequestClose={() => setCardModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, { maxHeight: 550 }]}>
      
      {/* Header con ícono de cierre */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Opciones del reporte</Text>
        <TouchableOpacity onPress={() => setCardModalVisible(false)}>
          <X size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>
      
      {selectedReporte && (
        <>
          {/* Info del reporte con estilo card */}
          <View style={styles.modernCard}>
            <View style={styles.modernCardHeader}>
              <Text style={styles.modernCardTipo}>
                {selectedReporte.tipo?.toUpperCase() || ''}
              </Text>
              <View style={[styles.estadoPill, { 
                backgroundColor: 
                  selectedReporte.estado === 'confirmado' ? '#4CAF5020' :
                  selectedReporte.estado === 'falso' ? '#F4433620' : '#FFA50020'
              }]}>
                <Text style={[styles.estadoPillText, { 
                  color: 
                    selectedReporte.estado === 'confirmado' ? '#4CAF50' :
                    selectedReporte.estado === 'falso' ? '#F44336' : '#FFA500'
                }]}>
                  {selectedReporte.estado === 'confirmado' ? '✓ Confirmado' :
                   selectedReporte.estado === 'falso' ? '✗ Falso' : '⋯ Pendiente'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.modernCardDesc}>{selectedReporte.descripcion}</Text>
            
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

          {/* Botones de acción con íconos modernos */}
          <Text style={styles.actionsTitle}>Acciones</Text>
          
          <View style={styles.modernActions}>
            <TouchableOpacity 
              style={[styles.modernActionButton, styles.confirmModern]}
              onPress={() => {
                setCardModalVisible(false);
                if (selectedReporte?._id) confirmarReporte(selectedReporte._id);
              }}
            >
              <CheckCircle size={28} color="#4CAF50" />
              <View style={styles.modernActionText}>
                <Text style={styles.modernActionTitle}>Confirmar</Text>
                <Text style={styles.modernActionSubtitle}>Validar este reporte</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modernActionButton, styles.falseModern]}
              onPress={() => {
                setCardModalVisible(false);
                if (selectedReporte?._id) reportarFalso(selectedReporte._id);
              }}
            >
              <AlertTriangle size={28} color="#F44336" />
              <View style={styles.modernActionText}>
                <Text style={styles.modernActionTitle}>Reportar falso</Text>
                <Text style={styles.modernActionSubtitle}>Marcar como no válido</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modernActionButton, styles.shareModern]}
              onPress={() => {
                setCardModalVisible(false);
                if (selectedReporte) compartirReporte(selectedReporte);
              }}
            >
              <Share2 size={28} color="#2196F3" />
              <View style={styles.modernActionText}>
                <Text style={styles.modernActionTitle}>Compartir</Text>
                <Text style={styles.modernActionSubtitle}>Enviar a redes sociales</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  </View>
</Modal>

      {/* Alerta personalizada */}
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
  
  // Botones
  profileButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#1C1C1E',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    zIndex: 1000,
  },
  profileButtonText: { fontSize: 24 },
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

  // Modales
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
  modalSubtitle: {
    color: '#8E8E93',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScroll: { maxHeight: '70%' },
  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 10,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  optionButtonDisabled: { opacity: 0.5 },
  optionText: { color: '#FFFFFF', fontSize: 14 },
  modalCloseButton: {
    backgroundColor: '#DC2626',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },

  // Bottom Sheet
  sheetHeader: {
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 16,
    textTransform: 'uppercase',
  },
  filterActive: { color: '#FFFFFF' },
  categoriaScroll: {
    flexGrow: 0,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoriaChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoriaChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  categoriaText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  categoriaTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardsContainerVertical: {
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 8,
  },

  // Modal de opciones (Viejo - Eliminar después)
  cardDetails: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    width: '100%',
  },
  cardTipo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDesc: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 12,
  },
  cardStats: { gap: 6 },
  cardStatText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  cardOptions: { gap: 10, width: '100%' },
  cardOption: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmOption: { backgroundColor: '#4CAF50' },
  falseOption: { backgroundColor: '#F44336' },
  cancelOption: { backgroundColor: '#3A3A3C' },
  shareOption: {
    backgroundColor: '#2196F3',
  },
  cardOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Filtros con íconos
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  iconText: {
    fontSize: 24,
    opacity: 0.7,
  },
  iconTextActive: {
    opacity: 1,
    fontWeight: 'bold',
  },

  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  closeIcon: {
    color: '#8E8E93',
    fontSize: 24,
    fontWeight: '300',
  },

  // Modern Card
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
    marginBottom: 16,
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
    backgroundColor: '#3A3A3C',
  },

  // Actions
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
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  // Modern Modal
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

// Location Card
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

// Sections
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
  headerContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingTop: 50, // Ajustá según tu dispositivo
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
  

});
