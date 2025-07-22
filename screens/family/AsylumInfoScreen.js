// AETHERIS/screens/family/AsylumInfoScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AsylumInfoScreen() { 
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Información del Asilo</Text>
      <Text>Aquí se mostrarán los datos de contacto del asilo y del personal responsable.</Text>
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