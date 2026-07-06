import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import {
  Bell,
  Map,
  Globe,
  FileText,
  Shield,
  Trash2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';

const API_URL = 'https://radarurbano-1.onrender.com/api';

const terminosCondiciones = `TÉRMINOS Y CONDICIONES DE USO

Última actualización: Julio 2026

1. ACEPTACIÓN DE LOS TÉRMINOS
Al descargar y usar la aplicación Radar Urbano, aceptás estos términos y condiciones. Si no estás de acuerdo, no uses la aplicación.

2. DESCRIPCIÓN DEL SERVICIO
Radar Urbano es una plataforma comunitaria para reportar y visualizar incidentes urbanos como accidentes de tránsito, emergencias, problemas de seguridad y servicios comunitarios. Los usuarios pueden crear alertas, confirmarlas, comentar y reaccionar.

3. USO RESPONSABLE
• No publiques información falsa o engañosa.
• No uses la app para acosar, amenazar o difamar a otros.
• No publiques contenido ilegal, violento o inapropiado.
• Respetá la privacidad de terceros.

4. CUENTA DE USUARIO
Sos responsable de mantener la confidencialidad de tu cuenta y contraseña. Cualquier actividad bajo tu cuenta es tu responsabilidad.

5. CONTENIDO GENERADO POR USUARIOS
Los reportes y comentarios son responsabilidad de quien los publica. Radar Urbano no verifica la exactitud de la información. Las alertas falsas pueden resultar en la suspensión de tu cuenta.

Al publicar cualquier contenido en Radar Urbano (alertas, reportes, comentarios, reacciones, ubicaciones y datos asociados), cedés a Radar Urbano todos los derechos sobre dicha información. Radar Urbano podrá usar, reproducir, analizar, almacenar y distribuir estos datos de forma libre y sin restricción, incluyendo pero no limitado a: recopilación de datos estadísticos, elaboración de gráficos, mapas de calor, informes, estudios de mercado, comercialización de datos anonimizados y cualquier otro uso que la plataforma considere pertinente. Esta cesión es gratuita, irrevocable y de carácter mundial.

6. LIMITACIÓN DE RESPONSABILIDAD
Radar Urbano se proporciona "tal cual". No garantizamos la disponibilidad continua del servicio ni la exactitud de los reportes. No somos responsables por daños derivados del uso de la app.

7. MODIFICACIONES
Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse.

8. CONTACTO
Para consultas: victorlabbe26@gmail.com`;

const politicaPrivacidad = `POLÍTICA DE PRIVACIDAD

Última actualización: Julio 2026

1. INFORMACIÓN QUE RECOPILAMOS
• Datos de registro: nombre, email, teléfono.
• Datos de ubicación: para mostrar alertas cercanas y enviar notificaciones relevantes.
• Contenido que publicás: reportes, comentarios, reacciones.
• Token de dispositivo: para enviar notificaciones push.

2. USO DE LA INFORMACIÓN
• Mostrar y crear alertas en el mapa.
• Enviar notificaciones push sobre alertas cercanas (solo si las tenés activadas).
• Mejorar la calidad del servicio.
• Prevenir fraudes y usos indebidos.

3. COMPARTIR INFORMACIÓN
Podemos compartir tu información en los siguientes casos:
• Con otros usuarios: tu nombre aparece en los reportes y comentarios que publicás.
• Con terceros: para fines comerciales, estadísticos, publicitarios o de análisis de datos.
• Por obligación legal: si una autoridad lo requiere con orden judicial.
• Para mejorar nuestros servicios: con proveedores y socios tecnológicos.

4. TUS DERECHOS
• Acceder a tus datos personales.
• Solicitar la eliminación de tu cuenta y datos.
• Desactivar notificaciones push desde Configuración.
• Modificar tus preferencias de ubicación.

5. ELIMINACIÓN DE DATOS
Podés eliminar tu cuenta desde Configuración. Esto borrará tu perfil, pero los reportes y comentarios que hayas creado permanecerán de forma anónima.

6. CONTACTO
Para ejercer tus derechos o consultas: victorlabbe26@gmail.com`;

const beneficiosPremium = `⭐ RADAR URBANO PREMIUM

Por solo $2.990/mes obtenés:

📡 MAYOR ALCANCE
• Radio de búsqueda de hasta 500 km (normal: 100 km).
• Monitoreá alertas en todo Chile.

🐾 CATEGORÍAS EXCLUSIVAS
• Mascotas: perros y gatos perdidos, animales agresivos, refugios.
• Medio Ambiente: incendios forestales, fugas de gas, tala ilegal.
• Servicios: internet caído, transporte público, postes dañados.

✨ FUNCIONES AVANZADAS
• Reportes ilimitados (normal: 5 por día).
• Sin límite de vistas de alertas y comentarios.
• Descripción personalizada en tus alertas.
• Borde dorado en tus reportes.
• Insignia ⭐ en tu perfil y en tus publicaciones.

📊 PRÓXIMAMENTE
• Estadísticas avanzadas y mapas de calor.
• Filtros por fecha y tipo de alerta.
• Notificaciones personalizadas.
• Exportación de datos.

¿Preguntas? Escribinos a victorlabbe26@gmail.com`;

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [notificaciones, setNotificaciones] = useState(true);
  const [radioBusqueda, setRadioBusqueda] = useState(50);
  const [radioModalOpen, setRadioModalOpen] = useState(false);
  const [esPremium, setEsPremium] = useState(false);
  const [legalModal, setLegalModal] = useState<'terminos' | 'privacidad' | 'premium' | null>(null);
  const [regionDefault, setRegionDefault] = useState('Mi ubicación');

  useEffect(() => {
    AsyncStorage.getItem('notificaciones').then(v => {
      if (v !== null) setNotificaciones(v === 'true');
    });
    AsyncStorage.getItem('radioBusqueda').then(v => {
      if (v) setRadioBusqueda(Number(v));
    });
    AsyncStorage.getItem('regionDefault').then(v => {
      if (v) setRegionDefault(v);
    });
    AsyncStorage.getItem('usuario').then(v => {
      if (v) setEsPremium(JSON.parse(v).premium || false);
    });
  }, []);

  const toggleNotificaciones = async (value: boolean) => {
    setNotificaciones(value);
    await AsyncStorage.setItem('notificaciones', String(value));
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/usuarios/toggle-notificaciones`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      setNotificaciones(!value);
    }
  };

  const elegirRadio = (r: number) => {
    setRadioBusqueda(r);
    AsyncStorage.setItem('radioBusqueda', String(r));
  };

  const elegirRegion = () => {
    Alert.alert('Región predeterminada', 'Selecciona desde el mapa principal', [
      { text: 'OK' },
    ]);
  };

  const eliminarCuenta = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Login' } as any] });
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.sectionTitle}>Preferencias</Text>

      <View style={styles.item}>
        <Bell size={22} color="#DC2626" />
        <Text style={styles.itemText}>Notificaciones push</Text>
        <Switch
          value={notificaciones}
          onValueChange={toggleNotificaciones}
          trackColor={{ false: '#2C2C2E', true: '#DC2626' }}
          thumbColor="#FFF"
        />
      </View>

      <TouchableOpacity style={styles.item} onPress={() => setRadioModalOpen(true)}>
        <Map size={22} color="#DC2626" />
        <Text style={styles.itemText}>Radio de búsqueda</Text>
        <Text style={styles.itemValue}>{radioBusqueda} km</Text>
        <ChevronRight size={18} color="#8E8E93" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={elegirRegion}>
        <Globe size={22} color="#DC2626" />
        <Text style={styles.itemText}>Región predeterminada</Text>
        <Text style={styles.itemValue}>{regionDefault}</Text>
        <ChevronRight size={18} color="#8E8E93" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Legal</Text>

      <TouchableOpacity style={styles.item} onPress={() => setLegalModal('terminos')}>
        <FileText size={22} color="#8E8E93" />
        <Text style={styles.itemText}>Términos y condiciones</Text>
        <ChevronRight size={18} color="#8E8E93" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => setLegalModal('privacidad')}>
        <Shield size={22} color="#8E8E93" />
        <Text style={styles.itemText}>Política de privacidad</Text>
        <ChevronRight size={18} color="#8E8E93" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>⭐ Premium</Text>

      <TouchableOpacity style={styles.item} onPress={() => setLegalModal('premium')}>
        <Text style={{ fontSize: 20, marginRight: 12 }}>⭐</Text>
        <Text style={styles.itemText}>Beneficios Premium</Text>
        <ChevronRight size={18} color="#8E8E93" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Cuenta</Text>

      <TouchableOpacity style={[styles.item, styles.dangerItem]} onPress={eliminarCuenta}>
        <Trash2 size={22} color="#F44336" />
        <Text style={[styles.itemText, styles.dangerText]}>Eliminar cuenta</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Radar Urbano v1.5.0</Text>

      {/* Modal slider de radio */}
      <Modal visible={radioModalOpen} transparent={true} animationType="slide" onRequestClose={() => setRadioModalOpen(false)}>
        <View style={styles.sliderOverlay}>
          <View style={styles.sliderContent}>
            <Text style={styles.sliderTitle}>Radio de búsqueda</Text>
            <Text style={styles.sliderValue}>{radioBusqueda} km</Text>
            <Text style={styles.sliderLimit}>{esPremium ? '⭐ Premium: hasta 500 km' : 'Máximo 100 km. Hacerte Premium para 500 km'}</Text>

            <View style={styles.sliderTrack}>
              {(() => {
                const values = esPremium 
                  ? [10, 50, 100, 200, 300, 400, 500]
                  : [10, 25, 50, 75, 100];
                const maxR = esPremium ? 500 : 100;
                const fillPct = ((radioBusqueda - 10) / (maxR - 10)) * 100;
                return (
                  <>
                    <View style={[styles.sliderFill, { width: `${fillPct}%` }]} />
                    {values.map(r => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.sliderMarker, { left: `${((r - 10) / (maxR - 10)) * 100}%` }]}
                        onPress={() => elegirRadio(r)}
                      >
                        <View style={[styles.sliderDot, radioBusqueda >= r && styles.sliderDotActive]} />
                        <Text style={styles.sliderLabel}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                );
              })()}
            </View>

            <Text style={styles.sliderHint}>Deslizá para seleccionar distancia</Text>

            <TouchableOpacity style={styles.sliderButton} onPress={() => setRadioModalOpen(false)}>
              <Text style={styles.sliderButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Legal */}
      <Modal visible={legalModal !== null} transparent={true} animationType="slide" onRequestClose={() => setLegalModal(null)}>
        <View style={styles.sliderOverlay}>
          <View style={[styles.sliderContent, { maxHeight: '80%' }]}>
            <Text style={styles.sliderTitle}>
              {legalModal === 'terminos' ? 'Términos y condiciones' : 
               legalModal === 'privacidad' ? 'Política de privacidad' : 'Beneficios Premium'}
            </Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
              <Text style={styles.legalText}>
                {legalModal === 'terminos' ? terminosCondiciones : 
                 legalModal === 'privacidad' ? politicaPrivacidad : beneficiosPremium}
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.sliderButton} onPress={() => setLegalModal(null)}>
              <Text style={styles.sliderButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1C1C1E',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    gap: 12,
  },
  itemText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  itemValue: {
    color: '#8E8E93',
    fontSize: 14,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#F44336',
  },
  version: {
    color: '#6B6B6B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
  },
  sliderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sliderContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  sliderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  sliderValue: {
    color: '#DC2626',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sliderTrack: {
    height: 60,
    marginHorizontal: 20,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#DC2626',
    borderRadius: 2,
    left: 0,
    top: 34,
  },
  sliderMarker: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
    marginLeft: -12,
  },
  sliderDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3A3A3C',
    borderWidth: 2,
    borderColor: '#6B6B6B',
    marginBottom: 4,
  },
  sliderDotActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  sliderLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
  },
  sliderHint: {
    color: '#6B6B6B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  sliderLimit: {
    color: '#FFD700',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  sliderButton: {
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  sliderButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legalText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
});
