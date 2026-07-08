import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Text as SvgText, Rect } from 'react-native-svg';

const IconoIncendio = ({ size = 32 }: { size?: number }) => (
  <Svg viewBox="0 0 120 120" width={size} height={size}>
    <Circle cx="60" cy="60" r="50" fill="#CC0000" stroke="#FF4444" strokeWidth="4" />
    <G transform="translate(60, 55)">
      <Path d="M0 -25 Q-15 0 -8 15 Q-20 10 -12 30 Q0 25 0 45 Q0 25 12 30 Q8 10 20 15 Q15 0 0 -25" fill="#FF6600" />
      <Path d="M0 -15 Q-10 5 -5 18 Q-15 12 -8 28 Q0 22 0 38 Q0 22 8 28 Q5 12 15 18 Q10 5 0 -15" fill="#FFCC00" />
    </G>
  </Svg>
);

const IconoManifestacion = ({ size = 32 }: { size?: number }) => (
  <Svg viewBox="0 0 200 200" width={size} height={size}>
    <Defs>
      <RadialGradient id="gmf" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FF6F00" /><Stop offset="100%" stopColor="#D84315" />
      </RadialGradient>
    </Defs>
    <Circle cx="100" cy="100" r="85" fill="url(#gmf)" stroke="#FFB300" strokeWidth="6" />
    <G><SvgText x="35" y="100" textAnchor="middle" fontSize="35" fill="rgba(255,255,255,0.5)" fontWeight="bold">{'✊'}</SvgText></G>
    <G><SvgText x="100" y="95" textAnchor="middle" fontSize="70" fill="white" fontWeight="bold">{'✊'}</SvgText></G>
    <G><SvgText x="165" y="100" textAnchor="middle" fontSize="35" fill="rgba(255,255,255,0.5)" fontWeight="bold">{'✊'}</SvgText></G>
  </Svg>
);

const IconoInundacion = ({ size = 32 }: { size?: number }) => (
  <Svg viewBox="0 0 120 120" width={size} height={size}>
    <Circle cx="60" cy="60" r="50" fill="#0D47A1" stroke="#2196F3" strokeWidth="4" />
    <Path d="M20 70 Q40 55 60 70 Q80 85 100 70" fill="none" stroke="#64B5F6" strokeWidth="5" />
  </Svg>
);

const IconoEmergenciaMedica = ({ size = 32 }: { size?: number }) => (
  <Svg viewBox="0 0 120 120" width={size} height={size}>
    <Circle cx="60" cy="60" r="50" fill="#D32F2F" stroke="#FF1744" strokeWidth="4" />
    <Rect x="50" y="35" width="20" height="50" rx="4" fill="white" />
    <Rect x="35" y="50" width="50" height="20" rx="4" fill="white" />
  </Svg>
);

const IconoCorteLuz = ({ size = 32 }: { size?: number }) => (
  <Svg viewBox="0 0 120 120" width={size} height={size}>
    <Circle cx="60" cy="60" r="50" fill="#4E342E" stroke="#FFD600" strokeWidth="4" />
  </Svg>
);

interface PulseMarkerProps {
  coordinate: { latitude: number; longitude: number };
  color: string;
  icono: string;
  onPress?: () => void;
}

export default function PulseMarker({ coordinate, color, icono, onPress }: PulseMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  const getContent = () => {
    if (icono.includes('🔥')) return <Animated.View style={{ transform: [{ scale: pulseAnim }] }}><IconoIncendio size={32} /></Animated.View>;
    if (icono.includes('✊')) return <Animated.View style={{ transform: [{ scale: pulseAnim }] }}><IconoManifestacion size={32} /></Animated.View>;
    if (icono.includes('🌊')) return <Animated.View style={{ transform: [{ scale: pulseAnim }] }}><IconoInundacion size={32} /></Animated.View>;
    if (icono.includes('🚑')) return <Animated.View style={{ transform: [{ scale: pulseAnim }] }}><IconoEmergenciaMedica size={32} /></Animated.View>;
    if (icono.includes('⚡')) return <Animated.View style={{ transform: [{ scale: pulseAnim }] }}><IconoCorteLuz size={32} /></Animated.View>;
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.pulse, { backgroundColor: color, opacity: 0.25, transform: [{ scale: pulseAnim }] }]} />
        <View style={[styles.badge, { borderColor: color }]}>
          <Animated.Text style={styles.emoji}>{icono}</Animated.Text>
        </View>
      </View>
    );
  };

  return (
    <Marker coordinate={coordinate} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}>
      {getContent()}
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerWrap: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  container: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  pulse: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  pulseBig: { position: 'absolute', width: 34, height: 34, borderRadius: 17 },
  badge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1C1C1E', borderWidth: 2, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  emoji: { fontSize: 16, textAlign: 'center' },
});
