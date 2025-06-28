// AETHERIS/screens/admin/EmployeeManagementScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmployeeManagementScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administración de Empleados</Text>
      <Text>Aquí el administrador puede ver, añadir, editar o eliminar empleados.</Text>
      {/* Aquí iría la lógica para listar/gestionar empleados */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
});