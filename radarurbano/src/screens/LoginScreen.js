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
  const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
  const [codigoVerificacion, setCodigoVerificacion] = useState('');
  const [usuarioIdTemporal, setUsuarioIdTemporal] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const savePushToken = async (userId, token) => {
    try {
      const pushToken = await Notifications.getExpoPushTokenAsync();
      await axios.post(`${API_URL}/usuarios/push-token`, {
        pushToken: pushToken.data
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error guardando push token:', error);
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
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!passwordRegex.test(password)) {
        Alert.alert('Error', 'La contraseña debe contener:\n\n• Mínimo 8 caracteres\n• Al menos 1 letra mayúscula\n• Al menos 1 letra minúscula\n• Al menos 1 número\n• Al menos 1 carácter especial');
        return;
      }
      if (nombre.trim().length < 4) {
        Alert.alert('Error', 'El nombre debe tener al menos 4 caracteres');
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
      
      if (isRegistro) {
        Alert.alert(
          'Verificación de cuenta',
          'Se enviará un código de 6 dígitos a tu correo electrónico para verificar tu cuenta.',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Aceptar', onPress: () => realizarRegistro(endpoint, body) },
          ]
        );
        return;
      }
      
      const response = await axios.post(`${API_URL}${endpoint}`, body);
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      await savePushToken(response.data.usuario.id, response.data.token);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error de conexión');
      setLoading(false);
    }
  };

  const realizarRegistro = async (endpoint, body) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, body);
      setUsuarioIdTemporal(response.data.usuarioId);
      setCodigoVerificacion('');
      setMostrarVerificacion(true);
      const msg = response.data.emailStatus === 'fallo_envio'
        ? `No se pudo enviar el email. Código de prueba: ${response.data.codigoVerificacion}`
        : response.data.codigoVerificacion
          ? `Revisá tu email. Código de prueba: ${response.data.codigoVerificacion}`
          : 'Se envió un código de 6 dígitos a tu email. Revisá tu bandeja de entrada o spam.';
      Alert.alert('Código enviado', msg);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = async () => {
    if (codigoVerificacion.length !== 6) {
      Alert.alert('Error', 'Ingresá el código de 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/usuarios/verificar`, {
        usuarioId: usuarioIdTemporal,
        codigo: codigoVerificacion,
      });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      await savePushToken(res.data.usuario.id, res.data.token);
      Alert.alert('Éxito', 'Cuenta verificada');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  if (mostrarVerificacion) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verificar cuenta</Text>
        <Text style={styles.subtitle}>Ingresá el código de 6 dígitos enviado a tu email</Text>
        <TextInput
          style={styles.input}
          placeholder="Código de verificación"
          placeholderTextColor="#999"
          value={codigoVerificacion}
          onChangeText={setCodigoVerificacion}
          keyboardType="number-pad"
          maxLength={6}
        />
        <TouchableOpacity style={styles.button} onPress={verificarCodigo} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verificar</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMostrarVerificacion(false)}>
          <Text style={styles.link}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!mostrarPassword}
        />
        <TouchableOpacity style={styles.eyeButton} onPress={() => setMostrarPassword(!mostrarPassword)}>
          <Text style={styles.eyeIcon}>{mostrarPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>
      
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
