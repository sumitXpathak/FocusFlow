import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_APPS, BADGES, CHALLENGES, DAILY_GOAL_HOURS } from '../constants/data';

const AppContext = createContext();

const initialState = {
  apps: DEFAULT_APPS,
  points: 1240,
  level: 8,
  xp: 1240,
  xpToNext: 1500,
  streak: 45,
  streakDays: ['T','W','Th','F','Sa','Su'],
  completedToday: ['T','W','Th','F','Sa','Su'],
  badges: BADGES,
  challenges: CHALLENGES,
  dailyGoalHours: DAILY_GOAL_HOURS,
  screenTimeToday: 72,   // minutes
  focusSessionsToday: 3,
  pointsToday: 85,
  blockingEnabled: true,
  weeklyData: [140, 110, 190, 95, 175, 120, 72],
  categoryData: { Social: 42, Entertainment: 28, Productivity: 18, Other: 12 },
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_POINTS':
      return {
        ...state,
        points: state.points + action.payload,
        pointsToday: state.pointsToday + action.payload,
        xp: state.xp + action.payload,
      };
    case 'COMPLETE_SESSION':
      return {
        ...state,
        focusSessionsToday: state.focusSessionsToday + 1,
        points: state.points + action.payload,
        pointsToday: state.pointsToday + action.payload,
        xp: state.xp + action.payload,
      };
    case 'TOGGLE_BLOCKING':
      return { ...state, blockingEnabled: !state.blockingEnabled };
    case 'TOGGLE_APP_BLOCK':
      return {
        ...state,
        apps: state.apps.map(app =>
          app.id === action.payload ? { ...app, blocked: !app.blocked } : app
        ),
      };
    case 'SET_APP_LIMIT':
      return {
        ...state,
        apps: state.apps.map(app =>
          app.id === action.payload.id ? { ...app, limit: action.payload.limit } : app
        ),
      };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadSavedState();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('focusflow_state', JSON.stringify({
      points: state.points,
      level: state.level,
      xp: state.xp,
      streak: state.streak,
      apps: state.apps,
      blockingEnabled: state.blockingEnabled,
    }));
  }, [state.points, state.streak, state.apps, state.blockingEnabled]);

  async function loadSavedState() {
    try {
      const saved = await AsyncStorage.getItem('focusflow_state');
      if (saved) dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
    } catch (e) {
      console.log('No saved state found');
    }
  }

  const screenTimePercent = Math.min(
    (state.screenTimeToday / (state.dailyGoalHours * 60)) * 100,
    100
  );

  const remainingMinutes = Math.max(
    state.dailyGoalHours * 60 - state.screenTimeToday,
    0
  );

  return (
    <AppContext.Provider value={{
      ...state,
      dispatch,
      screenTimePercent,
      remainingMinutes,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
