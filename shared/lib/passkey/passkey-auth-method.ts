import Bowser from 'bowser';
import { OS, type Os } from '../../constants/app';

/**
 * Normalized OS for passkey marketing copy (Bowser + user agent).
 * Windows and macOS are distinguished; all other platforms map to {@link OS.OTHER}.
 */
function detectOsForPasskey(): Os {
  const osName = Bowser.getParser(globalThis.navigator.userAgent).getOSName();
  if (osName === Bowser.OS_MAP.Windows) {
    return OS.WINDOWS;
  }
  if (osName === Bowser.OS_MAP.MacOS) {
    return OS.MACOS;
  }
  return OS.OTHER;
}

/**
 * i18n message keys for the localized passkey auth-method noun.
 * Maps to copy in `app/_locales/*\/messages.json`.
 */
type PasskeyAuthMethodKey =
  | 'passkeyAuthMethodBiometrics'
  | 'passkeyAuthMethodTouchId'
  | 'passkeyAuthMethodWindowsHello';

/**
 * Optional configuration for {@link getPasskeyAuthMethodKey}.
 */
type GetPasskeyAuthMethodKeyOptions = {
  /**
   * When true, prefer the platform-specific feature name on macOS (Touch ID).
   * Has no effect on Windows (always Windows Hello) or other OSes (always
   * Biometrics). Use for descriptive copy that names the underlying feature
   * (e.g. the "Use Touch ID to unlock..." description).
   */
  specific?: boolean;
};

/**
 * Returns the i18n key for the passkey auth-method noun shown in passkey copy.
 *
 * Uses {@link detectOsForPasskey} internally (Bowser on `globalThis.navigator`).
 *
 * Resolution:
 * - Windows: always `passkeyAuthMethodWindowsHello` ("Windows Hello").
 * - macOS with `{ specific: true }`: `passkeyAuthMethodTouchId` ("Touch ID").
 * - Everything else (macOS default, Linux, iOS, Android, Other, unknown):
 * `passkeyAuthMethodBiometrics` ("Biometrics").
 *
 * The noun is intentionally OS-driven marketing copy, not a runtime capability
 * check; we do not detect Touch ID hardware or Windows Hello enrollment here.
 *
 * @param options - Optional flags such as `specific` for Touch ID on macOS.
 * @returns The i18n key for the passkey auth-method noun.
 */
export function getPasskeyAuthMethodKey(
  options?: GetPasskeyAuthMethodKeyOptions,
): PasskeyAuthMethodKey {
  const os = detectOsForPasskey();
  if (os === OS.WINDOWS) {
    return 'passkeyAuthMethodWindowsHello';
  }
  if (os === OS.MACOS && options?.specific === true) {
    return 'passkeyAuthMethodTouchId';
  }
  return 'passkeyAuthMethodBiometrics';
}
