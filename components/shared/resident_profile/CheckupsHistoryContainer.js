// AETHERIS/screens/family/CheckupsHistoryContainer.js
"use client"

import { Platform, View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useState } from 'react';


const COLORS = {
  darkText: "#111827",
  lightText: "#6B7280",
  accentBlue: "#3B82F6",
  cardBackground: "#FFFFFF",
  pageBackground: "#F9FAFB",
  borderLight: "#E5E7EB",
  primaryGreen: "#10B981",
}

const IS_WEB = Platform.OS === "web"

const CheckupsHistoryContainer = ({
  weeklyCheckups,
  selectedCheckupId,
  setSelectedCheckupId,
  navigation,
  resident,
}) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const handleMobileDropdownPress = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const handleOptionSelect = (checkupId) => {
    setSelectedCheckupId(checkupId);
    setIsDropdownVisible(false);
  };

  return (
    <View style={styles.checkupsHistoryCard}>
      <View style={styles.modernCardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="calendar" size={18} color={COLORS.primaryGreen} />
          </View>
          <Text style={styles.modernCardTitle}>Historial de Consultas</Text>
        </View>
      </View>

      {weeklyCheckups.length > 0 ? (
        <>
          <View style={styles.checkupDropdownContainer}>
            <Text style={styles.dropdownLabel}>Seleccionar consulta:</Text>
            <View style={styles.modernDropdownWrapper}>
              {IS_WEB ? (
                <select
                  value={selectedCheckupId || ""}
                  onChange={(e) => setSelectedCheckupId(e.target.value)}
                  style={{
                    fontSize: 13,
                    color: COLORS.darkText,
                    backgroundColor: COLORS.pageBackground,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    width: "100%",
                    minHeight: 44,
                    borderWidth: 0,
                    borderRadius: 12,
                  }}
                >
                  <option value="">Seleccionar fecha de consulta</option>
                  {weeklyCheckups.map((checkup) => (
                    <option key={checkup.id} value={checkup.id}>
                      {new Date(checkup.fechaChequeo).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              ) : (
                <TouchableOpacity
                  onPress={handleMobileDropdownPress}
                  style={styles.modernCheckupDropdownTouchable}
                >
                  <Text style={styles.modernCheckupDropdownText}>
                    {selectedCheckupId
                      ? new Date(weeklyCheckups.find((c) => c.id === selectedCheckupId)?.fechaChequeo).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Seleccionar fecha de consulta"}
                  </Text>
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-down" size={16} color={COLORS.lightText} style={styles.dropdownIcon} />
            </View>

            {/* Custom Dropdown List for Mobile */}
            {!IS_WEB && isDropdownVisible && (
              <View style={styles.dropdownListContainer}>
                <ScrollView style={styles.dropdownScrollView}>
                  {weeklyCheckups.map((checkup) => (
                    <TouchableOpacity
                      key={checkup.id}
                      style={styles.dropdownListItem}
                      onPress={() => handleOptionSelect(checkup.id)}
                    >
                      <Text style={styles.dropdownListItemText}>
                        {new Date(checkup.fechaChequeo).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.modernViewButton, { alignSelf: "center", marginTop: 16 }]}
            onPress={() => {
              if (selectedCheckupId) {
                navigation.navigate("WeeklyCheckupDetail", {
                  checkupId: selectedCheckupId,
                  residentName: `${resident.nombre} ${resident.apellido}`,
                })
              }
            }}
            disabled={!selectedCheckupId}
          >
            <Text style={styles.modernViewButtonText}>Ver Consulta</Text>
            <Ionicons name="arrow-forward" size={12} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noCheckupsContainer}>
          <View style={styles.noDataIcon}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.lightText} />
          </View>
          <Text style={styles.noCheckupsText}>No hay chequeos registrados</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  checkupsHistoryCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    height: IS_WEB ? 220 : 240, // Reverted to original height
  },
  modernCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.pageBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  modernCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  checkupDropdownContainer: {
    marginBottom: 16,
    zIndex: 1,
  },
  dropdownLabel: {
    fontSize: 13,
    color: COLORS.darkText,
    marginBottom: 8,
    fontWeight: "600",
  },
  modernDropdownWrapper: {
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    backgroundColor: COLORS.pageBackground,
  },
  modernCheckupDropdownTouchable: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: "100%",
    minHeight: 44,
    justifyContent: 'center',
  },
  modernCheckupDropdownText: {
    fontSize: 13,
    color: COLORS.darkText,
  },
  dropdownIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -8 }],
    pointerEvents: "none",
  },
  dropdownListContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    maxHeight: 150,
    marginTop: 4,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  dropdownScrollView: {
    flexGrow: 1,
  },
  dropdownListItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownListItemText: {
    fontSize: 13,
    color: COLORS.darkText,
  },
  modernViewButton: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modernViewButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  noCheckupsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noDataIcon: {
    marginBottom: 12,
  },
  noCheckupsText: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 8,
    textAlign: "center",
  },
})

export default CheckupsHistoryContainer