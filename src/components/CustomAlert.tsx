import React, { useEffect, useRef } from 'react';

import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  autoClose?: number; // tiempo en ms para cerrar automático
}

export default function CustomAlert({ 
  visible, 
  title, 
  message, 
  type = 'success', 
  onClose,
  autoClose = 9000 
}: CustomAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();

      if (autoClose > 0) {
        const timer = setTimeout(() => {
          onClose();
        }, autoClose);
        return () => clearTimeout(timer);
      }
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const getIcon = () => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  };

  const getColors = () => {
    switch(type) {
      case 'success': return {
        icon: '#4CAF50',
        button: '#4CAF50',
      };
      case 'error': return {
        icon: '#F44336',
        button: '#DC2626',
      };
      case 'info': return {
        icon: '#2196F3',
        button: '#1976D2',
      };
      default: return {
        icon: '#4CAF50',
        button: '#4CAF50',
      };
    }
  };

  const colors = getColors();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: '#1C1C1E',
            }
          ]}
        >
           <View style={[styles.iconContainer, { backgroundColor: `${colors.icon}20` }]}>
           <Text style={[styles.icon, { color: colors.icon }]}>{getIcon()}</Text>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.button }]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '80%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});