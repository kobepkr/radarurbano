import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Send } from 'lucide-react-native';

const API_URL = 'http://192.168.1.84:4000/api';

interface Comentario {
  _id?: string;
  usuarioId: string;
  nombre: string;
  texto: string;
  createdAt: string;
}

interface CommentSectionProps {
  reporteId: string;
  esPremium: boolean;
  token: string;
  onComentarioAgregado?: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  reporteId, 
  esPremium, 
  token,
  onComentarioAgregado 
}) => {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Cargar comentarios
  const cargarComentarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/reportes/${reporteId}/comentarios`);
      setComentarios(response.data.comentarios || []);
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enviar comentario
  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return;
    if (!esPremium) {
      alert('Solo usuarios premium pueden comentar');
      return;
    }
    
    setEnviando(true);
    try {
      const response = await axios.post(
        `${API_URL}/reportes/${reporteId}/comentarios`,
        { texto: nuevoComentario.trim() },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setNuevoComentario('');
        await cargarComentarios();
        if (onComentarioAgregado) onComentarioAgregado();
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert('🔒 Solo usuarios premium pueden comentar');
      } else {
        alert('Error al enviar comentario');
      }
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    cargarComentarios();
  }, [reporteId]);

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#DC2626" />
        <Text style={styles.loadingText}>Cargando comentarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        💬 Comentarios ({comentarios.length})
      </Text>
      
      <ScrollView style={styles.comentariosList} showsVerticalScrollIndicator={false}>
        {comentarios.length === 0 ? (
          <Text style={styles.emptyText}>No hay comentarios aún. ¡Sé el primero en comentar!</Text>
        ) : (
          comentarios.map((comentario, index) => (
            <View key={comentario._id || index} style={styles.comentarioCard}>
              <View style={styles.comentarioHeader}>
                <Text style={styles.comentarioNombre}>{comentario.nombre}</Text>
                <Text style={styles.comentarioFecha}>{formatFecha(comentario.createdAt)}</Text>
              </View>
              <Text style={styles.comentarioTexto}>{comentario.texto}</Text>
            </View>
          ))
        )}
      </ScrollView>
      
      {esPremium && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un comentario..."
            placeholderTextColor="#8E8E93"
            value={nuevoComentario}
            onChangeText={setNuevoComentario}
            multiline
            maxLength={300}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !nuevoComentario.trim() && styles.sendButtonDisabled]}
            onPress={enviarComentario}
            disabled={!nuevoComentario.trim() || enviando}
          >
            {enviando ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Send size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {!esPremium && (
        <View style={styles.premiumMessage}>
          <Text style={styles.premiumText}>⭐ Solo usuarios premium pueden comentar</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 8,
  },
  comentariosList: {
    maxHeight: 200,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    padding: 20,
  },
  comentarioCard: {
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  comentarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  comentarioNombre: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  comentarioFecha: {
    color: '#8E8E93',
    fontSize: 10,
  },
  comentarioTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#DC2626',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#6B6B6B',
  },
  premiumMessage: {
    backgroundColor: '#FFD70020',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 12,
  },
});