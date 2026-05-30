import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { NavigationContainer }      from '@react-navigation/native';
import { Ionicons }                 from '@expo/vector-icons';
import { COLORS }                   from '../constants/theme';
import { useAuth }                  from '../context/AuthContext';

import HomeScreen          from '../screens/HomeScreen';
import FocusScreen         from '../screens/FocusScreen';
import RewardsScreen       from '../screens/RewardsScreen';
import InsightsScreen      from '../screens/InsightsScreen';
import SettingsScreen      from '../screens/SettingsScreen';
import OnboardingScreen    from '../screens/OnboardingScreen';
import LoginScreen         from '../screens/LoginScreen';
import RegisterScreen      from '../screens/RegisterScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AppLimitScreen             from '../screens/AppLimitScreen';
import BlockingSchedulesScreen    from '../screens/BlockingSchedulesScreen';
import LoadingScreen              from '../screens/LoadingScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Home:     { active: 'home',        inactive: 'home-outline'        },
  Focus:    { active: 'play-circle', inactive: 'play-circle-outline' },
  Rewards:  { active: 'trophy',      inactive: 'trophy-outline'      },
  Insights: { active: 'bar-chart',   inactive: 'bar-chart-outline'   },
  Settings: { active: 'settings',    inactive: 'settings-outline'    },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor:  COLORS.grayBorder,
          borderTopWidth:  0.5,
          paddingTop:      8,
          paddingBottom:   20,
          height:          80,
        },
        tabBarLabelStyle:      { fontSize: 10, fontWeight: '500' },
        tabBarActiveTintColor:   COLORS.orange,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen}    />
      <Tab.Screen name="Focus"    component={FocusScreen}   />
      <Tab.Screen name="Rewards"  component={RewardsScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen}/>
      <Tab.Screen name="Settings" component={SettingsScreen}/>
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading, hasCompletedOnboarding } = useAuth();

  if (loading) return <LoadingScreen />;

  // Smart initial route:
  // - Already logged in → Main
  // - Seen onboarding but not logged in → Login
  // - First time ever → Onboarding
  const initialRoute = isAuthenticated
    ? 'Main'
    : hasCompletedOnboarding
      ? 'Login'
      : 'Onboarding';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, gestureEnabled: true }}
      >
        <Stack.Screen name="Onboarding"    component={OnboardingScreen}    />
        <Stack.Screen name="Login"         component={LoginScreen}         />
        <Stack.Screen name="Register"      component={RegisterScreen}      />
        <Stack.Screen name="Main"          component={MainTabs}            />
        <Stack.Screen name="Notifications"       component={NotificationsScreen}    />
        <Stack.Screen name="AppLimits"           component={AppLimitScreen}         />
        <Stack.Screen name="BlockingSchedules"   component={BlockingSchedulesScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
