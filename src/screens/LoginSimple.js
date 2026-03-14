
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginSimple({ navigation }) {
  const handleLogin = async () => {
    await AsyncStorage.setItem('token', 'fake-token');
    navigation.replace('Map');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Login Simple</Text>
      <TouchableOpacity onPress={handleLogin} style={{ marginTop: 20, padding: 10, backgroundColor: 'blue' }}>
        <Text style={{ color: 'white' }}>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}