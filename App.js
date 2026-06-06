import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ── Catch module-level import errors ─────────────────
// If any of our app modules crash during import (e.g. Firebase init),
// we catch it here instead of getting a blank screen.
let loadError = null;
let AuthProvider, AppProvider, TimerProvider, AppNavigator;

try {
  AuthProvider = require('./src/context/AuthContext').AuthProvider;
  AppProvider = require('./src/context/AppContext').AppProvider;
  TimerProvider = require('./src/context/TimerContext').TimerProvider;
  AppNavigator = require('./src/navigation/AppNavigator').default;
} catch (e) {
  loadError = e;
}

// ── ErrorBoundary for React render errors ────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#900', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>⚠️ Render Error</Text>
          <ScrollView style={{ marginTop: 10 }}>
            <Text style={{ color: 'white', fontSize: 14 }}>{this.state.error?.toString()}</Text>
            <Text style={{ color: '#faa', marginTop: 10, fontSize: 11 }}>{this.state.errorInfo?.componentStack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── Error display for module-level crashes ────────────
function ModuleErrorScreen({ error }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#b00', padding: 20, paddingTop: 60 }}>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>⛔ Startup Error</Text>
      <Text style={{ color: '#fdd', fontSize: 14, marginTop: 10 }}>
        The app failed to load. Error details:
      </Text>
      <ScrollView style={{ marginTop: 10 }}>
        <Text style={{ color: 'white', fontSize: 13 }}>{error?.toString()}</Text>
        <Text style={{ color: '#faa', marginTop: 10, fontSize: 11 }}>{error?.stack}</Text>
      </ScrollView>
    </View>
  );
}

export default function App() {
  // If modules failed to load, show error screen immediately
  if (loadError) {
    return <ModuleErrorScreen error={loadError} />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <AppProvider>
              <TimerProvider>
                <StatusBar style="dark" />
                <AppNavigator />
              </TimerProvider>
            </AppProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
