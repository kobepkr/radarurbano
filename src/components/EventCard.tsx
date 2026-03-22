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
  onPress: () => void;
  onConfirm: () => void;
  onFalseReport: () => void;
  // ✅ NUEVAS PROPS
  reacciones?: {
    like?: number;
    urgente?: number;
    peligro?: number;
  };
  onReaccion?: (tipo: string) => void;
  esPremium?: boolean;
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
  onPress,
  onConfirm,
  onFalseReport,
  // ✅ AGREGAR LAS NUEVAS PROPS AQUÍ
  reacciones,
  onReaccion,
  esPremium = false
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

  const handlePress = () => {
    onPress();
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
    <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor() + '20' }]}>
      <Text style={[styles.estadoText, { color: getEstadoColor() }]}>
        {String(getEstadoText())}
      </Text>
    </View>

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

  {/* 👇 REACCIONES - JUSTO DEBAJO DEL ESTADO */}
  {esPremium && reacciones && onReaccion && (
    <View style={styles.reaccionesContainer}>
      <TouchableOpacity 
        style={styles.reaccionButton}
        onPress={() => onReaccion('like')}
      >
        <Text style={styles.reaccionEmoji}>👍</Text>
        <Text style={styles.reaccionCount}>{reacciones.like || 0}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.reaccionButton}
        onPress={() => onReaccion('urgente')}
      >
        <Text style={styles.reaccionEmoji}>🔥</Text>
        <Text style={styles.reaccionCount}>{reacciones.urgente || 0}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.reaccionButton}
        onPress={() => onReaccion('peligro')}
      >
        <Text style={styles.reaccionEmoji}>🚨</Text>
        <Text style={styles.reaccionCount}>{reacciones.peligro || 0}</Text>
      </TouchableOpacity>
    </View>
  )}

  {/* 👇 LÍNEA DIVISORIA AL FINAL */}
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
reaccionesContainer: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 8,
  marginBottom: 8,
},
divider: {
  height: 1,
  backgroundColor: '#2C2C2E',
  marginTop: 4,
},
  reaccionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  reaccionEmoji: {
    fontSize: 14,
  },
  reaccionCount: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
});