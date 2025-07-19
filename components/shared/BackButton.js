// AETHERIS/components/shared/BackButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- COLORES ---
const PRIMARY_GREEN = '#6BB240';
const WHITE = '#fff';

export default function BackButton({ onPress, title = 'Regresar', style }) { 
    return (
        <TouchableOpacity onPress={onPress} style={[styles.backButton, style]}> 
            <Ionicons name="arrow-back-outline" size={20} color={WHITE} />
            <Text style={styles.backButtonText}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 25, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3, 
    },
    backButtonText: {
        color: WHITE,
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
});