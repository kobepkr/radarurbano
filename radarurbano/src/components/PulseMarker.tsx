import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const FondoSVG = ({ children, size = 32 }: { children: React.ReactNode; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    {children}
  </Svg>
);

const IconoIncendio = ({ size = 32 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 400, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={[styles.svgWrap, { width: size, height: size, transform: [{ scale }] }]}>
      <FondoSVG size={size}>
        <Circle cx="60" cy="60" r="50" fill="#CC0000" stroke="#FF4444" strokeWidth="4" />
        <G transform="translate(60, 55)">
          <Path d="M0 -25 Q-15 0 -8 15 Q-20 10 -12 30 Q0 25 0 45 Q0 25 12 30 Q8 10 20 15 Q15 0 0 -25" fill="#FF6600" />
          <Path d="M0 -15 Q-10 5 -5 18 Q-15 12 -8 28 Q0 22 0 38 Q0 22 8 28 Q5 12 15 18 Q10 5 0 -15" fill="#FFCC00" />
        </G>
      </FondoSVG>
    </Animated.View>
  );
};

const IconoManifestacion = ({ size = 36 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const radio = useRef(new Animated.Value(85)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.02, duration: 500, useNativeDriver: true }),
        Animated.timing(radio, { toValue: 93, duration: 500, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(radio, { toValue: 85, duration: 500, useNativeDriver: false }),
      ]),
    ])).start();
  }, []);
  return (
    <Animated.View style={[styles.svgWrap, { width: size, height: size, transform: [{ scale }] }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF6F00" /><Stop offset="100%" stopColor="#D84315" />
          </RadialGradient>
        </Defs>
        <AnimatedCircle cx="60" cy="60" r={radio} fill="url(#grad)" stroke="#FFB300" strokeWidth="3" />
      </Svg>
      <Text style={styles.emojiOverlay}>✊</Text>
    </Animated.View>
  );
};

const IconoInundacion = ({ size = 32 }) => {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(rotate, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: -1, duration: 1000, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 0, duration: 500, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={[styles.svgWrap, { width: size, height: size, transform: [{ rotate: rotate.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] }) as any }] }]}>
      <FondoSVG size={size}>
        <Circle cx="60" cy="60" r="50" fill="#0D47A1" stroke="#2196F3" strokeWidth="4" />
        <Path d="M20 70 Q40 55 60 70 Q80 85 100 70" fill="none" stroke="#64B5F6" strokeWidth="5" />
      </FondoSVG>
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
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.5, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, []);

  if (icono.includes('🔥')) return <Marker coordinate={coordinate} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}><IconoIncendio size={32} /></Marker>;
  if (icono.includes('✊')) return <Marker coordinate={coordinate} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}><IconoManifestacion size={36} /></Marker>;
  if (icono.includes('🌊')) return <Marker coordinate={coordinate} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}><IconoInundacion size={32} /></Marker>;

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
  svgWrap: { justifyContent: 'center', alignItems: 'center' },
  pulseCircle: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  iconBg: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1C1C1E', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 16, textAlign: 'center' },
  emojiOverlay: { position: 'absolute', fontSize: 22, textAlign: 'center' },
});
