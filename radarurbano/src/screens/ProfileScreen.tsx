import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://radarurbano-1.onrender.com/api';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [misReportes, setMisReportes] = useState<any[]>([]);
  const [limite, setLimite] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    confirmados: 0,
    falsos: 0,
    pendientes: 0
  });
  const [racha, setRacha] = useState(0);
  const [confirmacionesDadas, setConfirmacionesDadas] = useState(0);
  const [premiumHasta, setPremiumHasta] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editReporteId, setEditReporteId] = useState<string | null>(null);
  const [editDescripcion, setEditDescripcion] = useState('');

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

const cargarDatosUsuario = async () => {
  try {
    const usuarioStr = await AsyncStorage.getItem('usuario');
    const token = await AsyncStorage.getItem('token');

    if (!usuarioStr || !token) {
      navigation.replace('Login');
      return;
    }

    const usuario = JSON.parse(usuarioStr);
    setUser(usuario);

    // Cargar reportes
    const response = await axios.get(`${API_URL}/reportes/filtros?creadoPor=${usuario.id}&limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const reportes = response.data.reportes || [];
    setMisReportes(reportes);

    // Calcular estadísticas básicas
    const statsCalc = {
      total: reportes.length,
      confirmados: reportes.filter((r: any) => r.estado === 'confirmado').length,
      falsos: reportes.filter((r: any) => r.estado === 'falso').length,
      pendientes: reportes.filter((r: any) => r.estado === 'no_confirmado').length
    };
    setStats(statsCalc);

    const hoy = new Date().toISOString().split('T')[0];
    const ultimaFecha = await AsyncStorage.getItem('ultimaFechaReporte');
    const rachaStorage = await AsyncStorage.getItem('rachaDias');
    let rachaActual = rachaStorage ? Number(rachaStorage) : 0;

    if (ultimaFecha) {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const ayerStr = ayer.toISOString().split('T')[0];
      if (ultimaFecha === ayerStr) rachaActual += 1;
      else if (ultimaFecha !== hoy) rachaActual = stats.total > 0 ? 1 : 0;
    } else if (stats.total > 0) {
      rachaActual = 1;
    }
    setRacha(rachaActual);
    await AsyncStorage.setItem('rachaDias', String(rachaActual));

    const confDadas = await AsyncStorage.getItem('confirmacionesDadas');
    setConfirmacionesDadas(confDadas ? Number(confDadas) : 0);
    
    // ✅ NUEVO: Cargar límite de reportes
    const limiteRes = await axios.get(`${API_URL}/usuarios/limite-reportes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
      setLimite(limiteRes.data);
      if (limiteRes.data.premiumHasta) {
        setPremiumHasta(limiteRes.data.premiumHasta);
      }

  } catch (error) {
    console.error('Error cargando perfil:', error);
    Alert.alert('Error', 'No se pudo cargar el perfil');
  } finally {
    setLoading(false);
  }
};


const editarReporte = async () => {
  if (!editReporteId) return;
  try {
    const token = await AsyncStorage.getItem('token');
    const body: any = {};
    if (editDescripcion.trim()) body.descripcion = editDescripcion.trim();
    if (Object.keys(body).length === 0) { setEditModalVisible(false); return; }
    await axios.put(`${API_URL}/reportes/${editReporteId}`, body, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setMisReportes(prev => prev.map(r => r._id === editReporteId ? { ...r, descripcion: editDescripcion.trim() || r.descripcion } : r));
    setEditModalVisible(false);
    Alert.alert('✅ Editado', 'Reporte actualizado');
  } catch (error) {
    Alert.alert('❌ Error', 'No se pudo editar');
  }
};

// En ProfileScreen.tsx
const handleLogout = async () => {
  Alert.alert(
    'Cerrar sesión',
    '¿Estás seguro de que quieres salir?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          console.log('🧹 Eliminando token...');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('usuario');
          console.log('✅ Token eliminado, esperando que la navegación cambie automáticamente');
          // 👇 ELIMINA O COMENTA ESTA LÍNEA
          // navigation.replace('Login');
        }
      }
    ]
  );
};
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header con avatar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.nombre?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.nombre}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.userPhone}>{user?.telefono}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>
            {stats.total >= 50 ? '🏆 Maestro' :
             stats.total >= 25 ? '🥇 Avanzado' :
             stats.total >= 10 ? '🥈 Intermedio' :
             stats.total >= 3 ? '🥉 Principiante' : '🌱 Nuevo'}
          </Text>
          <Text style={styles.levelSubtext}>{stats.total} reportes</Text>
        </View>
        <View style={styles.rachaRow}>
          <Text style={styles.rachaText}>🔥 Racha: {racha} días</Text>
          <Text style={styles.rachaText}>✅ {confirmacionesDadas} confirmaciones</Text>
        </View>
      </View>



