import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import styles from './LoginStyles';

const API_URL = 'https://radarurbano-1.onrender.com/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistro, setIsRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  // Función para guardar push token
  const savePushToken = async (userId, token) => {
    try {
      const pushToken = await Notifications.getExpoPushTokenAsync();
      console.log('Push token obtenido:', pushToken.data);
      
      await axios.post(`${API_URL}/usuarios/push-token`, {
        pushToken: pushToken.data
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Push token guardado en backend');
    } catch (error) {
      console.error('❌ Error guardando push token:', error);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email y password son requeridos');
      return;
    }

    if (isRegistro && (!nombre || !telefono)) {
      Alert.alert('Error', 'Todos los campos son requeridos');
      return;
    }

    if (isRegistro) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Ingresá un correo electrónico válido (ejemplo@correo.com)');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (nombre.trim().length < 2) {
        Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
        return;
      }
      const telefonoRegex = /^\+?[0-9]{8,15}$/;
      if (!telefonoRegex.test(telefono.replace(/\s/g, ''))) {
        Alert.alert('Error', 'Ingresá un número de teléfono válido');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isRegistro ? '/usuarios/registro' : '/usuarios/login';
      const body = isRegistro 
        ? { nombre, email, password, telefono }
        : { email, password };

      const response = await axios.post(`${API_URL}${endpoint}`, body);
      
      // Guardar token y usuario
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      
      // Guardar push token (solo después de login, no registro)
      if (!isRegistro) {
        await savePushToken(response.data.usuario.id, response.data.token);
      }
      
     Alert.alert('Éxito', isRegistro ? 'Registro exitoso' : 'Login exitoso');
      
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Radar Urbano</Text>
      
      {isRegistro && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor="#999"
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            placeholderTextColor="#999"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />
        </>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isRegistro ? 'Registrarse' : 'Iniciar Sesión'}</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setIsRegistro(!isRegistro)}>
        <Text style={styles.link}>
          {isRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}