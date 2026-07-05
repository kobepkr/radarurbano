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
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
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
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              backgroundColor: color,
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.4],
                outputRange: [0.4, 0],
              }),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{icono}</Text>
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30,30,30,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
