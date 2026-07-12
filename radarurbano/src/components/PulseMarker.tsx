import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Text } from 'react-native';
import { Marker } from 'react-native-maps';

const markerImages: { [key: string]: any } = {
  incendio: require('../../assets/markers/incendio.png'),
  manifestacion: require('../../assets/markers/manifestacion.png'),
  choque: require('../../assets/markers/choque.png'),
  calleCortada: require('../../assets/markers/calleCortada.png'),
  obrasEnVia: require('../../assets/markers/obras.png'),
  corteLuz: require('../../assets/markers/CorteLuz.png'),
  actitudSospechosa: require('../../assets/markers/actividadSospechosa.png'),
  accidenteGrave: require('../../assets/markers/emergenciaMedica.png'),
  ambulanciaLugar: require('../../assets/markers/emergenciaMedica.png'),
  personaHerida: require('../../assets/markers/emergenciaMedica.png'),
  carabinerosLugar: require('../../assets/markers/carabinerosEnellugar.png'),
  controlCarabineros: require('../../assets/markers/carabinerosEnellugar.png'),
  patrulla: require('../../assets/markers/carabinerosEnellugar.png'),
  bomberosLugar: require('../../assets/markers/bomberoLugar.png'),
  perroPerdido: require('../../assets/markers/perroPerdido.png'),
  gatoPerdido: require('../../assets/markers/gatoPerdido.png'),
};

interface PulseMarkerProps {
  coordinate: { latitude: number; longitude: number };
  color: string;
  icono: string;
  tipo: string;
  onPress?: () => void;
}

export default function PulseMarker({ coordinate, color, icono, tipo, onPress }: PulseMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  const imagen = markerImages[tipo];

  return (
    <Marker coordinate={coordinate} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={styles.container}>
        <Animated.View style={[styles.pulse, { backgroundColor: color, opacity: 0.25, transform: [{ scale: pulseAnim }] }]} />
        {imagen ? (
          <Image source={imagen} style={styles.iconImg} resizeMode="contain" />
        ) : (
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{icono}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  pulse: { position: 'absolute', width: 36, height: 36, borderRadius: 18 },
  iconImg: { width: 34, height: 34, zIndex: 1 },
  emojiWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1C1C1E', borderWidth: 2, borderColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  emoji: { fontSize: 16, textAlign: 'center' },
});
