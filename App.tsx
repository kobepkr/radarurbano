import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CustomDrawer from './src/components/CustomDrawer';
import { MapPin, User } from 'lucide-react-native';

const Drawer = createDrawerNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [mapaOscuro, setMapaOscuro] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      setUserToken(token);
      setIsLoading(false);
    };

    checkToken();

    const interval = setInterval(checkToken, 500);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return null;

  return (
    <NavigationContainer>
      {userToken ? (
        <Drawer.Navigator
          drawerContent={(props) => (
            <CustomDrawer 
              {...props} 
              mapaOscuro={mapaOscuro} 
              setMapaOscuro={setMapaOscuro} 
            />
          )}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              backgroundColor: '#1C1C1E',
              width: 280,
            },
            drawerLabelStyle: {
              color: '#FFF',
              fontSize: 16,
            },
            drawerActiveTintColor: '#DC2626',
            drawerInactiveTintColor: '#FFF',
          }}
        >
          <Drawer.Screen name="MapScreen">
            {props => <MapScreen {...props} mapaOscuro={mapaOscuro} />}
          </Drawer.Screen>

          <Drawer.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              drawerLabel: 'Perfil',
              drawerIcon: ({ color }) => (
                <User size={24} color={color} />
              ),
            }}
          />
        </Drawer.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}