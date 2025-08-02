"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useIsFocused } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Config from "../../config/config"
import EmployeeCreationForm from "./EmployeeCreationScreen"
import EmployeeEditScreen from "./EmployeeEditScreen"

const PRIMARY_GREEN = "#6BB240"
const LIGHT_GREEN = "#9CD275"
const ACCENT_GREEN_BACKGROUND = "#EEF7E8"
const DARK_GRAY = "#333"
const MEDIUM_GRAY = "#555"
const LIGHT_GRAY = "#888"
const VERY_LIGHT_GRAY = "#eee"
const BACKGROUND_LIGHT = "#fcfcfc"
const WHITE = "#fff"
const ERROR_RED = "#DC3545"
const BUTTON_HOVER_COLOR = "#5aa130"

const { width, height } = Dimensions.get("window")
const IS_LARGE_SCREEN = width > 900
const IS_MOBILE = Platform.OS !== "web"

export default function EmployeeManagementScreen() {
  const navigation = useNavigation()
  const isFocused = useIsFocused()
  const insets = useSafeAreaInsets()

  const [employees, setEmployees] = useState([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("Activos")
  const [currentPage, setCurrentPage] = useState(1)
  // Cambiado a 5 registros por página en móvil
  const [employeesPerPage] = useState(IS_MOBILE ? 5 : 8)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [employeeToEdit, setEmployeeToEdit] = useState(null)

  const API_URL = Config.API_BASE_URL

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true)
    setFetchError("")
    try {
      const response = await fetch(`${API_URL}/Personal`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al cargar empleados del backend.")
      }
      const data = await response.json()
      if (data && data.personal) {
        setEmployees(data.personal)
      } else {
        setEmployees(data)
      }
      console.log("Empleados cargados:", data)
    } catch (error) {
      console.error("Error al cargar empleados:", error.message)
      setFetchError("No se pudieron cargar los empleados. Intenta de nuevo más tarde.")
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  useEffect(() => {
    if (isFocused && !showCreateForm && !showEditForm) {
      fetchEmployees()
    }
  }, [isFocused, showCreateForm, showEditForm])

  const handleCreateNewEmployee = () => {
    setShowCreateForm(true)
    setShowEditForm(false)
    setEmployeeToEdit(null)
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    fetchEmployees()
  }

  const handleEmployeeCreated = () => {
    setShowCreateForm(false)
    fetchEmployees()
  }

  const handleEditEmployee = (employee) => {
    setEmployeeToEdit(employee)
    setShowEditForm(true)
    setShowCreateForm(false)
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEmployeeToEdit(null)
    fetchEmployees()
  }

  const handleEmployeeEdited = () => {
    setShowEditForm(false)
    setEmployeeToEdit(null)
    fetchEmployees()
  }

  const filteredEmployees = employees.filter((employee) => {
    if (employee.id === 0) {
      return false
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    const matchesSearchTerm =
      employee.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
      employee.apellido.toLowerCase().includes(lowerCaseSearchTerm)
    let matchesFilterStatus = true
    if (filterStatus === "Activos") {
      matchesFilterStatus = employee.activo === true
    } else if (filterStatus === "Inactivos") {
      matchesFilterStatus = employee.activo === false
    }
    return matchesSearchTerm && matchesFilterStatus
  })

  const indexOfLastEmployee = currentPage * employeesPerPage
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee)
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const renderPaginationButtons = () => {
    if (IS_MOBILE) {
      const maxVisiblePages = 3
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }

      const pages = []
      
      if (startPage > 1) {
        pages.push(
          <TouchableOpacity
            key={1}
            style={[styles.paginationPageButton, styles.paginationPageButtonMobile]}
            onPress={() => paginate(1)}
          >
            <Text style={[styles.paginationPageText, styles.paginationPageTextMobile]}>1</Text>
          </TouchableOpacity>
        )
        if (startPage > 2) {
          pages.push(
            <Text key="dots1" style={[styles.paginationDots, styles.paginationDotsMobile]}>...</Text>
          )
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <TouchableOpacity
            key={i}
            style={[
              styles.paginationPageButton,
              styles.paginationPageButtonMobile,
              currentPage === i && styles.paginationPageButtonActive,
            ]}
            onPress={() => paginate(i)}
          >
            <Text
              style={[
                styles.paginationPageText,
                styles.paginationPageTextMobile,
                currentPage === i && styles.paginationPageTextActive,
              ]}
            >
              {i}
            </Text>
          </TouchableOpacity>
        )
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push(
            <Text key="dots2" style={[styles.paginationDots, styles.paginationDotsMobile]}>...</Text>
          )
        }
        pages.push(
          <TouchableOpacity
            key={totalPages}
            style={[styles.paginationPageButton, styles.paginationPageButtonMobile]}
            onPress={() => paginate(totalPages)}
          >
            <Text style={[styles.paginationPageText, styles.paginationPageTextMobile]}>{totalPages}</Text>
          </TouchableOpacity>
        )
      }

      return pages
    } else {
      return [...Array(totalPages).keys()].map((number) => (
        <TouchableOpacity
          key={number}
          style={[
            styles.paginationPageButton,
            currentPage === number + 1 && styles.paginationPageButtonActive,
          ]}
          onPress={() => paginate(number + 1)}
        >
          <Text
            style={[
              styles.paginationPageText,
              currentPage === number + 1 && styles.paginationPageTextActive,
            ]}
          >
            {number + 1}
          </Text>
        </TouchableOpacity>
      ))
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {(showCreateForm || showEditForm) && (
          <TouchableOpacity
            onPress={showCreateForm ? handleCancelCreate : handleCancelEdit}
            style={[
              styles.backButton,
              IS_MOBILE && styles.backButtonMobile,
              { top: insets.top + (IS_MOBILE ? 30 : 20) }
            ]}
          >
            <Ionicons name="arrow-back-outline" size={IS_MOBILE ? 18 : 20} color={WHITE} />
            <Text style={[styles.backButtonText, IS_MOBILE && styles.backButtonTextMobile]}>
              Regresar
            </Text>
          </TouchableOpacity>
        )}

        {showCreateForm ? (
          <EmployeeCreationForm onEmployeeCreated={handleEmployeeCreated} onCancel={handleCancelCreate} />
        ) : showEditForm && employeeToEdit ? (
          <EmployeeEditScreen
            route={{ params: { employeeData: employeeToEdit } }}
            onEmployeeEdited={handleEmployeeEdited}
            onCancel={handleCancelEdit}
          />
        ) : (
          <View style={[
            styles.mainContentArea,
            IS_MOBILE && styles.mainContentAreaMobile // Aplicar estilos móviles al contenedor principal
          ]}>
            {IS_MOBILE ? ( // Nueva estructura para móvil con ScrollView para centrado vertical
              <ScrollView contentContainerStyle={styles.mainContentScrollViewMobile}>
                <View style={[
                  styles.controlsContainer, 
                  styles.controlsContainerMobile,
                  { width: '100%', marginTop: 70 } // Empujar el contenido hacia abajo
                ]}>
                  <View style={[styles.searchFilterGroup, styles.searchFilterGroupMobile]}>
                    <View style={[styles.searchInputContainer, styles.searchInputContainerMobile]}>
                      <Ionicons 
                        name="search" 
                        size={18} 
                        color={MEDIUM_GRAY} 
                        style={styles.inputIconMobile} 
                      />
                      <TextInput
                        style={styles.searchInputMobile}
                        placeholder="Buscar empleado..."
                        placeholderTextColor={LIGHT_GRAY}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                      />
                    </View>
                    
                    <View style={[styles.filterButtonsContainer, styles.filterButtonsContainerMobile]}>
                      {["Todos", "Activos", "Inactivos"].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.filterButton,
                            filterStatus === status && styles.filterButtonActive,
                            styles.filterButtonMobile,
                          ]}
                          onPress={() => setFilterStatus(status)}
                        >
                          <Text
                            style={[
                              styles.filterButtonText,
                              filterStatus === status && styles.filterButtonTextActive,
                              styles.filterButtonTextMobile,
                            ]}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.createButton, styles.createButtonMobile]}
                    onPress={handleCreateNewEmployee}
                  >
                    <Ionicons 
                      name="person-add" 
                      size={16}
                      color={WHITE} 
                    />
                    <Text style={styles.createButtonTextMobile}>
                      CREAR
                    </Text>
                  </TouchableOpacity>
                </View>

                {isLoadingEmployees ? (
                  <ActivityIndicator 
                    size="large" 
                    color={PRIMARY_GREEN} 
                    style={styles.loadingIndicatorMobile} 
                  />
                ) : fetchError ? (
                  <Text style={styles.errorTextMobile}>
                    {fetchError}
                  </Text>
                ) : employees.length === 0 && searchTerm === "" && filterStatus === "Activos" ? (
                  <Text style={styles.noEmployeesTextMobile}>
                    No hay empleados registrados.
                  </Text>
                ) : (
                  <>
                    <View style={[styles.tableContainer, styles.tableContainerMobile]}>
                      <ScrollView
                        horizontal={true}
                        contentContainerStyle={styles.tableScrollViewContentMobile}
                        showsHorizontalScrollIndicator={true}
                        bounces={false}
                      >
                        <View style={[styles.table, styles.tableMobile]}>
                          <View style={[styles.tableRowHeader, styles.tableRowHeaderMobile]}>
                            <Text style={[styles.tableHeaderCell, styles.idCell, styles.tableHeaderCellMobile]}>
                              ID
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellMobile]}>
                              Nombre
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellMobile]}>
                              Apellido
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellMobile]}>
                              Nacimiento
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellMobile]}>
                              Género
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellMobile]}>
                              Teléfono
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.activeCell, styles.tableHeaderCellMobile]}>
                              Activo
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.actionsCell, styles.tableHeaderCellMobile]}>
                              Editar
                            </Text>
                          </View>
                          
                          <ScrollView style={styles.tableBodyScrollViewMobile}>
                            {currentEmployees.length === 0 ? (
                              <Text style={styles.noResultsTextMobile}>
                                No se encontraron resultados.
                              </Text>
                            ) : (
                              currentEmployees.map((employee, index) => (
                                <View
                                  key={employee.id}
                                  style={[
                                    styles.tableRow,
                                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                                    styles.tableRowMobile,
                                  ]}
                                >
                                  <Text style={[styles.tableCell, styles.idCell, styles.tableCellMobile]}>
                                    {employee.id}
                                  </Text>
                                  <Text style={[styles.tableCell, styles.tableCellMobile]}>
                                    {employee.nombre}
                                  </Text>
                                  <Text style={[styles.tableCell, styles.tableCellMobile]}>
                                    {employee.apellido}
                                  </Text>
                                  <Text style={[styles.tableCell, styles.tableCellMobile]}>
                                    {new Date(employee.fecha_nacimiento).toLocaleDateString()}
                                  </Text>
                                  <Text style={[styles.tableCell, styles.tableCellMobile]}>
                                    {employee.genero}
                                  </Text>
                                  <Text style={[styles.tableCell, styles.tableCellMobile]}>
                                    {employee.telefono}
                                  </Text>
                                  <Text style={[styles.tableCell, styles.activeCell, styles.tableCellMobile]}>
                                    {employee.activo ? "Sí" : "No"}
                                  </Text>
                                  <View style={[styles.tableCell, styles.actionsCell]}>
                                    <TouchableOpacity
                                      style={styles.actionButtonMobile}
                                      onPress={() => handleEditEmployee(employee)}
                                    >
                                      <Ionicons 
                                        name="create-outline" 
                                        size={18}
                                        color={PRIMARY_GREEN} 
                                      />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ))
                            )}
                          </ScrollView>
                        </View>
                      </ScrollView>
                    </View>

                    {totalPages > 1 && (
                      <View style={[styles.paginationContainer, styles.paginationContainerMobile]}>
                        <TouchableOpacity
                          style={[styles.paginationButton, styles.paginationButtonMobile]}
                          onPress={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <Ionicons
                            name="chevron-back-outline"
                            size={18}
                            color={currentPage === 1 ? LIGHT_GRAY : DARK_GRAY}
                          />
                        </TouchableOpacity>

                        {renderPaginationButtons()}

                        <TouchableOpacity
                          style={[styles.paginationButton, styles.paginationButtonMobile]}
                          onPress={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <Ionicons
                            name="chevron-forward-outline"
                            size={18}
                            color={currentPage === totalPages ? LIGHT_GRAY : DARK_GRAY}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            ) : ( // Estructura original para web/pantallas grandes
              <>
                <View style={styles.controlsContainer}>
                  <View style={styles.searchFilterGroup}>
                    <View style={styles.searchInputContainer}>
                      <Ionicons 
                        name="search" 
                        size={20} 
                        color={MEDIUM_GRAY} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar empleado..."
                        placeholderTextColor={LIGHT_GRAY}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                      />
                    </View>
                    
                    <View style={styles.filterButtonsContainer}>
                      {["Todos", "Activos", "Inactivos"].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.filterButton,
                            filterStatus === status && styles.filterButtonActive,
                          ]}
                          onPress={() => setFilterStatus(status)}
                        >
                          <Text
                            style={[
                              styles.filterButtonText,
                              filterStatus === status && styles.filterButtonTextActive,
                            ]}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateNewEmployee}
                  >
                    <Ionicons 
                      name="person-add" 
                      size={20}
                      color={WHITE} 
                    />
                    <Text style={styles.createButtonText}>
                      CREAR
                    </Text>
                  </TouchableOpacity>
                </View>

                {isLoadingEmployees ? (
                  <ActivityIndicator 
                    size="large" 
                    color={PRIMARY_GREEN} 
                    style={styles.loadingIndicator} 
                  />
                ) : fetchError ? (
                  <Text style={styles.errorText}>
                    {fetchError}
                  </Text>
                ) : employees.length === 0 && searchTerm === "" && filterStatus === "Activos" ? (
                  <Text style={styles.noEmployeesText}>
                    No hay empleados registrados.
                  </Text>
                ) : (
                  <>
                    <View style={styles.tableContainer}>
                      <ScrollView
                        horizontal={false} // No horizontal scroll for web table
                        contentContainerStyle={styles.tableScrollViewContent}
                        showsHorizontalScrollIndicator={false}
                        bounces={false}
                      >
                        <View style={styles.table}>
                          <View style={styles.tableRowHeader}>
                            <Text style={[styles.tableHeaderCell, styles.idCell]}>
                              ID
                            </Text>
                            <Text style={styles.tableHeaderCell}>
                              Nombre
                            </Text>
                            <Text style={styles.tableHeaderCell}>
                              Apellido
                            </Text>
                            <Text style={styles.tableHeaderCell}>
                              Nacimiento
                            </Text>
                            <Text style={styles.tableHeaderCell}>
                              Género
                            </Text>
                            <Text style={styles.tableHeaderCell}>
                              Teléfono
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.activeCell]}>
                              Activo
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.actionsCell]}>
                              Editar
                            </Text>
                          </View>
                          
                          <ScrollView style={styles.tableBodyScrollView}>
                            {currentEmployees.length === 0 ? (
                              <Text style={styles.noResultsText}>
                                No se encontraron resultados.
                              </Text>
                            ) : (
                              currentEmployees.map((employee, index) => (
                                <View
                                  key={employee.id}
                                  style={[
                                    styles.tableRow,
                                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                                  ]}
                                >
                                  <Text style={[styles.tableCell, styles.idCell]}>
                                    {employee.id}
                                  </Text>
                                  <Text style={styles.tableCell}>
                                    {employee.nombre}
                                  </Text>
                                  <Text style={styles.tableCell}>
                                    {employee.apellido}
                                  </Text>
                                  <Text style={styles.tableCell}>
                                    {new Date(employee.fecha_nacimiento).toLocaleDateString()}
                                  </Text>
                                  <Text style={styles.tableCell}>
                                    {employee.genero}
                                  </Text>
                                  <Text style={styles.tableCell}>
                                    {employee.telefono}
                                  </Text>
                                  <Text style={[styles.tableCell, styles.activeCell]}>
                                    {employee.activo ? "Sí" : "No"}
                                  </Text>
                                  <View style={[styles.tableCell, styles.actionsCell]}>
                                    <TouchableOpacity
                                      style={styles.actionButton}
                                      onPress={() => handleEditEmployee(employee)}
                                    >
                                      <Ionicons 
                                        name="create-outline" 
                                        size={20}
                                        color={PRIMARY_GREEN} 
                                      />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ))
                            )}
                          </ScrollView>
                        </View>
                      </ScrollView>
                    </View>

                    {totalPages > 1 && (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity
                          style={styles.paginationButton}
                          onPress={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <Ionicons
                            name="chevron-back-outline"
                            size={20}
                            color={currentPage === 1 ? LIGHT_GRAY : DARK_GRAY}
                          />
                        </TouchableOpacity>

                        {renderPaginationButtons()}

                        <TouchableOpacity
                          style={styles.paginationButton}
                          onPress={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <Ionicons
                            name="chevron-forward-outline"
                            size={20}
                            color={currentPage === totalPages ? LIGHT_GRAY : DARK_GRAY}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const containerBaseStyles = {
  backgroundColor: WHITE,
  borderRadius: 15,
  padding: IS_LARGE_SCREEN ? 22 : 18,
  shadowColor: DARK_GRAY,
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 8,
  borderWidth: 1.5,
  borderColor: VERY_LIGHT_GRAY,
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
    position: "relative",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: PRIMARY_GREEN,
    zIndex: 10,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    left: 20,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transitionDuration: "0.2s",
        transitionProperty: "background-color, border-color, color",
        ":hover": {
          backgroundColor: BUTTON_HOVER_COLOR,
          borderColor: BUTTON_HOVER_COLOR,
        },
      },
    }),
  },
  backButtonMobile: {
    left: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  backButtonTextMobile: {
    fontSize: 14,
    marginLeft: 8,
  },
  mainContentArea: {
    flex: 1,
    paddingHorizontal: IS_LARGE_SCREEN ? 20 : 0, // padding only for large screens, mobile uses ScrollView's padding
    alignItems: "center", // Horizontal centering for children
    paddingTop: IS_LARGE_SCREEN ? 20 : 10, // paddingTop only for large screens/web
  },
  mainContentAreaMobile: {
    paddingHorizontal: 0, // Mobile ScrollView will handle horizontal padding if needed
    paddingTop: 0, // No specific padding top here for mobile, marginTop on controlsContainer handles it
    justifyContent: 'flex-start', // Let ScrollView handle vertical centering
  },
  mainContentScrollViewMobile: {
    flexGrow: 1, // Permite que el contenido crezca para llenar el espacio
    justifyContent: "center", // Centra el contenido verticalmente si cabe
    paddingHorizontal: 8, // Padding horizontal para el contenido dentro del ScrollView
    paddingBottom: 20, // Padding adicional en la parte inferior para el scroll
  },
  controlsContainer: {
    width: "100%", // Explicitly set width to 100% for controlsContainer
    maxWidth: IS_LARGE_SCREEN ? 1000 : "auto",
    flexDirection: IS_LARGE_SCREEN ? "row" : "column",
    justifyContent: "space-between",
    alignItems: IS_LARGE_SCREEN ? "center" : "stretch",
    marginBottom: 20,
    gap: IS_LARGE_SCREEN ? 0 : 15,
  },
  controlsContainerMobile: {
    gap: 12,
    marginBottom: 15,
    marginTop: 50, // Pushes controls down significantly for mobile
  },
  createButton: {
    flexDirection: "row",
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transitionDuration: "0.3s",
        transitionProperty: "background-color",
        ":hover": {
          backgroundColor: BUTTON_HOVER_COLOR,
        },
      },
    }),
  },
  createButtonMobile: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  createButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },
  createButtonTextMobile: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "700",
  },
  searchFilterGroup: {
    flex: 1,
    flexDirection: IS_MOBILE ? "column" : "row",
    alignItems: IS_MOBILE ? "stretch" : "center",
    justifyContent: "flex-start",
    gap: IS_MOBILE ? 15 : 10,
    flexWrap: "wrap",
  },
  searchFilterGroupMobile: {
    gap: 10,
  },
  searchInputContainer: {
    flex: IS_LARGE_SCREEN ? 0.6 : 1,
    flexDirection: "row",
    alignItems: "center",
    height: 45, // Consistent height
    borderColor: LIGHT_GRAY,
    borderWidth: 1.5,
    borderRadius: IS_MOBILE ? 12 : 10,
    backgroundColor: WHITE,
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    paddingHorizontal: IS_MOBILE ? 15 : 10,
  },
  searchInputContainerMobile: {
    height: 45, // Ensuring a consistent height
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    width: '100%', // Explicitly force 100% width
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: DARK_GRAY,
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  searchInputMobile: {
    flex: 1, // Ensure it takes available space
    height: "100%", // Ensure it takes full height of container
    fontSize: 14,
    color: DARK_GRAY,
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  inputIcon: {
    marginRight: IS_LARGE_SCREEN ? 10 : 12,
  },
  inputIconMobile: {
    marginRight: 8,
  },
  filterButtonsContainer: {
    flexDirection: "row",
    gap: IS_LARGE_SCREEN ? 8 : 8,
    justifyContent: IS_MOBILE ? "center" : "flex-start",
    flexWrap: "wrap",
  },
  filterButtonsContainerMobile: {
    gap: 6,
    justifyContent: "space-between",
  },
  filterButton: {
    backgroundColor: VERY_LIGHT_GRAY,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transitionDuration: "0.3s",
        transitionProperty: "background-color, border-color, color",
        ":hover": {
          backgroundColor: LIGHT_GREEN,
          borderColor: PRIMARY_GREEN,
          color: WHITE,
        },
      },
    }),
  },
  filterButtonMobile: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  filterButtonText: {
    color: MEDIUM_GRAY,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  filterButtonTextMobile: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: WHITE,
  },
  errorText: {
    color: ERROR_RED,
    textAlign: "center",
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "500",
  },
  errorTextMobile: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontWeight: "500",
  },
  loadingIndicator: {
    marginTop: 50,
  },
  loadingIndicatorMobile: {
    marginTop: 40,
  },
  noEmployeesText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: MEDIUM_GRAY,
  },
  noEmployeesTextMobile: {
    fontSize: 15,
    paddingHorizontal: 20,
    marginTop: 40,
    fontWeight: "500",
  },
  tableContainer: {
    ...containerBaseStyles,
    width: "100%",
    maxWidth: IS_LARGE_SCREEN ? 1000 : "auto",
    alignSelf: "center",
    marginBottom: 20,
    padding: 0,
    overflow: "hidden",
  },
  tableContainerMobile: {
    borderRadius: 10,
    flex: 1,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  tableScrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  tableScrollViewContentMobile: {
    paddingRight: 5,
  },
  table: {
    flex: 1,
    width: IS_LARGE_SCREEN ? "100%" : 900, // Fixed width for mobile table for horizontal scroll
    minWidth: "100%", // Ensures it doesn't shrink below 100% on larger mobile screens if it fits
  },
  tableMobile: {
    width: 750, // Adjusted width for mobile table
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: WHITE,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: VERY_LIGHT_GRAY,
  },
  tableRowHeaderMobile: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 13,
    color: DARK_GRAY,
    textAlign: "center",
    textTransform: "uppercase",
  },
  tableHeaderCellMobile: {
    fontSize: 11,
    fontWeight: "700",
  },
  tableBodyScrollView: {
    flex: 1,
  },
  tableBodyScrollViewMobile: {
    paddingBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: VERY_LIGHT_GRAY,
    alignItems: "center",
  },
  tableRowMobile: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tableRowEven: {
    backgroundColor: WHITE,
  },
  tableRowOdd: {
    backgroundColor: BACKGROUND_LIGHT,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: MEDIUM_GRAY,
    textAlign: "center",
  },
  tableCellMobile: {
    fontSize: 11,
    fontWeight: "500",
  },
  idCell: {
    flex: IS_LARGE_SCREEN ? 0.3 : 0.5,
  },
  activeCell: {
    flex: IS_LARGE_SCREEN ? 0.4 : 0.5,
  },
  actionsCell: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    flex: IS_LARGE_SCREEN ? 0.7 : 1,
  },
  actionButton: {
    padding: 5,
    borderRadius: 5,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transitionDuration: "0.2s",
        transitionProperty: "background-color",
        ":hover": {
          backgroundColor: VERY_LIGHT_GRAY,
        },
      },
    }),
  },
  actionButtonMobile: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: ACCENT_GREEN_BACKGROUND,
  },
  noResultsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: MEDIUM_GRAY,
    padding: 20,
  },
  noResultsTextMobile: {
    fontSize: 14,
    padding: 20,
    fontWeight: "500",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    width: "100%",
    maxWidth: IS_LARGE_SCREEN ? 1000 : "auto",
    flexWrap: "wrap",
  },
  paginationContainerMobile: {
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transitionDuration: "0.2s",
        transitionProperty: "background-color, border-color",
        ":hover": {
          backgroundColor: ACCENT_GREEN_BACKGROUND,
          borderColor: LIGHT_GREEN,
        },
      },
    }),
  },
  paginationButtonMobile: {
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  paginationPageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 3,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transitionDuration: "0.2s",
        transitionProperty: "background-color, border-color, color",
        ":hover": {
          backgroundColor: ACCENT_GREEN_BACKGROUND,
          borderColor: LIGHT_GREEN,
        },
      },
    }),
  },
  paginationPageButtonMobile: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginHorizontal: 1,
    minWidth: 36,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  paginationPageButtonActive: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  paginationPageText: {
    color: MEDIUM_GRAY,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  paginationPageTextMobile: {
    fontSize: 12,
    fontWeight: "600",
  },
  paginationPageTextActive: {
    color: WHITE,
  },
  paginationDots: {
    color: MEDIUM_GRAY,
    fontSize: 16,
    paddingHorizontal: 8,
    alignSelf: "center",
  },
  paginationDotsMobile: {
    fontSize: 14,
    paddingHorizontal: 6,
    fontWeight: "600",
  },
})