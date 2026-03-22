// src/components/ConnectionStatus.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react-native';

interface ConnectionStatusProps {
  pendingCount: number;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ pendingCount }) => {
  const { isOnline } = useNetworkStatus();

  if (!isOnline) {
    return (
      <View style={styles.containerOffline}>
        <WifiOff size={16} color="#FFA500" />
        <Text style={styles.textOffline}>
          Modo offline - Los reportes se guardarán localmente
        </Text>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <View style={styles.containerSyncing}>
        <ActivityIndicator size="small" color="#4CAF50" />
        <Text style={styles.textSyncing}>
          Sincronizando ({pendingCount} pendientes)
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  containerOffline: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: '#FFA50020',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  textOffline: {
    color: '#FFA500',
    fontSize: 12,
    flex: 1,
  },
  badge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  containerSyncing: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: '#4CAF5020',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  textSyncing: {
    color: '#4CAF50',
    fontSize: 12,
    flex: 1,
  },
});