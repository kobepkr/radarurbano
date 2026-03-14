import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.1.84:4000/api';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [misReportes, setMisReportes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmados: 0,
    falsos: 0,
    pendientes: 0
  });

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  const cargarDatosUsuario = async () => {
    try {
      // Obtener datos del usuario guardados
      const usuarioStr = await AsyncStorage.getItem('usuario');
      const token = await AsyncStorage.getItem('token');

      if (!usuarioStr || !token) {
        navigation.replace('Login');
        return;
      }

      const usuario = JSON.parse(usuarioStr);
      setUser(usuario);

      // Cargar reportes del usuario
      const response = await axios.get(`${API_URL}/reportes/filtros?creadoPor=${usuario.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const reportes = response.data.reportes || [];
      setMisReportes(reportes);

      // Calcular estadísticas
      const stats = {
        total: reportes.length,
        confirmados: reportes.filter((r: any) => r.estado === 'confirmado').length,
        falsos: reportes.filter((r: any) => r.estado === 'falso').length,
        pendientes: reportes.filter((r: any) => r.estado === 'no_confirmado').length
      };
      setStats(stats);

    } catch (error) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
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
      </View>

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
            <Text style={styles.reporteTipo}>{reporte.tipo.toUpperCase()}</Text>
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
});