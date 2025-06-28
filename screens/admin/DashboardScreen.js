// AETHERIS/screens/admin/DashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DashboardScreen = ({ route }) => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenText}>Contenido de {route.name}</Text>
  </View>
);

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  screenText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
});

export default DashboardScreen;