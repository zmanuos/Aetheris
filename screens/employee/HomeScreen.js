import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const CARD_PADDING_HORIZONTAL = 16;
const CARD_MARGIN_VERTICAL = 12;
const CARD_WIDTH = width - CARD_PADDING_HORIZONTAL * 2;

const HomeScreen = () => {
  // Datos estáticos
  const totalResidentes = 120;
  const consultasHoy = 15;
  const incidenciasRecientes = 3;

  // Datos para las gráficas
  const datosConsultasSemana = [2, 3, 5, 4, 6, 1, 3];
  const datosIncidenciasMes = [1, 2, 0, 3, 1, 2, 4, 3, 1, 0, 2, 1, 0, 2, 1, 3, 1, 0, 2, 1, 1, 0, 3, 2, 1, 0, 1, 2, 1, 3];

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#EF4444', 
      fill: '#F87171',   
    },
    fillShadowGradientFrom: '#F87171',
    fillShadowGradientTo: '#ffffff',
    fillShadowGradientFromOpacity: 0.3,
    fillShadowGradientToOpacity: 0,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: CARD_PADDING_HORIZONTAL }}>
      {/* KPI Cards */}
      <View style={styles.kpiContainer}>
        <View style={[styles.kpiCard, styles.kpiCardGreen]}>
          <Text style={styles.kpiNumber}>👵 {totalResidentes}</Text>
          <Text style={styles.kpiLabel}>Residentes Totales</Text>
        </View>
        <View style={[styles.kpiCard, styles.kpiCardGreen]}>
          <Text style={styles.kpiNumber}>🩺 {consultasHoy}</Text>
          <Text style={styles.kpiLabel}>Consultas Hoy</Text>
        </View>
        <View style={[styles.kpiCard, styles.kpiCardGreen]}>
          <Text style={styles.kpiNumber}>⚠️ {incidenciasRecientes}</Text>
          <Text style={styles.kpiLabel}>Incidencias Recientes</Text>
        </View>
      </View>

      {/* Gráfica Consultas Última Semana */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Consultas Última Semana</Text>
        <LineChart
          data={{
            labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
            datasets: [
              {
                data: datosConsultasSemana,
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                strokeWidth: 2,
              },
              {
                data: new Array(datosConsultasSemana.length).fill(
                  datosConsultasSemana.reduce((a, b) => a + b, 0) / datosConsultasSemana.length
                ),
                withDots: false,
                color: (opacity = 1) => `rgba(107, 178, 64, ${opacity * 0.6})`,
                strokeWidth: 1,
              },
            ],
          }}
          width={CARD_WIDTH - 300}
          height={150}
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          withInnerLines={false}
          withOuterLines={false}
          withDots
        />
      </View>

      {/* Gráfica Incidencias Último Mes */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Incidencias Último Mes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <LineChart
            data={{
              labels: datosIncidenciasMes.map((_, i) => ((i + 1) % 5 === 0 ? `${i + 1}` : '')),
              datasets: [
                {
                  data: datosIncidenciasMes,
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: new Array(datosIncidenciasMes.length).fill(
                    datosIncidenciasMes.reduce((a, b) => a + b, 0) / datosIncidenciasMes.length
                  ),
                  withDots: false,
                  color: (opacity = 1) => `rgba(107, 178, 64, ${opacity * 0.6})`,
                  strokeWidth: 1,
                },
              ],
            }}
            width={Math.max(CARD_WIDTH, datosIncidenciasMes.length * 20)}
            height={150}
            chartConfig={chartConfig}
            bezier
            style={styles.chartStyle}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withInnerLines={false}
            withOuterLines={false}
            withDots
          />
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 6,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  kpiCardGreen: {
    backgroundColor: '#e8f5e9',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  kpiNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  kpiLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#353b48',
    marginBottom: 12,
  },
  chartStyle: {
    borderRadius: 8,
    paddingBottom: 20,
  },
});

export default HomeScreen;
