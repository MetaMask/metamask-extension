import { useCallback } from 'react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getPasskeyAuthMethodKey } from '../../../shared/lib/passkey';

const PASSKEY_SUBSTITUTED_LABEL_KEYS: ReadonlySet<string> = new Set([
  'setUpPasskey',
  'turnOffPasskey',
  'unlockWithPasskey',
]);

type TranslateMessage = (key: string, substitutions?: string[]) => string;

function translateBareLabelKey(t: TranslateMessage, labelKey: string): string {
  if (PASSKEY_SUBSTITUTED_LABEL_KEYS.has(labelKey)) {
    return t(labelKey, [t(getPasskeyAuthMethodKey())]);
  }
  return t(labelKey);
}

/**
 * Settings i18n: same as {@link useI18nContext}, but bare `t(key)` calls
 * resolve passkey-related label keys that need the OS-specific auth-method
 * noun. Calls with any additional arguments forward unchanged (substitutions,
 * React nodes, etc.).
 *
 * @returns Wrapped translate function
 */
export function useSettingsI18n() {
  const rawT = useI18nContext();

  return useCallback(
    (key: string, ...args: unknown[]) => {
      if (args.length > 0) {
        return rawT(key, ...args);
      }
      return translateBareLabelKey(rawT as TranslateMessage, key);
    },
    [rawT],
  );
}
