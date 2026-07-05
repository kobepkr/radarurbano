import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import {
  Bell,
  Map,
  Globe,
  FileText,
  Shield,
  Trash2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';

const API_URL = 'https://radarurbano-1.onrender.com/api';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [notificaciones, setNotificaciones] = useState(true);
  const [radioBusqueda, setRadioBusqueda] = useState(50);
  const [radioModalOpen, setRadioModalOpen] = useState(false);
  const [regionDefault, setRegionDefault] = useState('Mi ubicación');

  useEffect(() => {
    AsyncStorage.getItem('notificaciones').then(v => {
      if (v !== null) setNotificaciones(v === 'true');
    });
    AsyncStorage.getItem('radioBusqueda').then(v => {
      if (v) setRadioBusqueda(Number(v));
    });
    AsyncStorage.getItem('regionDefault').then(v => {
      if (v) setRegionDefault(v);
    });
  }, []);

  const toggleNotificaciones = async (value: boolean) => {
    setNotificaciones(value);
    await AsyncStorage.setItem('notificaciones', String(value));
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/usuarios/toggle-notificaciones`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      setNotificaciones(!value);
    }
  };

  const elegirRadio = (r: number) => {
    setRadioBusqueda(r);
    AsyncStorage.setItem('radioBusqueda', String(r));
  };

  const elegirRegion = () => {
    Alert.alert('Región predeterminada', 'Selecciona desde el mapa principal', [
      { text: 'OK' },
    ]);
  };

  const eliminarCuenta = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Login' } as any] });
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.sectionTitle}>Preferencias</Text>

      <View style={styles.item}>
        <Bell size={22} color="#DC2626" />
        <Text style={styles.itemText}>Notificaciones push</Text>
        <Switch
          value={notificaciones}
          onValueChange={toggleNotificaciones}
          trackColor={{ false: '#2C2C2E', true: '#DC2626' }}
          thumbColor="#FFF"
        />
      </View>

      <TouchableOpacity style={styles.item} onPress={() => setRadioModalOpen(true)}>
        <Map size={22} color="#DC2626" />
        <Text style={styles.itemText}>Radio de búsqueda</Text>
        <Text style={styles.itemValue}>{radioBusqueda} km</Text>
        <ChevronRight size={18} color="#8E8E93" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={elegirRegion}>
        <Globe size={22} color="#DC2626" />
        <Text style={styles.itemText}>Región predeterminada</Text>
        <Text style={styles.itemValue}>{regionDefault}</Text>
        <ChevronRight size={18} color="#8E8E93" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Legal</Text>

      <TouchableOpacity style={styles.item}>
        <FileText size={22} color="#8E8E93" />
        <Text style={styles.itemText}>Términos y condiciones</Text>
        <ChevronRight size={18} color="#8E8E93" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.item}>
        <Shield size={22} color="#8E8E93" />
        <Text style={styles.itemText}>Política de privacidad</Text>
        <ChevronRight size={18} color="#8E8E93" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Cuenta</Text>

      <TouchableOpacity style={[styles.item, styles.dangerItem]} onPress={eliminarCuenta}>
        <Trash2 size={22} color="#F44336" />
        <Text style={[styles.itemText, styles.dangerText]}>Eliminar cuenta</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Radar Urbano v1.0.0</Text>

      {/* Modal slider de radio */}
      <Modal visible={radioModalOpen} transparent={true} animationType="slide" onRequestClose={() => setRadioModalOpen(false)}>
        <View style={styles.sliderOverlay}>
          <View style={styles.sliderContent}>
            <Text style={styles.sliderTitle}>Radio de búsqueda</Text>
            <Text style={styles.sliderValue}>{radioBusqueda} km</Text>

            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${((radioBusqueda - 10) / 90) * 100}%` }]} />
              {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.sliderMarker, { left: `${((r - 10) / 90) * 100}%` }]}
                  onPress={() => elegirRadio(r)}
                >
                  <View style={[styles.sliderDot, radioBusqueda >= r && styles.sliderDotActive]} />
                  <Text style={styles.sliderLabel}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sliderHint}>Deslizá para seleccionar distancia</Text>

            <TouchableOpacity style={styles.sliderButton} onPress={() => setRadioModalOpen(false)}>
              <Text style={styles.sliderButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1C1C1E',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    gap: 12,
  },
  itemText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  itemValue: {
    color: '#8E8E93',
    fontSize: 14,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#F44336',
  },
  version: {
    color: '#6B6B6B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
  },
  sliderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sliderContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  sliderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  sliderValue: {
    color: '#DC2626',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sliderTrack: {
    height: 60,
    marginHorizontal: 20,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#DC2626',
    borderRadius: 2,
    left: 0,
    top: 28,
  },
  sliderMarker: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
    marginLeft: -12,
  },
  sliderDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3A3A3C',
    borderWidth: 2,
    borderColor: '#6B6B6B',
    marginBottom: 4,
  },
  sliderDotActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  sliderLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
  },
  sliderHint: {
    color: '#6B6B6B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  sliderButton: {
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  sliderButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
