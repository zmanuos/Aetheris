import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  // Alert, // No longer needed for web, but kept for native fallback if desired
  Platform,
  Dimensions,
  Pressable,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Config from '../../config/config'; // Import the Config file

// Import the Notification component
import Notification from '../shared/Notification'; // Adjust path if necessary

// --- CONSTANTES DE ESTILO ---
const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc';
const WHITE = '#fff';
const ERROR_RED = '#DC3545';
const BUTTON_HOVER_COLOR = '#5aa130'; // For web hover effect

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;
// --- FIN CONSTANTES DE ESTILO ---

// Reusable Button Component with Hover Effect for Web
const CustomButton = ({ onPress, disabled, loading, title, buttonStyle, textStyle }) => {
  const [isHovering, setIsHovering] = useState(false);

  // Apply hover effect only on web
  const webHoverProps = Platform.OS === 'web' ? {
    onHoverIn: () => setIsHovering(true),
    onHoverOut: () => setIsHovering(false),
  } : {};

  const finalButtonStyle = [
    styles.primaryButton,
    buttonStyle, // Allow overriding styles
    disabled && styles.primaryButtonDisabled,
    Platform.OS === 'web' && isHovering && !disabled && { backgroundColor: BUTTON_HOVER_COLOR }, // Apply hover background
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={finalButtonStyle}
      {...webHoverProps}
    >
      {loading ? (
        <ActivityIndicator color={WHITE} />
      ) : (
        <Text style={[styles.primaryButtonText, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
};

const MyAccountScreen = ({ route }) => {
  const { firebaseUid } = route.params;
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  // const [message, setMessage] = useState(null); // This state will be replaced by Notification component

  const notificationRef = useRef(null); // Create a ref for the Notification component

  const showNotification = (msg, type) => {
    if (notificationRef.current) {
      notificationRef.current.show(msg, type);
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Fetch initial admin email
  useEffect(() => {
    const fetchAdminEmail = async () => {
      if (!firebaseUid) {
        showNotification('UID de usuario no disponible.', 'error');
        setLoadingInitialData(false);
        return;
      }

      try {
        setLoadingInitialData(true);
        // setMessage(null); // No longer needed
        const response = await fetch(`${Config.API_BASE_URL}/Personal/manage/get-correo/${firebaseUid}`); // Use Config.API_BASE_URL

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.email) {
          setCurrentEmail(data.email);
          setNewEmail(data.email); // Initialize newEmail with current email
        } else {
          showNotification('No se encontró correo electrónico para este usuario.', 'error');
          setCurrentEmail('No disponible');
          setNewEmail('');
        }
      } catch (err) {
        showNotification(`Error al obtener el correo: ${err.message}`, 'error');
        setCurrentEmail('Error al cargar');
        setNewEmail('');
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchAdminEmail();
  }, [firebaseUid]);

  const handleUpdateProfile = async () => {
    // setMessage(null); // No longer needed
    let hasError = false;

    // --- Email Validation ---
    let emailToUpdate = newEmail.trim();
    const isEmailChanged = emailToUpdate !== currentEmail;

    if (isEmailChanged) {
      if (!emailToUpdate) {
        showNotification('El nuevo correo no puede estar vacío.', 'error');
        hasError = true;
      } else if (!isValidEmail(emailToUpdate)) {
        showNotification('Formato de correo electrónico inválido.', 'error');
        hasError = true;
      }
    }

    // --- Password Validation ---
    const isPasswordChanged = password.trim().length > 0 || confirmPassword.trim().length > 0;

    if (isPasswordChanged) {
      if (!password.trim() || !confirmPassword.trim()) {
        showNotification('Por favor, ingresa y confirma la nueva contraseña.', 'error');
        hasError = true;
      } else if (password.length < 6) {
        showNotification('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
        hasError = true;
      } else if (password !== confirmPassword) {
        showNotification('La nueva contraseña y su confirmación no coinciden.', 'error');
        hasError = true;
      }
    }

    if (!isEmailChanged && !isPasswordChanged) {
      showNotification('No hay cambios para guardar.', 'info');
      return;
    }

    if (hasError) {
      return; // Stop if validation failed
    }

    setIsUpdating(true);

    try {
      let emailUpdateSuccessful = true;
      let passwordUpdateSuccessful = true;
      let emailUpdateMessage = '';
      let passwordUpdateMessage = '';

      // Perform Email Update if changed
      if (isEmailChanged) {
        try {
          const emailResponse = await fetch(`${Config.API_BASE_URL}/Personal/manage/update-email`, { // Use Config.API_BASE_URL
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*',
            },
            body: JSON.stringify({
              firebaseUid: firebaseUid,
              newEmail: emailToUpdate,
            }),
          });

          if (!emailResponse.ok) {
            let errorData = await emailResponse.text();
            try {
              const parsedError = JSON.parse(errorData);
              errorData = parsedError.message || errorData;
            } catch (e) { /* not JSON */ }

            const lowerCaseErrorMessage = errorData.toLowerCase();
            if (emailResponse.status === 409 || lowerCaseErrorMessage.includes('correo ya existe') || lowerCaseErrorMessage.includes('email already exists') || lowerCaseErrorMessage.includes('duplicate entry')) {
              emailUpdateMessage = `Este correo electrónico ya está en uso.`;
            } else {
              emailUpdateMessage = `Error al actualizar correo: ${errorData || emailResponse.statusText}`;
            }
            emailUpdateSuccessful = false;
          } else {
            setCurrentEmail(emailToUpdate); // Update current email display
            emailUpdateMessage = 'Correo electrónico actualizado con éxito.';
          }
        } catch (err) {
          emailUpdateMessage = `Error de red al actualizar correo: ${err.message}`;
          emailUpdateSuccessful = false;
        }
      }

      // Perform Password Update if changed
      if (isPasswordChanged && passwordUpdateSuccessful) { // Only attempt password update if no major email error
        try {
          const passwordResponse = await fetch(`${Config.API_BASE_URL}/Personal/manage/update-password`, { // Use Config.API_BASE_URL
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*',
            },
            body: JSON.stringify({
              firebaseUid: firebaseUid,
              newPassword: password,
            }),
          });

          if (!passwordResponse.ok) {
            let errorData = await passwordResponse.text();
            try {
              const parsedError = JSON.parse(errorData);
              errorData = parsedError.message || errorData;
            } catch (e) { /* not JSON */ }
            passwordUpdateMessage = `Error al actualizar contraseña: ${errorData || passwordResponse.statusText}`;
            passwordUpdateSuccessful = false;
          } else {
            setPassword('');
            setConfirmPassword('');
            passwordUpdateMessage = 'Contraseña actualizada con éxito.';
          }
        } catch (err) {
          passwordUpdateMessage = `Error de red al actualizar contraseña: ${err.message}`;
          passwordUpdateSuccessful = false;
        }
      }

      let finalMessage = '';
      let messageType = 'info';

      if (emailUpdateSuccessful && passwordUpdateSuccessful) {
        finalMessage = 'Perfil actualizado con éxito.';
        messageType = 'success';
      } else if (!emailUpdateSuccessful && !passwordUpdateSuccessful) {
        finalMessage = `${emailUpdateMessage}\n${passwordUpdateMessage}`;
        messageType = 'error';
      } else if (!emailUpdateSuccessful) {
        finalMessage = emailUpdateMessage;
        messageType = 'error';
      } else if (!passwordUpdateSuccessful) {
        finalMessage = passwordUpdateMessage;
        messageType = 'error';
      }

      showNotification(finalMessage, messageType); // Use the notification component

    } catch (err) {
      showNotification(`Error inesperado al procesar la actualización: ${err.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Configuración de Cuenta</Text>

          {/* Combined Information and Update Fields */}
          <View style={styles.displayFieldGroup}>
            <View style={styles.displayFieldLabelContainer}>
              <Ionicons name="person-outline" size={20} color={MEDIUM_GRAY} style={styles.fieldIcon} />
              <Text style={styles.displayLabel}>Rol:</Text>
            </View>
            <Text style={styles.displayValueText}>Administrador</Text>
          </View>

          <View style={styles.displayFieldGroup}>
            <View style={styles.displayFieldLabelContainer}>
              <Ionicons name="mail-outline" size={20} color={MEDIUM_GRAY} style={styles.fieldIcon} />
              <Text style={styles.displayLabel}>Email Actual:</Text>
            </View>
            {loadingInitialData ? (
              <ActivityIndicator size="small" color={PRIMARY_GREEN} />
            ) : (
              <Text style={styles.displayValueText}>{currentEmail}</Text>
            )}
          </View>

          <View style={styles.separator} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nuevo Correo Electrónico:</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="at-outline" size={20} color={LIGHT_GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Ingrese el nuevo correo"
                placeholderTextColor={LIGHT_GRAY}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nueva Contraseña:</Text>
            <View style={styles.passwordInputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={LIGHT_GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={LIGHT_GRAY}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color={LIGHT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar Nueva Contraseña:</Text>
            <View style={styles.passwordInputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={LIGHT_GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor={LIGHT_GRAY}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={LIGHT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>

          <CustomButton
            onPress={handleUpdateProfile}
            disabled={isUpdating || loadingInitialData}
            loading={isUpdating}
            title="Actualizar Perfil"
            buttonStyle={styles.fullWidthButton}
          />

          {/* The message display is now handled by the Notification component */}
          {/* {message && (
            <Text
              style={[
                styles.messageText,
                message.type === 'success' && styles.successText,
                message.type === 'error' && styles.errorText,
                message.type === 'info' && styles.infoText,
              ]}
            >
              {message.text}
            </Text>
          )} */}
        </View>
      </ScrollView>
      <Notification ref={notificationRef} /> {/* Render the Notification component */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
    justifyContent: 'center', // Center vertically
    alignItems: 'center',     // Center horizontally
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center', // Center content of ScrollView vertically
    alignItems: 'center',     // Center content of ScrollView horizontally
    paddingVertical: 20,
    paddingHorizontal: 15,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 550 : '90%', // Increased maxWidth slightly
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 12, // Slightly more rounded corners
    padding: 25, // Increased padding
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // More pronounced shadow
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 22, // Slightly larger title
    fontWeight: '700', // Bolder title
    color: DARK_GRAY,
    marginBottom: 25, // Increased margin
    textAlign: 'center',
  },
  displayFieldGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute space between label/icon and value
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12, // Increased vertical padding
    paddingHorizontal: 15,
    backgroundColor: ACCENT_GREEN_BACKGROUND, // Use the accent background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIGHT_GREEN, // Subtle border with light green
  },
  displayFieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Added margin to separate it further from the value
    marginRight: 20, // Increased separation
  },
  displayLabel: {
    fontSize: 16, // Larger font for label
    fontWeight: '600', // Bolder label
    color: MEDIUM_GRAY,
    marginLeft: 5, // Small space after icon
  },
  displayValueText: {
    fontSize: 16, // Larger font for value
    color: DARK_GRAY,
    fontWeight: '700', // Even bolder for the value to stand out
    flexShrink: 1, // Allow the text to wrap if too long
    textAlign: 'right', // Align value to the right
  },
  fieldIcon: {
    marginRight: 10, // Space between icon and text for all field types
  },
  inputGroup: {
    marginBottom: 18, // Increased margin
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50, // Taller input
    borderColor: VERY_LIGHT_GRAY,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: BACKGROUND_LIGHT,
    paddingLeft: 12, // Padding for the icon
  },
  inputIcon: {
    marginRight: 10,
    color: LIGHT_GRAY,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingRight: 12, // Padding on the right
    fontSize: 16, // Larger font
    color: DARK_GRAY,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50, // Taller input
    borderColor: VERY_LIGHT_GRAY,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: BACKGROUND_LIGHT,
    paddingLeft: 12, // Padding for the icon
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 16, // Larger font
    color: DARK_GRAY,
  },
  eyeButton: {
    paddingHorizontal: 12, // Increased padding for touchable area
    height: '100%',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12, // Made button smaller
    borderRadius: 10, // More rounded corners
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30, // More margin above button
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 4 }, // More pronounced shadow
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonDisabled: {
    backgroundColor: LIGHT_GREEN,
    shadowColor: 'transparent',
    elevation: 0,
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: 16, // Made text smaller
    fontWeight: 'bold',
  },
  fullWidthButton: {
    width: '100%',
    marginTop: 25, // Adjusted margin
    marginBottom: 10,
  },
  messageText: {
    marginTop: 20, // Increased margin
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10, // Added horizontal padding for long messages
  },
  successText: {
    color: PRIMARY_GREEN,
    fontWeight: '600',
  },
  errorText: {
    color: ERROR_RED,
    fontWeight: '600',
  },
  infoText: {
    color: MEDIUM_GRAY,
    fontWeight: '500',
    marginTop: 15,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: VERY_LIGHT_GRAY,
    marginVertical: 25, // Increased vertical margin for separator
    width: '100%',
  },
});

export default MyAccountScreen;