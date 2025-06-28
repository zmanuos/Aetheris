// AETHERIS/screens/admin/AsylumDataScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AsylumDataScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Datos del Asilo</Text>
      <Text>El administrador puede configurar y actualizar información general del asilo (dirección, contacto, etc.).</Text>
      {/* Aquí iría la lógica para editar datos del asilo */}
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