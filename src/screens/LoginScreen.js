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
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import styles from './LoginStyles';
import * as RootNavigation from '../navigation/RootNavigation';




const API_URL = 'http://192.168.1.84:4000/api';

export default function LoginScreen() {
  const navigation = useNavigation();
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
      //console.log('Reseteando a MapScreen');
      //RootNavigation.replace('MapScreen');
      console.log('Navegando a MapScreen');
      navigation.navigate('MapScreen');
      
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
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />
        </>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
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