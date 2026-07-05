import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
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

const RADIOS = [10, 25, 50, 100];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [notificaciones, setNotificaciones] = useState(true);
  const [radioBusqueda, setRadioBusqueda] = useState(50);
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
  };

  const elegirRadio = () => {
    Alert.alert(
      'Radio de búsqueda',
      '¿Cuántos kilómetros alrededor querés buscar?',
      RADIOS.map(r => ({
        text: `${r} km${r === radioBusqueda ? ' ✓' : ''}`,
        onPress: async () => {
          setRadioBusqueda(r);
          await AsyncStorage.setItem('radioBusqueda', String(r));
        },
      })),
    );
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

      <TouchableOpacity style={styles.item} onPress={elegirRadio}>
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
});
