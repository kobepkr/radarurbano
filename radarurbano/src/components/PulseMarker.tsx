import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface IconoIncendioProps {
  size?: number;
}

const AnimatedG = Animated.createAnimatedComponent(G);

export const IconoIncendio: React.FC<IconoIncendioProps> = ({ size = 36 }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r="55" fill="#CC0000" stroke="#FF4444" strokeWidth="4" />
        <G transform="translate(60, 55)">
          <Path
            d="M0 -25 Q-15 0 -8 15 Q-20 10 -12 30 Q0 25 0 45 Q0 25 12 30 Q8 10 20 15 Q15 0 0 -25"
            fill="#FF6600"
          />
          <Path
            d="M0 -15 Q-10 5 -5 18 Q-15 12 -8 28 Q0 22 0 38 Q0 22 8 28 Q5 12 15 18 Q10 5 0 -15"
            fill="#FFCC00"
          />
        </G>
      </Svg>
    </Animated.View>
  );
};

interface PulseMarkerProps {
  coordinate: { latitude: number; longitude: number };
  color: string;
  icono: string;
  onPress?: () => void;
}

export default function PulseMarker({ coordinate, color, icono, onPress }: PulseMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  if (icono.includes('incendio') || icono.includes('🔥')) {
    return (
      <Marker coordinate={coordinate} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}>
        <IconoIncendio size={32} />
      </Marker>
    );
  }

  return (
    <Marker coordinate={coordinate} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={styles.container}>
        <Animated.View style={[styles.pulseCircle, { backgroundColor: color, opacity: 0.25, transform: [{ scale: pulseAnim }] }]} />
        <View style={[styles.iconBg, { borderColor: color }]}>
          <Animated.Text style={styles.icon}>{icono}</Animated.Text>
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  svgContainer: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  pulseCircle: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  iconBg: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1C1C1E', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 16, textAlign: 'center' },
});
