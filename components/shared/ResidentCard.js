// AETHERIS/components/shared/ResidentCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native'; // Importa Image
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit'; // Importa LineChart

const { width } = Dimensions.get('window');

// Definimos la constante del gap deseado entre las tarjetas
const GAP_BETWEEN_CARDS = 10; // Espacio deseado entre las tarjetas (ajustado para mejor visualización)

const getHealthStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'alta':
      return '#22C55E'; // Green
    case 'media':
    case 'moderada':
      return '#F59E0B'; // Yellow/Orange
    case 'baja':
      return '#EF4444'; // Red
    default:
      return '#9CA3AF'; // Gray
  }
};

const ResidentCard = ({ resident, onEdit, onDelete, onViewProfile, onHistory, gridContainerPadding }) => {

  // Calcular el ancho disponible restando el padding total del contenedor
  const totalHorizontalPadding = gridContainerPadding * 2; 
  // Para 3 tarjetas, hay 2 gaps entre ellas
  const totalGapWidth = GAP_BETWEEN_CARDS * 2; 
  const cardWidth = (width - totalHorizontalPadding - totalGapWidth) / 3;

  const age = resident.fecha_nacimiento ? new Date().getFullYear() - new Date(resident.fecha_nacimiento).getFullYear() : 'N/A';

  // Datos para la gráfica de frecuencia cardíaca
  const heartRateChartData = {
    // Tomar los últimos 7 puntos para que la gráfica no sea demasiado densa
    labels: resident.historial_frecuencia_cardiaca.slice(-7).map((_, index) => (index + 1).toString()), 
    datasets: [
      {
        data: resident.historial_frecuencia_cardiaca.slice(-7), // Usar solo los últimos 7 valores
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Color de la línea (rojo/rosa)
        strokeWidth: 2 
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#ffffff",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`, // Color de etiquetas y líneas de la cuadrícula
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0, // No mostrar decimales en el eje Y
    propsForDots: {
      r: "3", // Radio de los puntos en la línea
      strokeWidth: "1",
      stroke: "#FF6384" // Borde de los puntos
    },
    fillShadowGradientFrom: '#FF6384', // Color de inicio del gradiente de área
    fillShadowGradientTo: '#ffffff',   // Color de fin del gradiente de área
    fillShadowGradientFromOpacity: 0.3, // Opacidad del gradiente de área
    fillShadowGradientToOpacity: 0,     // Opacidad del gradiente de área
  };

  return (
    <View style={[styles.card, { width: cardWidth, marginHorizontal: GAP_BETWEEN_CARDS / 2 }]}>
      <View style={styles.cardHeader}>
        {/* Usar Image para el avatar si resident.foto contiene una URL válida, sino el placeholder */}
        <Image
          source={{ uri: resident.foto && resident.foto !== 'default' ? resident.foto : `https://ui-avatars.com/api/?name=${resident.nombre}+${resident.apellido}&background=random&color=fff&size=128` }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.residentName}>{resident.nombre} {resident.apellido}</Text>
          <Text style={styles.residentDetails}>{age} años • Hab. {resident.nombre_area || 'N/A'}</Text>
        </View>
        {resident.estado_salud_general && (
          <View style={[styles.healthStatusTag, { backgroundColor: getHealthStatusColor(resident.estado_salud_general) }]}>
            <Text style={styles.healthStatusText}>{resident.estado_salud_general}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.heartRateSection}>
          <Ionicons name="heart-outline" size={14} color="#EF4444" />
          <Text style={styles.heartRateText}>FC:</Text>
          {resident.ultima_frecuencia_cardiaca && (
            <Text style={styles.heartRateValue}>{resident.ultima_frecuencia_cardiaca}<Text style={styles.heartRateUnit}>bpm</Text></Text>
          )}
        </View>
        {/* --- GRÁFICA DE FRECUENCIA CARDÍACA CON LINECHART --- */}
        {resident.historial_frecuencia_cardiaca && resident.historial_frecuencia_cardiaca.length > 0 ? (
            <LineChart
              data={heartRateChartData}
              width={cardWidth - 16} // Ancho de la tarjeta menos padding horizontal
              height={80} // Altura de la gráfica
              chartConfig={chartConfig}
              bezier // Curvas suaves
              style={styles.chartStyle}
              withVerticalLabels={false} // No mostrar etiquetas verticales (números en el eje X)
              withHorizontalLabels={false} // No mostrar etiquetas horizontales (números en el eje Y)
              withDots={true} // Mostrar puntos en la línea
              withInnerLines={false} // Ocultar líneas internas
              withOuterLines={false} // Ocultar líneas externas
              segments={3} // Número de segmentos en el eje Y (para controlar la escala visual)
            />
        ) : (
            <Text style={styles.noGraphData}>Sin historial de FC.</Text>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButtonIcon} onPress={() => onViewProfile(resident.id_residente)}>
          <Ionicons name="eye-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonIcon} onPress={() => onHistory(resident.id_residente)}>
          <Ionicons name="analytics-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonIcon} onPress={() => onEdit(resident.id_residente)}>
          <Ionicons name="create-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonIcon} onPress={() => onDelete(resident.id_residente)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
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
    elevation: 4, // Un poco más de elevación para un efecto 3D
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Sombra más pronunciada
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  avatar: { // Estilos para el nuevo Image de avatar
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6', // Color de fondo si no hay imagen
  },
  headerInfo: {
    flex: 1,
  },
  residentName: {
    fontSize: 14, // Ligeramente más grande
    fontWeight: '700', // Más negrita
    color: '#333',
  },
  residentDetails: {
    fontSize: 10, // Ligeramente más grande
    color: '#6B7280',
    marginTop: 2,
  },
  healthStatusTag: {
    paddingVertical: 3, // Más padding
    paddingHorizontal: 8, // Más padding
    borderRadius: 20, // Más redondeado
    marginLeft: 8,
  },
  healthStatusText: {
    color: 'white',
    fontSize: 9, // Ligeramente más grande
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 8,
  },
  heartRateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 5, // Más espacio debajo
  },
  heartRateText: {
    fontSize: 12, // Más grande
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  heartRateValue: {
    fontSize: 14, // Más grande
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 'auto',
  },
  heartRateUnit: {
    fontSize: 10, // Más grande
    color: '#EF4444',
  },
  chartStyle: {
    marginVertical: 0, // Ajusta los márgenes de la gráfica
    borderRadius: 5,
    alignSelf: 'center', // Centra la gráfica dentro del contenedor
    marginTop: 5,
  },
  noGraphData: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 10,
    fontSize: 11, // Más grande
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    borderTopColor: '#F9FAFB',
    paddingVertical: 8, // Más padding
    backgroundColor: '#FDFDFD',
  },
  actionButtonIcon: {
    paddingVertical: 5, // Más padding
    paddingHorizontal: 8, // Más padding
    borderRadius: 6,
    backgroundColor: '#EAEAEA', // Un ligero fondo para los botones de acción
  },
});

export default ResidentCard;