{limite?.es_premium ? (
  <View style={styles.premiumCard}>
    <Text style={styles.premiumEmoji}>⭐</Text>
    <Text style={styles.premiumTitle}>Usuario Premium</Text>
    <Text style={styles.premiumInfo}>Reportes ilimitados · Descripción personalizada</Text>
    {premiumHasta ? (
      <Text style={styles.premiumDias}>Te quedan {Math.max(0, Math.ceil((new Date(premiumHasta).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} días</Text>
    ) : null}
  </View>
) : (
  <TouchableOpacity style={styles.premiumUpgrade} onPress={async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(`${API_URL}/usuarios/checkout-premium`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const { Linking } = require('react-native');
      if (res.data.url) Linking.openURL(res.data.url);
    } catch (e) {
      Alert.alert('Error', 'No se pudo iniciar el pago');
    }
  }}>
    <Text style={styles.premiumEmoji}>⭐</Text>
    <Text style={styles.premiumTitle}>Hacerte Premium</Text>
    <Text style={styles.premiumInfo}>$2.990/mes · Reportes ilimitados · Descripción personalizada</Text>
  </TouchableOpacity>
)}






      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total reportes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.confirmados}</Text>
          <Text style={styles.statLabel}>Confirmados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFA500' }]}>{stats.pendientes}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.falsos}</Text>
          <Text style={styles.statLabel}>Falsos</Text>
        </View>
      </View>

      {/* Últimos reportes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Mis últimos reportes</Text>
        {misReportes.slice(0, 5).map((reporte) => (
           <View key={reporte._id} style={styles.reporteCard}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={styles.reporteTipo}>{reporte.tipo.toUpperCase()}</Text>
               {(reporte.estado !== 'falso') && (
                 <TouchableOpacity onPress={() => { setEditReporteId(reporte._id); setEditDescripcion(reporte.descripcion || ''); setEditModalVisible(true); }}>
                   <Text style={{ fontSize: 18 }}>✏️</Text>
                 </TouchableOpacity>
               )}
             </View>
            <Text style={styles.reporteDesc}>{reporte.descripcion}</Text>
            <View style={styles.reporteFooter}>
              <Text style={styles.reporteEstado}>
                {reporte.estado === 'confirmado' ? '✅ Confirmado' :
                 reporte.estado === 'falso' ? '❌ Falso' : '⏳ Pendiente'}
              </Text>
              <Text style={styles.reporteFecha}>
                {new Date(reporte.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Modal editar */}
      <Modal visible={editModalVisible} transparent={true} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.editOverlay}>
          <View style={styles.editContent}>
            <Text style={styles.editTitle}>Editar descripción</Text>
            <TextInput
              style={styles.editInput}
              value={editDescripcion}
              onChangeText={setEditDescripcion}
              maxLength={200}
              multiline
              placeholder="Nueva descripción..."
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity style={styles.editButton} onPress={editarReporte}>
              <Text style={styles.editButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: '#8E8E93', textAlign: 'center' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Botón cerrar sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#8E8E93',
    fontSize: 16,
    marginBottom: 2,
  },
  userPhone: {
    color: '#8E8E93',
    fontSize: 16,
  },
  levelBadge: {
    backgroundColor: '#DC262620',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  levelText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelSubtext: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  rachaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  rachaText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reporteCard: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  reporteTipo: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reporteDesc: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  reporteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reporteEstado: {
    fontSize: 12,
    color: '#4CAF50',
  },
  reporteFecha: {
    fontSize: 12,
    color: '#8E8E93',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  limiteCard: {
  backgroundColor: '#1C1C1E',
  margin: 16,
  padding: 16,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#2C2C2E',
},
limiteTitle: {
  color: '#8E8E93',
  fontSize: 14,
  marginBottom: 8,
},
limiteCount: {
  color: '#FFF',
  fontSize: 32,
  fontWeight: 'bold',
  marginBottom: 12,
},
progressBar: {
  height: 8,
  backgroundColor: '#2C2C2E',
  borderRadius: 4,
  overflow: 'hidden',
  marginBottom: 8,
},
progressFill: {
  height: '100%',
  borderRadius: 4,
},
limiteInfo: {
  color: '#8E8E93',
  fontSize: 12,
},
premiumCard: {
  backgroundColor: '#FFD70020',
  margin: 16,
  padding: 16,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#FFD700',
  alignItems: 'center',
},
premiumEmoji: {
  fontSize: 32,
  marginBottom: 8,
},
premiumTitle: {
  color: '#FFD700',
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 4,
},
  premiumInfo: {
    color: '#8E8E93',
    fontSize: 12,
  },
  premiumDias: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  premiumUpgrade: {
    backgroundColor: '#FFD70015',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD70040',
    alignItems: 'center',
  },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    width: '90%',
  },
  editTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  editInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});