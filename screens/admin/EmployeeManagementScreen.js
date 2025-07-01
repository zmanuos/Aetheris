// AETHERIS/screens/admin/EmployeeManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import Config from '../../config/config'; // <-- ¡Importa tu archivo de configuración!

export default function EmployeeManagementScreen() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeLastName, setEmployeeLastName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [employeeGender, setEmployeeGender] = useState('');
  const [employeeBirthDate, setEmployeeBirthDate] = useState('');
  const [formError, setFormError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // La URL base ahora viene de Config.API_BASE_URL
  const API_URL = Config.API_BASE_URL;

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    setFetchError('');
    try {
      const response = await fetch(`${API_URL}/Personal`); // <-- Usa API_URL aquí

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar empleados del backend.');
      }

      const data = await response.json();
      if (data && data.personal) {
        setEmployees(data.personal);
      } else {
        setEmployees(data);
      }
      console.log("Empleados cargados:", data);
    } catch (error) {
      console.error("Error al cargar empleados:", error.message);
      setFetchError('No se pudieron cargar los empleados. Intenta de nuevo más tarde.');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateNewEmployee = () => {
    setEmployeeName('');
    setEmployeeLastName('');
    setEmployeeEmail('');
    setEmployeePassword('');
    setEmployeePhone('');
    setEmployeeGender('');
    setEmployeeBirthDate('');
    setFormError('');
    setShowCreateForm(true);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleSaveEmployee = async () => {
    setFormError('');

    if (!employeeName || !employeeLastName || !employeeEmail || !employeePassword || !employeePhone || !employeeGender || !employeeBirthDate) {
      setFormError('Por favor, completa todos los campos.');
      return;
    }

    if (employeePassword.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsCreating(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, employeeEmail, employeePassword);
      const user = userCredential.user;

      console.log("Empleado registrado en Firebase Auth:", user.email, "UID:", user.uid);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "employee",
        createdAt: new Date().toISOString(),
      });

      console.log("Documento de usuario 'employee' creado en Firestore para UID:", user.uid);

      const employeePersonalData = {
        firebaseUid: user.uid,
        nombre: employeeName,
        apellido: employeeLastName,
        fecha_nacimiento: new Date(employeeBirthDate).toISOString(),
        genero: employeeGender,
        telefono: employeePhone,
        activo: true,
      };

      const response = await fetch(`${API_URL}/Personal`, { // <-- Usa API_URL aquí
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeePersonalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.message || errorData.title || 'Error desconocido al guardar datos personales.';
        if (errorData.errors && Object.keys(errorData.errors).length > 0) {
            errorMessage += "\n" + Object.values(errorData.errors).flat().join("\n");
        }
        throw new Error(errorMessage);
      }

      console.log("Datos personales de empleado guardados en SQL a través del backend.");

      Alert.alert("Éxito", "Empleado registrado y datos personales guardados correctamente.");
      setShowCreateForm(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error al registrar empleado:", error.message);
      let errorMessage = "Ocurrió un error inesperado al registrar el empleado.";

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'El correo electrónico ya está registrado.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo electrónico no es válido.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es demasiado débil (debe tener al menos 6 caracteres).';
            break;
          default:
            errorMessage = `Error de autenticación: ${error.message}`;
        }
      } else {
        errorMessage = error.message;
      }
      setFormError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          {!showCreateForm && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateNewEmployee}
            >
              <Ionicons name="person-add" size={20} color={styles.createButtonText.color} />
              <Text style={styles.createButtonText}>CREAR EMPLEADO</Text>
            </TouchableOpacity>
          )}
        </View>

        {showCreateForm ? (
          <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.formTitle}>Registrar Nuevo Empleado</Text>
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={employeeName}
              onChangeText={setEmployeeName}
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              value={employeeLastName}
              onChangeText={setEmployeeLastName}
            />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={employeeEmail}
              onChangeText={setEmployeeEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña (mín. 6 caracteres)"
              value={employeePassword}
              onChangeText={setEmployeePassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              value={employeePhone}
              onChangeText={setEmployeePhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Género (Ej: Masculino, Femenino)"
              value={employeeGender}
              onChangeText={setEmployeeGender}
            />
            <TextInput
              style={styles.input}
              placeholder="Fecha de Nacimiento (YYYY-MM-DD)"
              value={employeeBirthDate}
              onChangeText={setEmployeeBirthDate}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveEmployee}
              disabled={isCreating}
            >
              <Text style={styles.saveButtonText}>
                {isCreating ? 'Registrando...' : 'GUARDAR EMPLEADO'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelCreate}
              disabled={isCreating}
            >
              <Text style={styles.cancelButtonText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView style={styles.scrollView}>
            {isLoadingEmployees ? (
              <ActivityIndicator size="large" color="#10B981" style={styles.loadingIndicator} />
            ) : fetchError ? (
              <Text style={styles.errorText}>{fetchError}</Text>
            ) : employees.length === 0 ? (
              <Text style={styles.noEmployeesText}>No hay empleados registrados.</Text>
            ) : (
              <View style={styles.tableContainer}>
                {/* Encabezados de la tabla */}
                <View style={styles.tableRowHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>ID</Text>
                  <Text style={styles.tableHeaderCell}>Nombre</Text>
                  <Text style={styles.tableHeaderCell}>Apellido</Text>
                  <Text style={styles.tableHeaderCell}>Nacimiento</Text>
                  <Text style={styles.tableHeaderCell}>Género</Text>
                  <Text style={styles.tableHeaderCell}>Teléfono</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>Activo</Text>
                </View>

                {/* Filas de la tabla con datos de la BD */}
                {employees.map((employee, index) => (
                  <View
                    key={employee.id_personal}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{employee.id_personal}</Text>
                    <Text style={styles.tableCell}>{employee.nombre}</Text>
                    <Text style={styles.tableCell}>{employee.apellido}</Text>
                    <Text style={styles.tableCell}>
                      {new Date(employee.fecha_nacimiento).toLocaleDateString()}
                    </Text>
                    <Text style={styles.tableCell}>{employee.genero}</Text>
                    <Text style={styles.tableCell}>{employee.telefono}</Text>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{employee.activo ? 'Sí' : 'No'}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: 'transparent',
    elevation: 0,
  },
  createButtonText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    shadowColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: 'transparent',
    elevation: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#CCCCCC',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: 'transparent',
    elevation: 0,
  },
  cancelButtonText: {
    color: '#555555',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#FFFFFF',
  },
  tableRowOdd: {
    backgroundColor: '#FBFBFB',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  noEmployeesText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },
});