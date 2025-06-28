import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationState } from '@react-navigation/native';

const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc';
const HOVER_EFFECT_COLOR = '#e6e6e6';

const menuItems = [
  { id: 'Home', title: 'Inicio', icon: 'home-outline', type: 'item' },
  { id: 'Residents', title: 'Residentes', icon: 'people-outline', type: 'item' },
  { id: 'ConsultasCategory', title: 'Consultas', icon: 'document-text-outline', type: 'category', subItems: [
    { id: 'CreateConsultas', title: 'Crear Consultas', icon: 'add-circle-outline', type: 'subitem' },
    { id: 'ConsultasHistory', title: 'Historial de Consultas', icon: 'time-outline', type: 'subitem' },
  ]},
  { id: 'ReportsCategory', title: 'Reportes', type: 'section-header' },
  { id: 'CheckupReports', title: 'Reportes de Chequeos', icon: 'bar-chart-outline', type: 'item' },
];

// MODIFICACIÓN: SideMenu ahora recibe 'onLogout' como prop
const SideMenu = ({ navigation, onLogout }) => { // ¡Añadido onLogout aquí!
  const [expandedCategory, setExpandedCategory] = useState(null);
  const state = useNavigationState(state => state);
  const currentRouteName = state ? state.routes[state.index].name : 'Home';

  const getIsCategoryActive = (categoryId, subItems) => {
    return subItems.some(subItem => subItem.id === currentRouteName);
  };

  useEffect(() => {
    const parentOfActiveSubItem = menuItems.find(item =>
      item.type === 'category' && item.subItems.some(subItem => subItem.id === currentRouteName)
    );

    if (parentOfActiveSubItem) {
      if (expandedCategory !== parentOfActiveSubItem.id) {
        setExpandedCategory(parentOfActiveSubItem.id);
      }
    } else {
      const isCurrentRouteATopLevelItem = menuItems.some(item =>
        item.id === currentRouteName && item.type === 'item'
      );
      if (!isCurrentRouteATopLevelItem && expandedCategory !== null) {
        setExpandedCategory(null);
      }
    }
  }, [currentRouteName]);

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleNavigation = (routeName) => {
    navigation.navigate(routeName);
  };

  // NUEVA FUNCIÓN: Maneja el cierre de sesión
  const handleLogoutPress = () => {
    if (onLogout) {
      onLogout(); // Llama a la función onLogout pasada desde App.js
      navigation.closeDrawer(); // Cierra el Drawer después de cerrar sesión (opcional)
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'section-header') {
      return (
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeaderText}>{item.title}</Text>
        </View>
      );
    }

    const isActiveItem = currentRouteName === item.id;
    const isCategoryParentActive = item.type === 'category' && getIsCategoryActive(item.id, item.subItems);

    if (item.type === 'category') {
      const isExpanded = expandedCategory === item.id;

      return (
        <View key={item.id}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.menuItem,
              styles.menuCategory,
              isCategoryParentActive && styles.activeMenuItem,
              (pressed || hovered) && styles.hoverEffect
            ]}
            onPress={() => toggleCategory(item.id)}
          >
            <View style={styles.menuItemContent}>
              <Ionicons
                name={item.icon}
                size={18}
                color={isCategoryParentActive ? PRIMARY_GREEN : MEDIUM_GRAY}
                style={styles.menuIcon}
              />
              <Text
                style={[
                  styles.menuText,
                  isCategoryParentActive ? styles.activeMenuText : null,
                ]}
              >
                {item.title}
              </Text>
            </View>
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={MEDIUM_GRAY}
            />
          </Pressable>
          {isExpanded && (
            <View style={styles.subItemsContainer}>
              {item.subItems.map(subItem => {
                const isSubItemCurrentlyActive = currentRouteName === subItem.id;
                return (
                  <Pressable
                    key={subItem.id}
                    style={({ pressed, hovered }) => [
                      styles.subMenuItem,
                      isSubItemCurrentlyActive && styles.activeSubMenuItem,
                      (pressed || hovered) && styles.hoverEffect
                    ]}
                    onPress={() => handleNavigation(subItem.id)}
                  >
                    <Ionicons
                      name={subItem.icon}
                      size={16}
                      color={isSubItemCurrentlyActive ? PRIMARY_GREEN : MEDIUM_GRAY}
                      style={styles.subMenuItemIcon}
                    />
                    <Text style={[styles.subMenuItemText, isSubItemCurrentlyActive && styles.activeSubMenuItemText]}>
                      {subItem.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      );
    } else if (item.type === 'item') {
      return (
        <Pressable
          key={item.id}
          style={({ pressed, hovered }) => [
            styles.menuItem,
            isActiveItem && styles.activeMenuItem,
            (pressed || hovered) && styles.hoverEffect
          ]}
          onPress={() => handleNavigation(item.id)}
        >
          <Ionicons
            name={item.icon}
            size={18}
            color={isActiveItem ? PRIMARY_GREEN : MEDIUM_GRAY}
            style={styles.menuIcon}
          />
          <Text style={[styles.menuText, isActiveItem && styles.activeMenuText]}>
            {item.title}
          </Text>
        </Pressable>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/SoloLogo1.png')}
            style={styles.logo}
          />
          <View>
            <Text style={styles.companyName}>Aetheris</Text>
            <Text style={styles.tagline}>Conectando familias</Text>
          </View>
        </View>
        <View style={styles.menuHeader}>
          <Text style={styles.menuHeaderText}>NAVEGACIÓN PRINCIPAL</Text>
        </View>
        <FlatList
          data={menuItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.flatListContent}
        />
        <View style={styles.logoutContainer}>
          {/* MODIFICACIÓN: onPress para el botón de cerrar sesión */}
          <Pressable style={styles.logoutButton} onPress={handleLogoutPress}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  container: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: VERY_LIGHT_GRAY,
    marginBottom: 20,
  },
  logo: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
    marginRight: 5,
  },
  companyName: {
    fontSize: 26,
    fontWeight: '700',
    color: DARK_GRAY,
  },
  tagline: {
    fontSize: 13,
    color: LIGHT_GRAY,
    marginTop: 4,
  },
  menuHeader: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  menuHeaderText: {
    fontSize: 11,
    color: LIGHT_GRAY,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 5,
  },
  sectionHeaderText: {
    fontSize: 11,
    color: LIGHT_GRAY,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: ACCENT_GREEN_BACKGROUND,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
    paddingLeft: 14,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  hoverEffect: {
    backgroundColor: HOVER_EFFECT_COLOR,
  },
  menuCategory: {
    justifyContent: 'space-between',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 15,
    color: MEDIUM_GRAY,
    fontWeight: '500',
  },
  activeMenuText: {
    color: PRIMARY_GREEN,
    fontWeight: 'bold',
  },
  subItemsContainer: {
    backgroundColor: BACKGROUND_LIGHT,
    borderLeftWidth: 1,
    borderLeftColor: VERY_LIGHT_GRAY,
    marginLeft: 30,
    paddingVertical: 3,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 22,
    borderRadius: 6,
    marginHorizontal: 8,
    marginBottom: 2,
  },
  activeSubMenuItem: {
    backgroundColor: '#F3FBF0',
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_GREEN,
    paddingLeft: 19,
  },
  subMenuItemIcon: {
    marginRight: 10,
    width: 18,
    textAlign: 'center',
  },
  subMenuItemText: {
    fontSize: 13,
    color: MEDIUM_GRAY,
  },
  activeSubMenuItemText: {
    color: PRIMARY_GREEN,
    fontWeight: 'bold',
  },
  logoutContainer: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: VERY_LIGHT_GRAY,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    paddingVertical: 14,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  flatListContent: {
    flexGrow: 1,
    paddingRight: 5,
  }
});

export default SideMenu;