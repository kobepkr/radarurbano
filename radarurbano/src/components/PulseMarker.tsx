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
          toValue: 1.5,
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
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      centerOffset={{ x: 0, y: -14 }}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.pulse,
            {
              backgroundColor: color,
              opacity: 0.3,
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
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  icon: {
    fontSize: 18,
    textAlign: 'center',
  },
});
