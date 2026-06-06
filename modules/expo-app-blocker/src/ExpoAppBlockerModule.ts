import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoAppBlockerModule extends NativeModule<{}> {}

export default requireNativeModule<ExpoAppBlockerModule>('ExpoAppBlocker');
