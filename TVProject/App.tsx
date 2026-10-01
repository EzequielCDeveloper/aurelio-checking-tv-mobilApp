import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import { Sidebar } from './src/components/Sidebar';
import { Header } from './src/components/Header';
import { Toast } from './src/components/Toast';
import { DashboardView } from './src/views/DashboardView';
import { EmployeesView } from './src/views/EmployeesView';
import { OnboardingView } from './src/views/OnboardingView';
import { TVBoardView } from './src/views/TVBoardView';
import { theme } from './src/styles/theme';

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Control de Entradas y Salidas',
    subtitle: 'Métricas de asistencia y monitoreo de actividad en vivo'
  },
  empleados: {
    title: 'Gestión de Empleados',
    subtitle: 'Directorio de personal, turnos asignados y administración de estatus'
  },
  onboarding: {
    title: 'Módulo de Invitaciones',
    subtitle: 'Generación de links de registro y enrolamiento para nuevos colaboradores'
  },
  'tv-board': {
    title: 'Tablero TV de Asistencia',
    subtitle: 'Modo kiosco de alta visibilidad para pantallas de acceso'
  }
};

function MainLayout() {
  const { activeTab } = useApp();
  const currentMeta = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.appContainer}>
        {/* Left Sidebar */}
        <Sidebar />

        {/* Right Main Content */}
        <View style={styles.mainContent}>
          <Header title={currentMeta.title} subtitle={currentMeta.subtitle} />

          <View style={styles.viewContainer}>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'empleados' && <EmployeesView />}
            {activeTab === 'onboarding' && <OnboardingView />}
            {activeTab === 'tv-board' && <TVBoardView />}
          </View>
        </View>

        {/* Global Toast */}
        <Toast />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  appContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.bg,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: theme.colors.bg,
  },
  viewContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
});
