import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Native Android module that blocks distracting apps during focus sessions.
 *
 * Exposed methods (Android only — null everywhere else):
 *   hasUsagePermission(): boolean
 *   requestUsagePermission(): void
 *   hasOverlayPermission(): boolean
 *   requestOverlayPermission(): void
 *   startBlocking(packages: string[]): void
 *   stopBlocking(): void
 *
 * `requireOptionalNativeModule` returns null instead of throwing when the
 * native module is unavailable (Expo Go, iOS, web, Jest). Callers must
 * null-check before use.
 */
type ExpoAppBlockerModuleType = {
  hasUsagePermission(): boolean;
  requestUsagePermission(): void;
  hasOverlayPermission(): boolean;
  requestOverlayPermission(): void;
  startBlocking(packages: string[]): void;
  stopBlocking(): void;
};

const ExpoAppBlockerModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<ExpoAppBlockerModuleType>('ExpoAppBlocker')
    : null;

export default ExpoAppBlockerModule;
