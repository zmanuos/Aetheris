// AETHERIS/screens/employee/ResidentsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Importa el componente de tarjeta desde la nueva ubicación compartida
import ResidentCard from '../../components/shared/ResidentCard';

// Definimos esta constante aquí para que sea consistente con el cálculo en ResidentCard
const GRID_CONTAINER_PADDING = 10;

// Asegúrate de que esta pantalla sea un componente de una pila de navegación
// para poder acceder al prop 'navigation'.
export default function ResidentsScreen({ navigation }) { // <-- Asegúrate de recibir 'navigation' aquí
  // Estados para la carga y errores (se mantienen para la estructura, pero no se usarán con datos estáticos)
  const [isLoading, setIsLoading] = useState(false); // Falso inicialmente para datos estáticos
  const [fetchError, setFetchError] = useState(''); // Vacío inicialmente para datos estáticos

  // Datos estáticos de residentes
  const [residents, setResidents] = useState([
    {
      id_residente: 101,
      nombre: 'Sofía',
      apellido: 'Ramírez',
      fecha_nacimiento: '1945-03-10T00:00:00Z',
      genero: 'Femenino',
      telefono: '5511223344',
      activo: true,
      nombre_area: 'Ala A - Hab. 1',
      ultima_frecuencia_cardiaca: 75,
      historial_frecuencia_cardiaca: [70, 72, 75, 73, 76, 74, 75],
      estado_salud_general: 'Alta',
      fecha_ingreso: '2020-01-15T00:00:00Z',
      ubicacion_actual: 'Planta Baja, cerca de la ventana',
      contacto_familiar_nombre: 'Laura Ramírez',
      contacto_familiar_parentesco: 'Hija',
      contacto_familiar_telefono: '5598765432',
    },
    {
      id_residente: 102,
      nombre: 'Roberto',
      apellido: 'Castro',
      fecha_nacimiento: '1938-07-22T00:00:00Z',
      genero: 'Masculino',
      telefono: '5522334455',
      activo: true,
      nombre_area: 'Ala B - Hab. 5',
      ultima_frecuencia_cardiaca: 95,
      historial_frecuencia_cardiaca: [88, 92, 95, 90, 93, 94, 95],
      estado_salud_general: 'Media',
      fecha_ingreso: '2019-05-20T00:00:00Z',
      ubicacion_actual: 'Segundo Piso, cerca de la sala común',
      contacto_familiar_nombre: 'Miguel Castro',
      contacto_familiar_parentesco: 'Hijo',
      contacto_familiar_telefono: '5512345678',
    },
    {
      id_residente: 103,
      nombre: 'Isabel',
      apellido: 'Vargas',
      fecha_nacimiento: '1950-01-05T00:00:00Z',
      genero: 'Femenino',
      telefono: '5533445566',
      activo: false,
      nombre_area: 'Ala C - Hab. 10',
      ultima_frecuencia_cardiaca: 58,
      historial_frecuencia_cardiaca: [65, 60, 58, 62, 59, 60, 58],
      estado_salud_general: 'Baja',
      fecha_ingreso: '2021-09-01T00:00:00Z',
      ubicacion_actual: 'Primer Piso, patio interior',
      contacto_familiar_nombre: 'Ana Vargas',
      contacto_familiar_parentesco: 'Nieta',
      contacto_familiar_telefono: '5501234567',
    },
    {
      id_residente: 104,
      nombre: 'Fernando',
      apellido: 'López',
      fecha_nacimiento: '1962-11-20T00:00:00Z',
      genero: 'Masculino',
      telefono: '5544556677',
      activo: true,
      nombre_area: 'Ala A - Hab. 3',
      ultima_frecuencia_cardiaca: 80,
      historial_frecuencia_cardiaca: [78, 80, 82, 79, 81, 80, 80],
      estado_salud_general: 'Alta',
      fecha_ingreso: '2022-03-01T00:00:00Z',
      ubicacion_actual: 'Planta Baja, cerca de la entrada principal',
      contacto_familiar_nombre: 'Pablo López',
      contacto_familiar_parentesco: 'Sobrino',
      contacto_familiar_telefono: '5578901234',
    },
    {
      id_residente: 105,
      nombre: 'Carmen',
      apellido: 'Díaz',
      fecha_nacimiento: '1930-02-14T00:00:00Z',
      genero: 'Femenino',
      telefono: '5555667788',
      activo: true,
      nombre_area: 'Ala B - Hab. 7',
      ultima_frecuencia_cardiaca: 70,
      historial_frecuencia_cardiaca: [68, 70, 71, 69, 72, 70, 70],
      estado_salud_general: 'Alta',
      fecha_ingreso: '2018-08-10T00:00:00Z',
      ubicacion_actual: 'Segundo Piso, balcón sur',
      contacto_familiar_nombre: 'Elena Díaz',
      contacto_familiar_parentesco: 'Hija',
      contacto_familiar_telefono: '5534567890',
    },
  ]);

  // MODIFICACIÓN AQUÍ:
  const handleAddNewResident = () => {
    // Asegúrate de que 'RegisterResident' sea el nombre de la ruta definida en tu Stack Navigator
    navigation.navigate('RegisterResident'); // <-- REDIRECCIONA AQUÍ
  };

  const handleViewProfile = (id) => {
    Alert.alert('Ver Perfil', `Ver perfil del residente con ID: ${id}`);
  };

  const handleHistory = (id) => {
    Alert.alert('Ver Historial', `Ver historial médico del residente con ID: ${id}`);
  };

  const handleEditResident = (id) => {
    Alert.alert('Editar Residente', `Editar residente con ID: ${id}`);
  };

  const handleDeleteResident = (id) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar al residente con ID: ${id}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => {
            Alert.alert('Eliminado', `Residente ${id} eliminado (simulado).`);
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.createButton} onPress={handleAddNewResident}>
          <Ionicons name="person-add" size={20} color={styles.createButtonText.color} />
          <Text style={styles.createButtonText}>NUEVO RESIDENTE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchFilterContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar residente..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Filtros</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#10B981" style={styles.loadingIndicator} />
      ) : fetchError ? (
        <Text style={styles.errorText}>{fetchError}</Text>
      ) : residents.length === 0 ? (
        <Text style={styles.noResidentsText}>No hay residentes registrados.</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.residentsGrid}>
            {residents.map((resident) => (
              <ResidentCard
                key={resident.id_residente}
                resident={resident}
                onEdit={handleEditResident}
                onDelete={handleDeleteResident}
                onViewProfile={handleViewProfile}
                onHistory={handleHistory}
                // Pasamos el padding del contenedor a la tarjeta para el cálculo preciso
                gridContainerPadding={GRID_CONTAINER_PADDING}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: 'transparent',
    elevation: 0,
  },
  createButtonText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  residentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_CONTAINER_PADDING,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  noResidentsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },
});