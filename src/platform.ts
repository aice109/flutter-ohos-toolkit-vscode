import { t } from './i18n';
import { FlutterDevice } from './flutterCli';

export type MobilePlatform = 'android' | 'ios' | 'harmony';
export type PlatformKey = MobilePlatform | 'other';

export const PLATFORM_ORDER: PlatformKey[] = ['android', 'ios', 'harmony', 'other'];

/** Localized display name for a platform. */
export function platformLabel(key: PlatformKey): string {
  switch (key) {
    case 'android':
      return t('Android');
    case 'ios':
      return t('iOS');
    case 'harmony':
      return t('HarmonyOS');
    default:
      return t('Other');
  }
}

export const PLATFORM_ICONS: Record<PlatformKey, string> = {
  android: 'device-mobile',
  ios: 'device-mobile',
  harmony: 'device-mobile',
  other: 'device-desktop',
};

/** Classify a Flutter device into one of the three supported platforms. */
export function platformOfDevice(device: FlutterDevice): PlatformKey {
  const platform = (device.platformType ?? '').toLowerCase();
  const target = (device.targetPlatform ?? '').toLowerCase();
  const id = (device.id ?? '').toLowerCase();

  if (platform.includes('ohos') || platform.includes('harmony')) {
    return 'harmony';
  }
  if (target.includes('ohos') || target.includes('harmony')) {
    return 'harmony';
  }
  if (platform.includes('android') || target.includes('android')) {
    return 'android';
  }
  if (platform === 'ios' || target.includes('ios') || id.startsWith('ios')) {
    return 'ios';
  }
  return 'other';
}

export function isMobilePlatform(key: PlatformKey): key is MobilePlatform {
  return key === 'android' || key === 'ios' || key === 'harmony';
}
