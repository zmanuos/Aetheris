// AETHERIS/screens/family/FamilyDashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FamilyDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Familiar</Text>
      <Text>Aquí se mostrará el ritmo cardíaco, gráficas, temperatura y humedad del asilo, y últimos chequeos semanales.</Text>
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