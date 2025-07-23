// FamiliarEditScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../../src/context/NotificationContext';

import {
  formatName,
  isValidName,
  formatPhoneNumber,
  isValidPhoneNumber,
  isValidEmail,
} from '../../components/shared/Validations';

import Config from '../../config/config';
const API_URL = Config.API_BASE_URL;

// --- COLORES (Consistencia con los demás archivos) ---
const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc';
const WHITE = '#fff';

const COLORS = {
  primaryGreen: PRIMARY_GREEN,
  lightGreen: LIGHT_GREEN,
  accentGreenBackground: ACCENT_GREEN_BACKGROUND,
  darkGray: DARK_GRAY,
  mediumGray: MEDIUM_GRAY,
  lightGray: LIGHT_GRAY,
  veryLightGray: VERY_LIGHT_GRAY,
  backgroundLight: BACKGROUND_LIGHT,
  white: WHITE,
  errorRed: '#DC3545',
  cardBackground: '#FFFFFF',
  pageBackground: '#F5F7FA',
  inputBorder: '#D1D5DB',
  inputBackground: '#F9FAFB',
  darkText: '#1F2937',
  accentBlue: '#3B82F6',
  borderLight: '#E5E7EB', // Usado en ResidentEditScreen
};

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

export default function FamiliarEditScreen({ residentId }) {
  const [familiar, setFamiliar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { showNotification } = useNotification();

  // Estados para datos del familiar
  const [familiarName, setFamiliarName] = useState('');
  const [familiarApellido, setFamiliarApellido] = useState('');
  const [familiarRelationship, setFamiliarRelationship] = useState('');
  const [familiarPhone, setFamiliarPhone] = useState('');
  const [familiarEmail, setFamiliarEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Estados para validaciones
  const [nameError, setNameError] = useState('');
  const [apellidoError, setApellidoError] = useState('');
  const [relationshipError, setRelationshipError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // --- Funciones de Validación ---
  const validateFamiliar = () => {
    let valid = true;
    if (!familiarName || !isValidName(familiarName)) { setNameError('Nombre inválido.'); valid = false; } else { setNameError(''); }
    if (!familiarApellido || !isValidName(familiarApellido)) { setApellidoError('Apellido inválido.'); valid = false; } else { setApellidoError(''); }
    if (!familiarRelationship) { setRelationshipError('Selecciona un parentesco.'); valid = false; } else { setRelationshipError(''); }
    if (!familiarPhone || !isValidPhoneNumber(familiarPhone)) { setPhoneError('Número de teléfono inválido (10 dígitos).'); valid = false; } else { setPhoneError(''); }
    if (familiarEmail && !isValidEmail(familiarEmail)) { setEmailError('Correo electrónico inválido.'); valid = false; } else { setEmailError(''); }

    // Password validation
    if (newPassword || confirmNewPassword) { // Only validate if either field is touched
      if (newPassword.length < 6) {
        setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
        valid = false;
      } else if (newPassword !== confirmNewPassword) {
        setPasswordError('Las contraseñas no coinciden.');
        valid = false;
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordError(''); // Clear error if no password is being set/changed
    }

    return valid;
  };

  const fetchFamiliarData = useCallback(async () => {
    if (!residentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError('');
    try {
      const response = await fetch(`${API_URL}/familiar_by_resident/${residentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setFamiliar(null); // No familiar found, allow creation
          showNotification('No se encontró familiar asociado. Puedes crear uno.', 'info');
        } else {
          throw new Error('Error al cargar datos del familiar.');
        }
      } else {
        const data = await response.json();
        setFamiliar(data);
        setFamiliarName(data.nombre || '');
        setFamiliarApellido(data.apellido || '');
        setFamiliarRelationship(data.parentesco || '');
        setFamiliarPhone(formatPhoneNumber(data.telefono || ''));
        setFamiliarEmail(data.correo_electronico || '');
      }
    } catch (error) {
      console.error('Error fetching familiar data:', error);
      setFetchError('Error al cargar datos del familiar. Intenta de nuevo.');
      showNotification('Error al cargar datos del familiar.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [residentId, showNotification]);

  useEffect(() => {
    fetchFamiliarData();
  }, [fetchFamiliarData]);


  const handleSaveFamiliar = async () => {
    if (!validateFamiliar()) {
      showNotification('Por favor, corrige los errores en el formulario del familiar.', 'error');
      return;
    }

    setIsLoading(true);
    setFetchError('');
    try {
      const familiarData = {
        nombre: familiarName,
        apellido: familiarApellido,
        parentesco: familiarRelationship,
        telefono: familiarPhone.replace(/\D/g, ''),
        correo_electronico: familiarEmail,
        id_residente: residentId,
      };

      if (newPassword) { // Only send password if it's being updated
        familiarData.password = newPassword;
      }

      const method = familiar ? 'PUT' : 'POST';
      const url = familiar ? `${API_URL}/Familiar/${familiar.id}` : `${API_URL}/Familiar`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(familiarData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el familiar.');
      }

      const savedFamiliar = await response.json();
      setFamiliar(savedFamiliar); // Actualizar el estado con los datos guardados (incluye ID si es nuevo)
      showNotification('Datos del familiar guardados exitosamente.', 'success');

      // Clear password fields after successful save
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (error) {
      console.error('Error saving familiar:', error);
      setFetchError(error.message);
      showNotification(`Error al guardar familiar: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFamiliar = async () => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que quieres eliminar a este familiar?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          onPress: async () => {
            setIsLoading(true);
            setFetchError('');
            try {
              const response = await fetch(`${API_URL}/Familiar/${familiar.id}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el familiar.');
              }

              setFamiliar(null);
              setFamiliarName(''); // Corrected typo
              setFamiliarApellido('');
              setFamiliarRelationship('');
              setFamiliarPhone('');
              setFamiliarEmail('');
              setNewPassword('');
              setConfirmNewPassword('');
              showNotification('Familiar eliminado exitosamente.', 'success');
            } catch (error) {
              console.error('Error deleting familiar:', error);
              setFetchError(error.message);
              showNotification(`Error al eliminar familiar: ${error.message}`, 'error');
            } finally {
              setIsLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  if (isLoading && !fetchError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Cargando datos del familiar...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{fetchError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFamiliarData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Editar datos del Familiar</Text> {/* Changed text */}
      {!familiar && (
        <View style={styles.residentInfoCard}>
          <Text style={styles.residentInfoTitle}>No hay un familiar asociado a este residente.</Text>
          <Text style={styles.residentInfoText}>Completa el formulario para registrar uno nuevo.</Text>
        </View>
      )}

      {/* Campo: Nombre */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : {}]}
          value={familiarName}
          onChangeText={setFamiliarName}
          placeholder="Nombre del familiar"
          placeholderTextColor={COLORS.lightGray}
          onBlur={() => validateFamiliar()}
        />
        {nameError ? <Text style={styles.errorTextSmall}>{nameError}</Text> : null}
      </View>

      {/* Campo: Apellido */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Apellido</Text>
        <TextInput
          style={[styles.input, apellidoError ? styles.inputError : {}]}
          value={familiarApellido}
          onChangeText={setFamiliarApellido}
          placeholder="Apellido del familiar"
          placeholderTextColor={COLORS.lightGray}
          onBlur={() => validateFamiliar()}
        />
        {apellidoError ? <Text style={styles.errorTextSmall}>{apellidoError}</Text> : null}
      </View>

      {/* Campo: Parentesco */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Parentesco</Text>
        <View style={[styles.pickerContainer, relationshipError ? styles.inputError : {}]}>
          <Picker
            selectedValue={familiarRelationship}
            onValueChange={(itemValue) => setFamiliarRelationship(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Selecciona" value="" enabled={false} style={{ color: COLORS.lightGray }} />
            <Picker.Item label="Hijo/a" value="Hijo/a" />
            <Picker.Item label="Padre/Madre" value="Padre/Madre" />
            <Picker.Item label="Hermano/a" value="Hermano/a" />
            <Picker.Item label="Cónyuge" value="Cónyuge" />
            <Picker.Item label="Otro" value="Otro" />
          </Picker>
        </View>
        {relationshipError ? <Text style={styles.errorTextSmall}>{relationshipError}</Text> : null}
      </View>

      {/* Campo: Teléfono */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Teléfono</Text>
        <TextInput
          style={[styles.input, phoneError ? styles.inputError : {}]}
          value={familiarPhone}
          onChangeText={(text) => setFamiliarPhone(formatPhoneNumber(text))}
          keyboardType="phone-pad"
          placeholder="Ej: (123) 456-7890"
          placeholderTextColor={COLORS.lightGray}
          maxLength={14}
          onBlur={() => validateFamiliar()}
        />
        {phoneError ? <Text style={styles.errorTextSmall}>{phoneError}</Text> : null}
      </View>

      {/* Campo: Correo Electrónico */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Correo Electrónico (Opcional)</Text>
        <TextInput
          style={[styles.input, emailError ? styles.inputError : {}]}
          value={familiarEmail}
          onChangeText={setFamiliarEmail}
          keyboardType="email-address"
          placeholder="ejemplo@dominio.com"
          placeholderTextColor={COLORS.lightGray}
          autoCapitalize="none"
          onBlur={() => validateFamiliar()}
        />
        {emailError ? <Text style={styles.errorTextSmall}>{emailError}</Text> : null}
      </View>

      {/* Campo: Nueva Contraseña */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nueva Contraseña</Text>
        <TextInput
          style={[styles.input, passwordError ? styles.inputError : {}]}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={COLORS.lightGray}
          onBlur={() => validateFamiliar()}
        />
        {passwordError ? <Text style={styles.errorTextSmall}>{passwordError}</Text> : null}
      </View>

      {/* Campo: Confirmar Nueva Contraseña */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
        <TextInput
          style={[styles.input, passwordError ? styles.inputError : {}]}
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
          placeholder="Confirmar contraseña"
          placeholderTextColor={COLORS.lightGray}
          onBlur={() => validateFamiliar()}
        />
        {passwordError ? <Text style={styles.errorTextSmall}>{passwordError}</Text> : null}
      </View>


<TouchableOpacity style={styles.primaryButton} onPress={handleSaveFamiliar} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>{familiar ? 'Guardar Cambios del Familiar' : 'Registrar Familiar'}</Text>
        )}
      </TouchableOpacity>
      {familiar && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteFamiliar} disabled={isLoading}>
          <Text style={styles.deleteButtonText}>Eliminar Familiar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: IS_LARGE_SCREEN ? 18 : 16,
    color: COLORS.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 20,
  },
  errorText: {
    color: COLORS.errorRed,
    textAlign: 'center',
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: COLORS.accentBlue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: IS_LARGE_SCREEN ? 20 : 20, // Reduced padding
    marginBottom: IS_LARGE_SCREEN ? 20 : 20, // Reduced margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 380 : '100%', // Significantly reduced max width
  },
  sectionTitle: {
    fontSize: IS_LARGE_SCREEN ? 22 : 20, // Slightly smaller font
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 20, // Reduced margin
    textAlign: 'center',
  },
  residentInfoCard: {
    backgroundColor: COLORS.accentGreenBackground,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGreen,
  },
  residentInfoTitle: {
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 5,
  },
  residentInfoText: {
    fontSize: IS_LARGE_SCREEN ? 14 : 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 10, // Reduced margin
  },
  inputLabel: {
    fontSize: IS_LARGE_SCREEN ? 14 : 13, // Slightly smaller font
    color: COLORS.darkText,
    marginBottom: 6, // Reduced margin
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    padding: IS_LARGE_SCREEN ? 10 : 8, // Reduced padding
    fontSize: IS_LARGE_SCREEN ? 15 : 14, // Slightly smaller font
    color: COLORS.darkText,
    backgroundColor: COLORS.inputBackground,
  },
  inputError: {
    borderColor: COLORS.errorRed,
    borderWidth: 2,
  },
  errorTextSmall: {
    color: COLORS.errorRed,
    fontSize: IS_LARGE_SCREEN ? 12 : 11, // Slightly smaller font
    marginTop: 4, // Adjusted margin
    paddingLeft: 5,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    marginBottom: 10, // Reduced margin
    backgroundColor: COLORS.inputBackground,
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 120 : 40, // Reduced height for picker
    color: COLORS.darkText,
  },
  pickerItem: {
    fontSize: IS_LARGE_SCREEN ? 15 : 14, // Slightly smaller font
    color: COLORS.darkText,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: IS_LARGE_SCREEN ? 12 : 10, // Reduced padding
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15, // Reduced margin
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 350 : '100%', // Adjusted max width for button
  },
  buttonText: {
    color: COLORS.white,
    fontSize: IS_LARGE_SCREEN ? 16 : 15, // Slightly smaller font
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: COLORS.errorRed,
    paddingVertical: IS_LARGE_SCREEN ? 12 : 10, // Reduced padding
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // Reduced margin
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 350 : '100%', // Adjusted max width for button
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: IS_LARGE_SCREEN ? 16 : 15, // Slightly smaller font
    fontWeight: 'bold',
  },
});