import type {
  I18nFunction,
  TranslationKeys,
} from '@metamask/7715-permission-types';
import { buildPermissionI18nMap } from '../../../shared/lib/gator-permissions/permission-i18n-map';
import { useI18nContext } from '../useI18nContext';

/**
 * Returns a lookup map for every {@link TranslationKeys} entry, wrapping
 * {@link useI18nContext} so callers don't need the intermediary `t` function.
 */
export function useAdvancedPermissionTranslationsMap(): Record<
  TranslationKeys,
  string
> {
  const t = useI18nContext() as I18nFunction;
  return buildPermissionI18nMap(t);
}
