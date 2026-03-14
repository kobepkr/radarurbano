import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface EventCardProps {
  title: string;
  address: string;
  distance: string;
  time: string;
  description: string;
  confirmaciones: number;
  reportesFalsos?: number;
  estado: string;
  onPress: () => void;  // Esta función abre el modal oscuro
  onConfirm: () => void;
  onFalseReport: () => void;
}

export default function EventCard({ 
  title, 
  address, 
  distance, 
  time, 
  description,
  confirmaciones,
  reportesFalsos = 0,
  estado,
  onPress,  // 👈 Esta es la función que abre el modal
  onConfirm,
  onFalseReport
}: EventCardProps) {
  
  const getEstadoColor = () => {
    switch(estado) {
      case 'confirmado': return '#4CAF50';
      case 'falso': return '#F44336';
      default: return '#FFA500';
    }
  };

  const getEstadoText = () => {
    switch(estado) {
      case 'confirmado': return '✅ Confirmado';
      case 'falso': return '❌ Falso';
      default: return '⏳ Pendiente';
    }
  };

  // 👇 AHORA SOLO LLAMA A onPress (que abre el modal oscuro)
  const handlePress = () => {
    onPress();  // Esto abre el modal en lugar del Alert blanco
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Text style={styles.title}>{String(title)}</Text>
      
      <View style={styles.locationContainer}>
        <Text style={styles.address}>{String(address)}</Text>
        <Text style={styles.distance}>{String(distance)}</Text>
      </View>
      
      <Text style={styles.time}>{String(time)}</Text>
      <Text style={styles.description}>{String(description)}</Text>

      {/* Fila con estado a la izquierda y estadísticas a la derecha */}
      <View style={styles.row}>
        {/* Estado a la izquierda */}
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor() + '20' }]}>
          <Text style={[styles.estadoText, { color: getEstadoColor() }]}>
            {String(getEstadoText())}
          </Text>
        </View>

        {/* Estadísticas a la derecha */}
        <View style={styles.statsContainer}>
          <Text style={styles.confirmaciones}>
            ✅ {String(confirmaciones)}
          </Text>
          {reportesFalsos > 0 && (
            <Text style={styles.falsos}>
              ⚠️ {String(reportesFalsos)}
            </Text>
          )}
        </View>
      </View>

      {/* Línea divisoria al final */}
      <View style={styles.divider} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  address: {
    color: '#8E8E93',
    fontSize: 14,
  },
  distance: {
    color: '#8E8E93',
    fontSize: 14,
  },
  time: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 8,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmaciones: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  falsos: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
  },
});