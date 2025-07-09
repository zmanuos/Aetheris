import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';


const { width } = Dimensions.get('window');
const GAP_BETWEEN_CARDS = 5;


const getHealthStatusColor = (status) => {
  if (!status || typeof status !== 'string') return '#9CA3AF'; // Gris por defecto
  switch (status.toLowerCase()) {
    case 'alta': return '#22C55E';
    case 'media':
    case 'moderada': return '#F59E0B';
    case 'baja': return '#EF4444';
    default: return '#9CA3AF';
  }
};

const getInitials = (nombre, apellido) => {
  let initials = '';
  if (nombre) {
    initials += nombre.charAt(0);
  }
  if (apellido) {
    initials += apellido.charAt(0);
  }
  return initials.toUpperCase();
};

const stringToHslColor = (str, s, l) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const ResidentCard = ({ resident, onEdit, onDelete, onViewProfile, onHistory, onAssignDevice, gridContainerPadding }) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    setImageLoadError(false);
  }, [resident.foto_url]);

  const totalHorizontalPadding = gridContainerPadding * 2;
  const totalGapWidth = GAP_BETWEEN_CARDS * 2;
  const cardWidth = (width - totalHorizontalPadding - totalGapWidth) / 3;

  const age = resident.fecha_nacimiento ? new Date().getFullYear() - new Date(resident.fecha_nacimiento).getFullYear() : 'N/A';

  // Cálculo del promedio para la línea de referencia
  const heartData = resident.historial_frecuencia_cardiaca.slice(-7);
  const average = heartData.length ? (heartData.reduce((a, b) => a + b, 0) / heartData.length) : 0;
  const healthColor = getHealthStatusColor(resident.estado_salud_general);


  const heartRateDataPoints = resident.historial_frecuencia_cardiaca || [];

  const numberOfPointsToShow = 7;
  const recentHeartRateData = heartRateDataPoints.slice(0, numberOfPointsToShow).reverse();

  const heartRateChartData = {
    labels: recentHeartRateData.map((_, index) => (index + 1).toString()),
    datasets: [
      {
        data: recentHeartRateData,
        color: (opacity = 1) => `${healthColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba')}`,
        strokeWidth: 2
      },
      {
        data: new Array(heartData.length).fill(average),
        color: (opacity = 1) => `rgba(107, 178, 64, ${opacity * 0.6})`,
        strokeWidth: 1,
        withDots: false,
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#ffffff",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "healthColor"
    },
    fillShadowGradientFrom: '#FF6384',
    fillShadowGradientTo: '#ffffff',
    fillShadowGradientFromOpacity: 0.3,
    fillShadowGradientToOpacity: 0,
  };

  const initialsBackgroundColor = stringToHslColor(
    `${resident.nombre || ''}${resident.apellido || ''}`,
    70,
    50
  );

  return (
    <View style={[styles.card, { width: cardWidth, marginHorizontal: GAP_BETWEEN_CARDS / 2 }]}>
      <View style={styles.cardHeader}>
        {resident.foto_url && !imageLoadError ? (
          <Image
            source={{ uri: resident.foto_url }}
            style={styles.avatar}
            onError={() => setImageLoadError(true)}
            accessibilityLabel={`Foto de ${resident.nombre} ${resident.apellido}`}
          />
        ) : (
          <View style={[styles.initialsContainer, { backgroundColor: initialsBackgroundColor }]}>
            <Text style={styles.initialsText}>
              {getInitials(resident.nombre, resident.apellido)}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.residentName}>{resident.nombre} {resident.apellido}</Text>
          <Text style={styles.residentDetails}>{age} años • Hab. {resident.nombre_area || 'N/A'}</Text>
        </View>
        {/* Botón 'Agregar dispositivo' movido aquí, con nuevos estilos */}
        {!resident.dispositivo && (
          <TouchableOpacity style={styles.addDeviceButton} onPress={() => onAssignDevice(resident.id_residente)}>
            <Ionicons name="bluetooth" size={18} color="#FFFFFF" />
            <Text style={styles.addDeviceButtonText}>Agregar</Text>
          </TouchableOpacity>
        )}
        {resident.estado_salud_general && (
          <View style={[styles.healthStatusTag, { backgroundColor: getHealthStatusColor(resident.estado_salud_general) }]}>
            <Text style={styles.healthStatusText}>{resident.estado_salud_general}</Text>
          </View>
        )}
      </View>

      {/* --- CUERPO CON GRÁFICA --- */}
      <View style={styles.cardBody}>
        <View style={styles.heartRateSection}>
          <Ionicons name="heart-outline" size={14} color="#EF4444" />
          <Text style={[styles.heartRateText, { color: getHealthStatusColor(resident.estado_salud_general) }]}>FC:</Text>
          {resident.ultima_frecuencia_cardiaca && (
            <Text style={[styles.heartRateValue, { color: getHealthStatusColor(resident.estado_salud_general) }]}>
              {resident.ultima_frecuencia_cardiaca}
              <Text style={[styles.heartRateUnit, { color: getHealthStatusColor(resident.estado_salud_general) }]}> bpm</Text>
            </Text>
          )}
        </View>
        {recentHeartRateData && recentHeartRateData.length > 0 ? (
          <LineChart
            data={heartRateChartData}
            width={cardWidth - 16}
            height={80}
            chartConfig={chartConfig}
            bezier
            style={styles.chartStyle}
            withVerticalLabels={true}
            withHorizontalLabels={false}
            withDots={true}
            withInnerLines={false}
            withOuterLines={false}
            segments={3}
          />
        ) : (
          <Text style={styles.noGraphData}>Sin historial de FC disponible.</Text>
        )}
      </View>

      {/* ... Acciones ... */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.primaryActionButton} onPress={() => onViewProfile(resident.id_residente)}>
          <Ionicons name="eye-outline" size={16} color="#fff" style={styles.iconLeft} />
          <Text style={styles.primaryActionText}>Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryActionButton} onPress={() => onHistory(resident.id_residente)}>
          <Ionicons name="analytics-outline" size={16} color="#fff" style={styles.iconLeft} />
          <Text style={styles.primaryActionText}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryActionButton} onPress={() => onEdit(resident.id_residente)}>
          <Ionicons name="create-outline" size={16} color="#6B7280" style={styles.iconLeft} />
          <Text style={styles.secondaryActionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryActionButton} onPress={() => onDelete(resident.id_residente)}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" style={styles.iconLeft} />
          <Text style={[styles.secondaryActionText, { color: '#EF4444' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    position: 'relative', // Para posicionar el botón de asignación
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  initialsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#A0A0A0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1, // Permite que la información ocupe el espacio restante
  },
  residentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  residentDetails: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  healthStatusTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  healthStatusText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Estilos para el nuevo botón 'Agregar dispositivo'
  addDeviceButton: {
    position: 'absolute', // Posicionamiento absoluto dentro del header
    top: 5, // Ajusta según necesites para el margen superior
    right: 5, // Ajusta según necesites para el margen derecho
    backgroundColor: '#22C55E', // Color verde
    paddingVertical: 4, // Más padding vertical para que sea un poco más grande
    paddingHorizontal: 8, // Más padding horizontal
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDeviceButtonText: {
    color: '#FFFFFF',
    fontSize: 11, // Tamaño de fuente ajustado
    fontWeight: '600',
    marginLeft: 4, // Margen entre el ícono y el texto
  },
  cardBody: {
    padding: 8,
    paddingBottom: 22,
  },
  heartRateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 5,
  },
  heartRateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  heartRateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 'auto',
  },
  heartRateUnit: {
    fontSize: 10,
    color: '#EF4444',
  },
  chartStyle: {
    marginVertical: 0,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 5,
  },
  noGraphData: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 10,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#F9FAFB',
    paddingVertical: 8,
    backgroundColor: '#FDFDFD',
    flexWrap: 'wrap',
  },
  actionButtonIcon: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EAEAEA',
    margin: 2,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(107, 178, 64)',
    minWidth: 120,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginHorizontal: 2,
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginHorizontal: 2,
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  iconLeft: {
    marginRight: 4,
  },
});

export default ResidentCard;