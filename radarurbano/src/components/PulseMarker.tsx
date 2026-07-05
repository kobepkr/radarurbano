import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.container, { borderColor: color }]}>
        <Text style={styles.icon}>{icono}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    textAlign: 'center',
  },
});
