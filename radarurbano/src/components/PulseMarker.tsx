import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

interface PulseMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  color: string;
  icono: string;
  onPress?: () => void;
}

export default function PulseMarker({ coordinate, color, icono, onPress }: PulseMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Marker coordinate={coordinate} onPress={onPress}>
      <View style={styles.wrapper}>
        <Animated.View
          style={[
            styles.pulse,
            {
              backgroundColor: color,
              opacity: 0.35,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Text style={styles.icon}>{icono}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  icon: {
    fontSize: 20,
    textAlign: 'center',
    zIndex: 1,
  },
});
