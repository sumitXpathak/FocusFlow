import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * A single blocking schedule window. Times are minutes-from-midnight and days
 * are 0=Mon … 6=Sun so the native side only ever does integer/set math. The
 * JS layer (AppContext) is responsible for converting "HH:MM" and day labels.
 */
export type EnforcementScheduleRule = {
  id: string;
  active: boolean;
  days: number[];          // 0=Mon … 6=Sun
  startMinutes: number;    // "09:00" → 540
  endMinutes: number;      // end < start ⇒ overnight wrap
  packages: string[];      // Android package names, NOT display names
};

export type EnforcementAppLimit = {
  packageName: string;
  dailyLimitMinutes: number;
};

/**
 * Declarative snapshot of everything the native BlockingService needs to decide
 * what to block on each tick. Pushed via updateEnforcementConfig whenever any
 * input changes.
 */
export type EnforcementConfig = {
  masterEnabled: boolean;
  focusActive: boolean;
  focusPackages: string[];
  limits: EnforcementAppLimit[];
  schedules: EnforcementScheduleRule[];
};

/**
 * Native Android module that enforces app blocking (focus sessions, daily
 * limits, and schedules) and reports real usage.
 *
 * Exposed methods (Android only — null everywhere else):
 *   hasUsagePermission(): boolean
 *   requestUsagePermission(): void
 *   hasOverlayPermission(): boolean
 *   requestOverlayPermission(): void
 *   updateEnforcementConfig(configJson: string): void   // JSON.stringify(EnforcementConfig)
 *   getUsageStats(sinceEpochMillis: number): Record<string, number>  // pkg → minutes
 *   startBlocking(packages: string[]): void             // legacy focus-only
 *   stopBlocking(): void
 *
 * `requireOptionalNativeModule` returns null instead of throwing when the
 * native module is unavailable (Expo Go, iOS, web, Jest). Callers must
 * null-check before use.
 */
export type InstalledApp = {
  packageName: string;
  name: string;
};

type ExpoAppBlockerModuleType = {
  hasUsagePermission(): boolean;
  requestUsagePermission(): void;
  hasOverlayPermission(): boolean;
  requestOverlayPermission(): void;
  getInstalledApps(): InstalledApp[];
  updateEnforcementConfig(configJson: string): void;
  getUsageStats(sinceEpochMillis: number): Record<string, number>;
  startBlocking(packages: string[]): void;
  stopBlocking(): void;
};

const ExpoAppBlockerModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<ExpoAppBlockerModuleType>('ExpoAppBlocker')
    : null;

export default ExpoAppBlockerModule;
