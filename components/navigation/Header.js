import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Config from '../../config/config.js';

const Header = ({ title, onMenuPress, navigation }) => {
  const { width } = useWindowDimensions();
  const showMenuButton = Platform.OS !== 'web' || width < 1024;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const [newNotificationsCount, setNewNotificationsCount] = useState(0);
  const [viewedNotifications, setViewedNotifications] = useState(new Set());
  const [notificationIds, setNotificationIds] = useState(new Set());

  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [hoveredSettingsItem, setHoveredSettingsItem] = useState(null);

  const [hoveredNotificationId, setHoveredNotificationId] = useState(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const badgeAnimation = useRef(new Animated.Value(0)).current;
  const settingsDropdownAnimation = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 3000);
  };

  const fetchNotifications = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      // ---  Marcadores de posición: Reemplaza estos valores con la información real de tu sesión.
      const currentUserId = 1; // Por ejemplo, el ID del empleado o administrador logueado
      const currentUserRole = 'administrador'; // Puede ser 'empleado' o 'administrador'
      // --------------------------------------------------------------------------------------

      const [alertaResponse, notaResponse] = await Promise.all([
        fetch(`${Config.API_BASE_URL}/Alerta`, {
          headers: { 'accept': '*/*' }
        }),
        fetch(`${Config.API_BASE_URL}/Nota`, {
          headers: { 'accept': '*/*' }
        })
      ]);

      if (!alertaResponse.ok || !notaResponse.ok) {
        throw new Error('Error al cargar notificaciones desde la API.');
      }
      
      const alertasData = await alertaResponse.json();
      const notasData = await notaResponse.json();
      
      const alertas = alertasData.alertas || alertasData;
      const notas = notasData.notas || notasData;

      // Obtener IDs de familiares únicos para buscar sus nombres
      const uniqueFamiliarIds = new Set(notas.filter(n => n.id_familiar && n.id_personal !== 0).map(n => n.id_familiar));
      const familiarNames = {};

      if (uniqueFamiliarIds.size > 0) {
        const familiarPromises = [...uniqueFamiliarIds].map(id => 
          fetch(`${Config.API_BASE_URL}/Familiar/${id}`).then(res => res.json())
        );
        const familiarResults = await Promise.all(familiarPromises);
        familiarResults.forEach(result => {
          if (result && result.familiar) {
            familiarNames[result.familiar.id] = `${result.familiar.nombre} ${result.familiar.apellido}`;
          }
        });
      }

      const combinedNotifications = [
        ...(Array.isArray(alertas) ? alertas.map(a => ({
          tipo: 'alerta',
          idReferencia: a.id,
          residenteNombre: a.residente?.nombre || 'Residente Desconocido',
          residenteApellido: a.residente?.apellido || '',
          descripcion: a.alerta_tipo?.descripcion || 'Descripción no disponible',
          tipoDetalleAlerta: a.alerta_tipo?.nombre || 'Tipo de Alerta Desconocido',
          fecha: a.fecha,
        })) : []),
        ...(Array.isArray(notas) ? notas.filter(n => {
          // --- LÓGICA DE FILTRADO ACTUALIZADA
          // Si el rol es 'administrador' y la nota tiene id_personal = 0, se filtra (no se muestra).
          if (currentUserRole === 'administrador' && n.id_personal === 0) {
            return false;
          }
          // En cualquier otro caso, se muestra la nota.
          return true;
        }).map(n => {
          const senderName = n.id_personal === 0 
            ? 'Administrador' 
            : familiarNames[n.id_familiar] || `Familiar ID: ${n.id_familiar}`;
            
          return {
            tipo: 'mensaje', // CAMBIO: de 'nota' a 'mensaje'
            idReferencia: n.id,
            residenteNombre: senderName,
            residenteApellido: '',
            descripcion: n.nota,
            tipoDetalleAlerta: null,
            fecha: n.fecha,
          }
        }) : [])
      ];

      combinedNotifications.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const recentNotifications = combinedNotifications.slice(0, 10);

      const currentIds = new Set(recentNotifications.map(n => `${n.tipo}-${n.idReferencia}`));

      if (!isInitialLoad && notificationIds.size > 0) {
        const newIds = [...currentIds].filter(id => !notificationIds.has(id));
        if (newIds.length > 0) {
          setNewNotificationsCount(prev => prev + newIds.length);
          animateBadge();
          showToast('¡Tienes nuevas notificaciones!');
        }
      }

      setNotifications(recentNotifications);
      setNotificationIds(currentIds);

      if (isInitialLoad) {
        setViewedNotifications(allViewed => new Set([...allViewed, ...currentIds]));
      }

    } catch (error) {
      console.error(error);
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);

    intervalRef.current = setInterval(() => {
      fetchNotifications(false);
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const animateBadge = () => {
    badgeAnimation.setValue(0);
    Animated.sequence([
      Animated.spring(badgeAnimation, {
        toValue: 1,
        tension: 150,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimation, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(badgeAnimation, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleDropdown = () => {
    if (showSettingsDropdown) {
      toggleSettingsDropdown();
    }

    if (showDropdown) {
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowDropdown(false));
    } else {
      setShowDropdown(true);
      setNewNotificationsCount(0);
      const allViewed = new Set(
        notifications.map(n => `${n.tipo}-${n.idReferencia}`)
      );
      setViewedNotifications(prev => new Set([...prev, ...allViewed]));
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const toggleSettingsDropdown = () => {
    if (showDropdown) {
      toggleDropdown();
    }
    if (showSettingsDropdown) {
      Animated.timing(settingsDropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setShowSettingsDropdown(false);
      });
    } else {
      setShowSettingsDropdown(true);
      Animated.timing(settingsDropdownAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };
  

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Ahora';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d`;
    }
  };

  const getNotificationIcon = (tipo, tipoDetalleAlerta) => {
    if (tipo === 'mensaje') { // CAMBIO: de 'nota' a 'mensaje'
      return { name: 'chatbubble', color: '#4A90E2' };
    } else if (tipo === 'alerta') {
      return tipoDetalleAlerta === 'Bradicardia'
        ? { name: 'warning', color: '#E74C3C' }
        : { name: 'alert-circle', color: '#F39C12' };
    }
    return { name: 'information-circle', color: '#95A5A6' };
  };

  const NotificationItem = ({ notification }) => {
    const icon = getNotificationIcon(notification.tipo, notification.tipoDetalleAlerta);
    const notificationId = `${notification.tipo}-${notification.idReferencia}`;
    const isViewed = viewedNotifications.has(notificationId);
    const isHovered = hoveredNotificationId === notificationId;

    return (
      <Pressable
        onPress={() => {
          setViewedNotifications(prev => new Set([...prev, notificationId]));
        }}
        onPressIn={() => setHoveredNotificationId(notificationId)}
        onPressOut={() => setHoveredNotificationId(null)}
        onHoverIn={Platform.OS === 'web' ? () => setHoveredNotificationId(notificationId) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHoveredNotificationId(null) : undefined}
        style={[
          styles.notificationItem,
          !isViewed && styles.unreadNotification,
          isHovered && styles.dropdownItemHover,
        ]}
      >
        <View style={styles.notificationIconContainer}>
          <Ionicons name={icon.name} size={16} color={icon.color} />
          {!isViewed && <View style={styles.newIndicator} />}
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {notification.residenteNombre} {notification.residenteApellido}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDate(notification.fecha)}
            </Text>
          </View>

          <Text style={styles.notificationDescription} numberOfLines={2}>
            {notification.descripcion}
          </Text>

          <View style={styles.notificationFooter}>
            <Text style={styles.notificationType}>
              {notification.tipo === 'mensaje' ? 'Mensaje' : 'Alerta'}
              {notification.tipoDetalleAlerta && ` • ${notification.tipoDetalleAlerta}`}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const dropdownHeight = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const settingsDropdownHeight = settingsDropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  const SettingsDropdownItem = ({ iconName, text, onPress, itemKey }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={() => {
          onPress();
        }}
        onHoverIn={Platform.OS === 'web' ? () => setIsHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setIsHovered(false) : undefined}
      >
        <View style={[styles.dropdownItem, isHovered && styles.dropdownItemHover]}>
          <Ionicons name={iconName} size={18} color="#666" style={styles.dropdownItemIcon} />
          <Text style={styles.dropdownItemText}>{text}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {toastVisible && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <View style={styles.leftContainer}>
            {showMenuButton && (
              <Pressable onPress={onMenuPress} style={styles.menuButton}>
                <Ionicons name="menu" size={28} color="#333" />
              </Pressable>
            )}
            <Text style={styles.screenTitle}>{title}</Text>
          </View>

          <View style={styles.rightIconsContainer}>
            <View style={styles.notificationWrapper}>
              <Pressable
                onPress={toggleDropdown}
                style={styles.notificationButton}
              >
                <Ionicons name="notifications-outline" size={24} color="#666" />
                {newNotificationsCount > 0 && (
                  <Animated.View
                    style={[
                      styles.notificationBadge,
                      {
                        transform: [{ scale: badgeAnimation }],
                      }
                    ]}
                  >
                    <Text style={styles.notificationCount}>
                      {newNotificationsCount > 99 ? '99+' : newNotificationsCount}
                    </Text>
                  </Animated.View>
                )}
              </Pressable>

              {showDropdown && (
                <Animated.View
                  style={[
                    styles.dropdown,
                    { height: dropdownHeight }
                  ]}
                >
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>Notificaciones</Text>
                    <Pressable onPress={() => fetchNotifications(false)}>
                      <Ionicons name="refresh" size={18} color="#666" />
                    </Pressable>
                  </View>

                  <View style={styles.dropdownContent}>
                    {loading && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#6BB240" />
                        <Text style={styles.loadingText}>Actualizando...</Text>
                      </View>
                    )}

                    {error && (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Pressable onPress={() => fetchNotifications(false)} style={styles.retryButton}>
                          <Text style={styles.retryButtonText}>Reintentar</Text>
                        </Pressable>
                      </View>
                    )}

                    {!loading && !error && (
                      <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <NotificationItem
                              key={`${notification.tipo}-${notification.idReferencia}`}
                              notification={notification}
                            />
                          ))
                        ) : (
                          <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={32} color="#BDC3C7" />
                            <Text style={styles.emptyText}>No hay notificaciones</Text>
                          </View>
                        )}
                      </ScrollView>
                    )}
                  </View>
                </Animated.View>
              )}
            </View>

            <View style={styles.settingsWrapper}>
              <Pressable onPress={toggleSettingsDropdown} style={styles.settingsButton}>
                <Ionicons name="settings-outline" size={24} color="#666" />
              </Pressable>

              {showSettingsDropdown && (
                <Animated.View
                  style={[
                    styles.dropdown,
                    styles.settingsDropdown,
                    { height: settingsDropdownHeight }
                  ]}
                >
                  <SettingsDropdownItem
                    iconName="person-circle-outline"
                    text="Mi cuenta"
                    onPress={() => {
                      if (navigation) {
                        navigation.navigate('MyAccountScreen');
                      } else {
                        console.warn('Objeto de navegación no disponible. Asegúrate de pasar la prop navigation al Header.');
                      }
                      toggleSettingsDropdown();
                    }}
                    itemKey="miCuenta"
                  />
                </Animated.View>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  headerContainer: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 2,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationWrapper: {
    position: 'relative',
    marginRight: 20,
  },
  notificationButton: {
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingsWrapper: {
    position: 'relative',
  },
  settingsButton: {
    padding: 4,
  },

  dropdown: {
    position: 'absolute',
    top: 35,
    right: 0,
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  settingsDropdown: {
    width: 200,
    right: 0,
    top: 35,
    paddingVertical: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dropdownContent: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#6BB240',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  notificationsList: {
    maxHeight: 350,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 8,
    color: '#95A5A6',
    fontSize: 14,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
  },
  notificationIconContainer: {
    marginRight: 10,
    marginTop: 2,
    position: 'relative',
  },
  newIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#95A5A6',
    marginLeft: 8,
  },
  notificationDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationType: {
    fontSize: 11,
    color: '#95A5A6',
    fontWeight: '500',
  },
  toastContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
  },
  toastText: {
    color: '#fff',
    fontSize: 15,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  dropdownItemHover: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 3,
    borderLeftColor: '#6BB240',
    paddingLeft: 12,
  },
  dropdownItemIcon: {
    marginRight: 10,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },
});

export default Header;