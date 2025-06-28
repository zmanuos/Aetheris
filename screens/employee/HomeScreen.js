// AETHERIS/screens/admin/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = ({ route }) => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenText}>Contenido de {route.name}</Text>
  </View>
);
export default HomeScreen;


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