import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { TimerProvider } from './src/context/TimerContext';

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
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: '#900', padding: 20, paddingTop: 50 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Fatal Error</Text>
            <ScrollView>
              <Text style={{ color: 'white', marginTop: 10 }}>{this.state.error?.toString()}</Text>
              <Text style={{ color: 'white', marginTop: 10, fontSize: 10 }}>{this.state.errorInfo?.componentStack}</Text>
            </ScrollView>
          </View>
        </SafeAreaProvider>
      );
    }
    return this.props.children;
  }
}

export default function App() {
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
