import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface EventCardProps {
  title: string;
  address: string;
  distance: string;
  time: string;
  categoria: string;
  description: string;
  confirmaciones: number;
  reportesFalsos?: number;
  estado: string;
  onPress: () => void;
  onConfirm: () => void;
  onFalseReport: () => void;
  reacciones?: {
    like?: number;
    urgente?: number;
    peligro?: number;
  };
  onReaccion?: (tipo: string) => void;
  esPremium?: boolean;
  comentariosCount?: number;
  onOpenComments?: () => void;
  onLocate?: () => void;
  creadoPorNombre?: string;
}

const categoriaLabels: { [key: string]: string } = {
  transito: '🚦 Tránsito',
  seguridad: '🔒 Seguridad',
  emergencias: '🚨 Emergencias',
  comunidad: '🏘️ Comunidad',
};

export default function EventCard({ 
  title, 
  address, 
  distance, 
  time, 
  categoria,
  description,
  confirmaciones,
  reportesFalsos = 0,
  estado,
  onPress,
  onConfirm,
  onFalseReport,
  reacciones,
  onReaccion,
  esPremium = false,
  comentariosCount = 0,
  onOpenComments,
  onLocate,
  creadoPorNombre
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
      case 'confirmado': return 'Confirmado';
      case 'falso': return 'Falso';
      default: return 'Pendiente';
    }
  };

  const getEstadoIcon = () => {
    switch(estado) {
      case 'confirmado': return '✅';
      case 'falso': return '❌';
      default: return '⏳';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Tipo + Estado + Locate */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onLocate && (
            <TouchableOpacity onPress={onLocate} style={styles.locateButton}>
              <Text style={styles.locateIcon}>📍</Text>
            </TouchableOpacity>
          )}
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor() + '25' }]}>
            <Text style={styles.estadoIcon}>{getEstadoIcon()}</Text>
            <Text style={[styles.estadoText, { color: getEstadoColor() }]}>
              {getEstadoText()}
            </Text>
          </View>
        </View>
      </View>

      {/* Categoría */}
      <View style={styles.categoriaRow}>
        <Text style={styles.categoriaLabel}>
          {categoriaLabels[categoria] || '📍 General'}
        </Text>
      </View>

      {/* Ubicación + distancia */}
      <View style={styles.infoRow}>
        <Text style={styles.address} numberOfLines={1}>{address}</Text>
        <View style={styles.distanceBadge}>
          <Text style={styles.distance}>{distance}</Text>
        </View>
      </View>

      {/* Tiempo */}
      <Text style={styles.time}>{time}</Text>
      {creadoPorNombre ? (
        <Text style={styles.creadoPor}>📢 Publicado por {creadoPorNombre}</Text>
      ) : null}

      {/* Descripción */}
      {description && description !== `Reporte de ${title.toLowerCase()}` && (
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={onConfirm}>
          <Text style={styles.actionIcon}>✅</Text>
          <Text style={styles.actionCount}>{confirmaciones}</Text>
          <Text style={styles.actionLabel}>Confirmar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onFalseReport}>
          <Text style={styles.actionIcon}>⚠️</Text>
          <Text style={styles.actionCount}>{reportesFalsos}</Text>
          <Text style={styles.actionLabel}>Falso</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onReaccion && onReaccion('like')}
        >
          <Text style={styles.actionIcon}>👍</Text>
          <Text style={styles.actionCount}>{reacciones?.like || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onReaccion && onReaccion('urgente')}
        >
          <Text style={styles.actionIcon}>🔥</Text>
          <Text style={styles.actionCount}>{reacciones?.urgente || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onReaccion && onReaccion('peligro')}
        >
          <Text style={styles.actionIcon}>🚨</Text>
          <Text style={styles.actionCount}>{reacciones?.peligro || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onOpenComments && onOpenComments()}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{comentariosCount}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    flex: 1,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  locateButton: {
    padding: 4,
  },
  locateIcon: {
    fontSize: 16,
  },
  estadoIcon: {
    fontSize: 10,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoriaRow: {
    marginBottom: 6,
  },
  categoriaLabel: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    color: '#8E8E93',
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  distanceBadge: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  distance: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '500',
  },
  time: {
    color: '#6B6B6B',
    fontSize: 11,
    marginBottom: 4,
  },
  creadoPor: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginVertical: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionCount: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  actionLabel: {
    color: '#6B6B6B',
    fontSize: 10,
  },
});
