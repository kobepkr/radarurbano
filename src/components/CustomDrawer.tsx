import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  Home,
  User,
  Settings,
  Info,
  LogOut,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function CustomDrawer(props: any) {
  const [userData, setUserData] = useState({ nombre: 'Usuario', email: '' });

  useEffect(() => {
    const getUserData = async () => {
      try {
        const usuarioStr = await AsyncStorage.getItem('usuario');
        if (usuarioStr) {
          const usuario = JSON.parse(usuarioStr);
          setUserData({
            nombre: usuario.nombre || 'Usuario',
            email: usuario.email || '',
          });
        }
      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
      }
    };
    getUserData();
  }, []);

const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('usuario');
    
    // Usar reset exactamente como en ProfileScreen
    props.navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};

  return (
    <View style={styles.drawerContainer}>
      {/* Header del drawer con perfil */}
      <TouchableOpacity 
        style={styles.profileHeader}
        onPress={() => {
          props.navigation.closeDrawer();
          props.navigation.navigate('Profile');
        }}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userData.nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userData.nombre}</Text>
          <Text style={styles.profileRole}>Usuario</Text>
        </View>
        <ChevronRight size={20} color="#8E8E93" />
      </TouchableOpacity>

      {/* Separador después del perfil */}
      <View style={styles.separator} />

      {/* Items del menú */}
      <View style={styles.menuItems}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            props.navigation.closeDrawer();
            props.navigation.navigate('MapScreen');
          }}
        >
          <Home size={24} color="#FFF" />
          <Text style={styles.menuItemText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            props.navigation.closeDrawer();
            props.navigation.navigate('Profile');
          }}
        >
          <User size={24} color="#FFF" />
          <Text style={styles.menuItemText}>Mi Perfil</Text>
        </TouchableOpacity>

        {/* Switch de modo oscuro/claro */}
        <View style={styles.menuItem}>
          {props.mapaOscuro ? 
            <Moon size={24} color="#FFF" /> : 
            <Sun size={24} color="#FFF" />
          }
          <Text style={styles.menuItemText}>Modo oscuro</Text>
          <TouchableOpacity 
            style={[styles.switchTrack, props.mapaOscuro && styles.switchTrackActive]}
            onPress={() => props.setMapaOscuro(!props.mapaOscuro)}
          >
            <View style={[styles.switchThumb, props.mapaOscuro && styles.switchThumbActive]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => alert('Configuración - Próximamente')}
        >
          <Settings size={24} color="#FFF" />
          <Text style={styles.menuItemText}>Configuración</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => alert('Acerca de - Versión 1.0.0')}
        >
          <Info size={24} color="#FFF" />
          <Text style={styles.menuItemText}>Acerca de</Text>
        </TouchableOpacity>

        {/* Separador antes de cerrar sesión */}
        <View style={styles.separator} />

        {/* Cerrar sesión */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleLogout}
        >
          <LogOut size={24} color="#F44336" />
          <Text style={[styles.menuItemText, styles.logoutText]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2C2C2E',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileRole: {
    color: '#8E8E93',
    fontSize: 13,
  },
  separator: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginVertical: 10,
  },
  menuItems: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  logoutText: {
    color: '#F44336',
  },
  switchTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    padding: 2,
  },
  switchTrackActive: {
    backgroundColor: '#DC2626',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
});