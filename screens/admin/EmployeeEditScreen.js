// AETHERIS/screens/admin/EmployeeEditScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    TextInput,
    ActivityIndicator,
    Dimensions,
    Switch // Importamos Switch para el campo 'activo'
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import Config from '../../config/config';

import {
    formatName,
    isValidName,
    isAdult,
    formatPhoneNumber,
    isValidPhoneNumber,
    isValidDateFormat,
    isValidEmail, // Aunque no se edita el email, mantenemos la validación si se decidiera habilitar
} from '../../components/shared/Validations';

import { useNotification } from '../../src/context/NotificationContext';

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
const BUTTON_HOVER_COLOR = '#5aa130';

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

export default function EmployeeEditScreen({ route, onEmployeeEdited, onCancel }) {
    const { employeeData } = route.params; // Obtenemos los datos del empleado pasados por la navegación

    const [employeeName, setEmployeeName] = useState(employeeData.nombre);
    const [employeeLastName, setEmployeeLastName] = useState(employeeData.apellido);
    const [employeePhone, setEmployeePhone] = useState(employeeData.telefono);
    const [employeeGender, setEmployeeGender] = useState(employeeData.genero);
    const [employeeBirthDate, setEmployeeBirthDate] = useState(
        new Date(employeeData.fecha_nacimiento).toISOString().split('T')[0] // FormatoYYYY-MM-DD
    );
    const [employeeActive, setEmployeeActive] = useState(employeeData.activo); // Nuevo estado para 'activo'

    const [formError, setFormError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { showNotification } = useNotification();

    const [nameError, setNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [birthDateError, setBirthDateError] = useState('');

    const API_URL = Config.API_BASE_URL;

    // Handlers de cambio y blur para validación
    const handleNameChange = (text) => {
        const formatted = formatName(text);
        setEmployeeName(formatted);
        if (nameError && isValidName(formatted)) {
            setNameError('');
        }
    };

    const handleNameBlur = () => {
        if (!employeeName.trim()) {
            setNameError('El nombre es obligatorio.');
        } else if (!isValidName(employeeName)) {
            setNameError('El nombre solo puede contener letras y espacios.');
        } else {
            setNameError('');
        }
    };

    const handleLastNameChange = (text) => {
        const formatted = formatName(text);
        setEmployeeLastName(formatted);
        if (lastNameError && isValidName(formatted)) {
            setLastNameError('');
        }
    };

    const handleLastNameBlur = () => {
        if (!employeeLastName.trim()) {
            setLastNameError('El apellido es obligatorio.');
        } else if (!isValidName(employeeLastName)) {
            setLastNameError('El apellido solo puede contener letras y espacios.');
        } else {
            setLastNameError('');
        }
    };

    const handlePhoneChange = (text) => {
        const formatted = formatPhoneNumber(text);
        setEmployeePhone(formatted);
        if (phoneError && isValidPhoneNumber(formatted)) {
            setPhoneError('');
        }
    };

    const handlePhoneBlur = () => {
        if (!employeePhone) {
            setPhoneError('El teléfono es obligatorio.');
        } else if (!isValidPhoneNumber(employeePhone)) {
            setPhoneError('El teléfono debe tener exactamente 10 dígitos numéricos.');
        } else {
            setPhoneError('');
        }
    };

    // Birth date and Gender handlers are removed/disabled as these fields are not editable.
    // The state for these fields is initialized from employeeData and used for display.

    const handleSaveEmployee = async () => {
        setFormError('');

        // Disparar validaciones para campos editables
        handleNameBlur();
        handleLastNameBlur();
        handlePhoneBlur();

        const editableFieldErrors = [
            nameError, lastNameError, phoneError
        ].filter(Boolean);

        if (!employeeName.trim() || !employeeLastName.trim() || !employeePhone ||
            !employeeGender || !employeeBirthDate) { // employeeGender and employeeBirthDate are still required for completeness, but not validated for format/content here
            setFormError('Por favor, completa todos los campos obligatorios.');
            return;
        }

        if (editableFieldErrors.length > 0) {
            setFormError('Por favor, corrige los errores en los campos editables.');
            return;
        }

        // Validaciones finales antes de enviar (solo para campos editables)
        if (!isValidName(employeeName) || !isValidName(employeeLastName) ||
            !isValidPhoneNumber(employeePhone)
        ) {
            setFormError('Por favor, corrige los errores en el formulario antes de guardar.');
            return;
        }

        setIsSaving(true);

        try {
            const updatedEmployeeData = {
                nombre: employeeName,
                apellido: employeeLastName,
                // Include original non-editable fields if your backend expects them for PUT requests
                fecha_nacimiento: new Date(employeeData.fecha_nacimiento).toISOString(),
                genero: employeeData.genero,
                telefono: employeePhone,
                activo: employeeActive,
            };

            const response = await fetch(`${API_URL}/Personal/${employeeData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedEmployeeData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = errorData.message || errorData.title || 'Error desconocido al actualizar datos personales.';
                if (errorData.errors && Object.keys(errorData.errors).length > 0) {
                    errorMessage += "\n" + Object.values(errorData.errors).flat().join("\n");
                }
                throw new Error(errorMessage);
            }

            console.log("Datos personales de empleado actualizados en SQL a través del backend.");

            showNotification('Empleado actualizado exitosamente!', 'success');
            onEmployeeEdited(); // Esto disparará la recarga en la pantalla anterior
        } catch (error) {
            console.error("Error al actualizar empleado:", error.message);
            let errorMessage = "Ocurrió un error inesperado al actualizar el empleado.";
            errorMessage = error.message;
            showNotification(errorMessage, 'error');
            setFormError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.formTitle}>Editar Empleado</Text>
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <View style={IS_LARGE_SCREEN ? styles.rowContainer : null}>
                <View style={[IS_LARGE_SCREEN ? styles.rowField : null, styles.fieldWrapper]}>
                    <Text style={styles.inputLabel}>Nombre</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Juan"
                            placeholderTextColor={LIGHT_GRAY}
                            value={employeeName}
                            onChangeText={handleNameChange}
                            onBlur={handleNameBlur}
                        />
                    </View>
                    {nameError ? <Text style={styles.fieldErrorText}>{nameError}</Text> : null}
                </View>

                <View style={[IS_LARGE_SCREEN ? styles.rowField : null, styles.fieldWrapper]}>
                    <Text style={styles.inputLabel}>Apellido</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Pérez"
                            placeholderTextColor={LIGHT_GRAY}
                            value={employeeLastName}
                            onChangeText={handleLastNameChange}
                            onBlur={handleLastNameBlur}
                        />
                    </View>
                    {lastNameError ? <Text style={styles.fieldErrorText}>{lastNameError}</Text> : null}
                </View>
            </View>

            <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Teléfono</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 5512345678"
                        placeholderTextColor={LIGHT_GRAY}
                        value={employeePhone}
                        onChangeText={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />
                    <Text style={styles.charCounter}>{employeePhone.length}/10</Text>
                </View>
                {phoneError ? <Text style={styles.fieldErrorText}>{phoneError}</Text> : null}
            </View>

            <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Género</Text>
                <View style={[styles.pickerInputContainer, styles.disabledField]}> {/* Apply disabled style */}
                    <Ionicons name="person-circle-outline" size={18} color={LIGHT_GRAY} style={styles.inputIcon} /> {/* Change icon color */}
                    <Picker
                        selectedValue={employeeGender}
                        onValueChange={(itemValue) => { /* Disabled, no change handler */ }}
                        style={[styles.picker, { color: LIGHT_GRAY }]} // Apply text color for picker
                        itemStyle={[styles.pickerItem, { color: LIGHT_GRAY }]} // Also apply to itemStyle for better consistency
                        enabled={false} // Disable the picker
                    >
                        <Picker.Item label="Masculino" value="Masculino" />
                        <Picker.Item label="Femenino" value="Femenino" />
                    </Picker>
                </View>
            </View>

            <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
                <View style={[styles.inputContainer, styles.disabledField]}> {/* Apply disabled style */}
                    <Ionicons name="calendar-outline" size={18} color={LIGHT_GRAY} style={styles.inputIcon} /> {/* Change icon color */}
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={employeeBirthDate}
                            // Directly merge styles for web HTML element
                            style={{
                                ...StyleSheet.flatten(styles.datePickerWeb), // Flatten the RN StyleSheet object
                                color: LIGHT_GRAY,
                                border: 'none', // Ensure border is explicitly none
                                borderWidth: 0,
                                borderColor: 'transparent',
                                boxShadow: 'none', // Remove any box-shadow that might look like a border
                            }}
                            disabled={true} // Disable the web input
                        />
                    ) : (
                        <TextInput
                            style={[styles.input, { color: LIGHT_GRAY }]} // Apply text color for native input
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={LIGHT_GRAY}
                            value={employeeBirthDate}
                            editable={false} // Disable the native TextInput
                        />
                    )}
                </View>
                {/* birthDateError is still rendered but will not update as field is disabled */}
                {birthDateError ? <Text style={styles.fieldErrorText}>{birthDateError}</Text> : null}
            </View>

            <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Estado (Activo/Inactivo)</Text>
                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Inactivo</Text>
                    <Switch
                        trackColor={{ false: LIGHT_GRAY, true: LIGHT_GREEN }}
                        thumbColor={employeeActive ? PRIMARY_GREEN : MEDIUM_GRAY}
                        ios_backgroundColor={LIGHT_GRAY}
                        onValueChange={setEmployeeActive}
                        value={employeeActive}
                    />
                    <Text style={styles.switchLabel}>Activo</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSaveEmployee}
                disabled={isSaving}
            >
                <Text style={styles.primaryButtonText}>
                    {isSaving ? <ActivityIndicator color={WHITE} /> : 'GUARDAR CAMBIOS'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const containerBaseStyles = {
    backgroundColor: WHITE,
    borderRadius: 15,
    padding: 18,
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: VERY_LIGHT_GRAY,
};

const styles = StyleSheet.create({
    formContainer: {
        ...containerBaseStyles,
        alignSelf: 'center',
        marginTop: IS_LARGE_SCREEN ? Dimensions.get('window').height * 0.05 : 15,
        marginBottom: 20,
        paddingVertical: 25,
        paddingHorizontal: IS_LARGE_SCREEN ? 25 : 12,
        width: IS_LARGE_SCREEN ? '50%' : '90%',
        maxWidth: IS_LARGE_SCREEN ? 650 : '95%',
    },
    formTitle: {
        fontSize: IS_LARGE_SCREEN ? 26 : 22,
        fontWeight: '700',
        color: DARK_GRAY,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 14,
        color: DARK_GRAY,
        marginBottom: 4,
        fontWeight: '600',
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 0,
    },
    rowField: {
        flex: 1,
        marginRight: IS_LARGE_SCREEN ? 10 : 0,
    },
    fieldWrapper: {
        marginBottom: 12,
        position: 'relative',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: VERY_LIGHT_GRAY,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: BACKGROUND_LIGHT,
        height: 45,
    },
    input: {
        flex: 1,
        height: '100%',
        color: MEDIUM_GRAY,
        fontSize: 15,
        paddingLeft: 8,
        ...Platform.select({
            web: {
                outline: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
            },
        }),
    },
    inputIcon: {
        marginRight: 0,
        fontSize: 18,
    },
    picker: {
        flex: 1,
        height: '100%',
        color: MEDIUM_GRAY,
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        borderRadius: 0,
        ...Platform.select({
            web: {
                outline: 'none',
            },
        }),
    },
    pickerItem: {
        fontSize: 15,
    },
    pickerInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: BACKGROUND_LIGHT,
        height: 45,
    },
    datePickerWeb: {
        flex: 1,
        height: '100%',
        color: MEDIUM_GRAY,
        fontSize: 15,
        paddingLeft: 8,
        borderWidth: 0, // This should normally remove the border
        backgroundColor: 'transparent',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
        outline: 'none',
        cursor: 'pointer',
        paddingRight: Platform.OS === 'web' ? 10 : 0,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderColor: VERY_LIGHT_GRAY,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: BACKGROUND_LIGHT,
        height: 45,
    },
    switchLabel: {
        fontSize: 15,
        color: MEDIUM_GRAY,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 8,
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transitionDuration: '0.3s',
                transitionProperty: 'background-color',
                ':hover': {
                    backgroundColor: BUTTON_HOVER_COLOR,
                },
            },
        }),
    },
    primaryButtonText: {
        color: WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: ERROR_RED,
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
    },
    fieldErrorText: {
        color: ERROR_RED,
        fontSize: 12,
        position: 'absolute',
        bottom: -15,
        left: 5,
    },
    charCounter: {
        fontSize: 12,
        color: LIGHT_GRAY,
        marginLeft: 8,
    },
    // Style for disabled fields
    disabledField: {
        backgroundColor: VERY_LIGHT_GRAY, // Make background gray
        opacity: 0.7, // Add some opacity
        borderColor: LIGHT_GRAY, // Adjust border color
    },
});