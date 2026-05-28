import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SESSION_TYPES, DEFAULT_BREAK_MINUTES } from '../constants/data';
import { useApp } from './AppContext';

const TimerContext = createContext();

export function TimerProvider({ children }) {
  const { dispatch } = useApp();
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TYPES[0].duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(DEFAULT_BREAK_MINUTES * 60);
  const intervalRef = useRef(null);

  const totalSeconds = isBreak ? DEFAULT_BREAK_MINUTES * 60 : sessionType.duration * 60;
  const progress = 1 - secondsLeft / totalSeconds;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isBreak]);

  function handleTimerComplete() {
    setIsRunning(false);
    if (!isBreak) {
      dispatch({ type: 'COMPLETE_SESSION', payload: sessionType.points });
      setSessionsCompleted(prev => prev + 1);
      setIsBreak(true);
      setSecondsLeft(DEFAULT_BREAK_MINUTES * 60);
    } else {
      setIsBreak(false);
      setSecondsLeft(sessionType.duration * 60);
    }
  }

  function startTimer() { setIsRunning(true); }
  function pauseTimer() { setIsRunning(false); }

  function resetTimer() {
    setIsRunning(false);
    setIsBreak(false);
    setSecondsLeft(sessionType.duration * 60);
  }

  function changeSession(type) {
    setIsRunning(false);
    setIsBreak(false);
    setSessionType(type);
    setSecondsLeft(type.duration * 60);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <TimerContext.Provider value={{
      sessionType, secondsLeft, isRunning, isBreak,
      sessionsCompleted, progress, displayTime, totalSeconds,
      startTimer, pauseTimer, resetTimer, changeSession,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
