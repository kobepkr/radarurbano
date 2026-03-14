import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Marker } from 'react-native-maps';

interface PulseMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  color: string;
  onPress?: () => void;
}

export default function PulseMarker({ coordinate, color, onPress }: PulseMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      // 👇 Esto centra correctamente el marcador
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={{ justifyContent: 'center', alignItems: 'center', width: 50, height: 50 }}>
        {/* Círculo de pulso */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 25,
            height: 25,
            borderRadius: 15,
            backgroundColor: color,
            opacity: 0.4,
            transform: [{ scale: pulseAnim }],
          }}
        />
        {/* Punto central (más pequeño) */}
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: 'white',
          }}
        />
      </View>
    </Marker>
  );
}