import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { NotificationProvider } from './src/contexts/NotificationContext';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

 useEffect(() => {
  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    setUserToken(token);
    setIsLoading(false);
  };

  // Verificar al inicio
  checkToken();

  // Escuchar cambios en AsyncStorage (para cuando se cierra sesión)
  const interval = setInterval(checkToken, 500);

  return () => clearInterval(interval);
}, []);
  if (isLoading) return null;

  return (
    <NotificationProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <>
            <Stack.Screen name="MapScreen" component={MapScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </NotificationProvider>
  );
}