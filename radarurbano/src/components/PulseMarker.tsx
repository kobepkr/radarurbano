import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { getIconoMarker } from '../utils/iconos';

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

  const imagen = getIconoMarker(tipo);

  return (
    <Marker coordinate={coordinate} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        {imagen ? (
          <Image source={imagen} style={styles.iconImg} resizeMode="contain" />
        ) : (
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{icono}</Text>
          </View>
        )}
      </Animated.View>
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
