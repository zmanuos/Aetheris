// AETHERIS/screens/admin/ConsultasHistory.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';

const sampleConsultas = [
  {
    id: '1',
    residente: 'Juan Pérez',
    fecha: '2025-07-01',
    frecuencia_cardiaca: 72,
    oxigeno: 98,
    temperatura: 36.7,
    notas: 'Paciente estable, continuar con dieta blanda.',
  },
  {
    id: '2',
    residente: 'María López',
    fecha: '2025-07-02',
    frecuencia_cardiaca: 105,
    oxigeno: 93,
    temperatura: 38.0,
    notas: 'Se detectó ligera fiebre, monitorizar.',
  },
  {
    id: '3',
    residente: 'Carlos Sánchez',
    fecha: '2025-07-01',
    frecuencia_cardiaca: 58,
    oxigeno: 96,
    temperatura: 37.1,
    notas: 'Signos vitales dentro de rangos normales.',
  },
  {
    id: '4',
    residente: 'Ana Gómez',
    fecha: '2025-06-29',
    frecuencia_cardiaca: 80,
    oxigeno: 92,
    temperatura: 37.8,
    notas: 'Oxígeno bajo, se administró oxígeno suplementario.',
  },
];

const getColorFC = (fc) => (fc > 100 || fc < 60 ? '#dc3545' : '#28a745');
const getColorO2 = (o2) => (o2 < 95 ? '#fd7e14' : '#28a745');
const getColorTemp = (temp) => (temp > 37.5 ? '#dc3545' : '#28a745');

const ConsultasHistory = () => {
  const [searchName, setSearchName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filtrado con useMemo para mejor performance
  const filteredConsultas = useMemo(() => {
    return sampleConsultas.filter((c) => {
      const nombreMatch = c.residente.toLowerCase().includes(searchName.toLowerCase());

      const fechaObj = new Date(c.fecha);
      const fromOk = dateFrom ? fechaObj >= new Date(dateFrom) : true;
      const toOk = dateTo ? fechaObj <= new Date(dateTo) : true;

      return nombreMatch && fromOk && toOk;
    });
  }, [searchName, dateFrom, dateTo]);

  const renderConsultaCard = ({ item, index }) => {
    const bgColor = index % 2 === 0 ? '#fff' : '#f8f9fa';

    return (
      <View style={[styles.cardContainer, { backgroundColor: bgColor }]}>
        <View style={styles.headerRow}>
          <Text style={styles.residenteName}>{item.residente}</Text>
          <Text style={styles.fecha}>{item.fecha}</Text>
        </View>

        <View style={styles.metricsRow}>
          <Text style={styles.notasInline}>📝 {item.notas}</Text>

          <Text style={[styles.metricText, { color: getColorFC(item.frecuencia_cardiaca) }]}>
            FC: <Text style={styles.metricValue}>{item.frecuencia_cardiaca} bpm</Text>
          </Text>
          <Text style={[styles.metricText, { color: getColorO2(item.oxigeno) }]}>
            Oxígeno: <Text style={styles.metricValue}>{item.oxigeno}%</Text>
          </Text>
          <Text style={[styles.metricText, { color: getColorTemp(item.temperatura) }]}>
            Temp: <Text style={styles.metricValue}>{item.temperatura}°C</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.verMasButton}
          onPress={() => alert(`Ver detalles de consulta de ${item.residente}`)}
        >
          <Text style={styles.verMasText}>Ver más 🔍</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Historial de Consultas</Text>

      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nombre"
          value={searchName}
          onChangeText={setSearchName}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />

        <View style={styles.dateFiltersRow}>
          {Platform.OS === 'web' ? (
            <>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Desde"
                style={styles.dateInputWeb}
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Hasta"
                style={styles.dateInputWeb}
              />
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Desde (YYYY-MM-DD)"
                value={dateFrom}
                onChangeText={setDateFrom}
              />
              <TextInput
                style={styles.input}
                placeholder="Hasta (YYYY-MM-DD)"
                value={dateTo}
                onChangeText={setDateTo}
              />
            </>
          )}
        </View>
      </View>

      <FlatList
        data={filteredConsultas}
        keyExtractor={(item) => item.id}
        renderItem={renderConsultaCard}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron consultas.</Text>
        }
        contentContainerStyle={filteredConsultas.length === 0 && styles.flatListEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 15,
    color: '#333',
    alignSelf: 'center',
  },

  filtersContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f2f3f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 12,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  dateFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateInputWeb: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: '1px solid #ddd',
  },

  cardContainer: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e1e3e6',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  residenteName: {
    fontWeight: '700',
    fontSize: 17,
    color: '#222',
  },
  fecha: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  notasInline: {
    fontStyle: 'italic',
    fontSize: 13,
    color: '#495057',
    marginRight: 16,
    flexShrink: 1,
  },
  metricText: {
    fontWeight: '600',
    fontSize: 14,
    marginRight: 12,
  },
  metricValue: {
    fontWeight: 'bold',
  },

  verMasButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  verMasText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 14,
  },

  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  flatListEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default ConsultasHistory;
