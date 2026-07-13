import type { I18nFunction } from '@metamask/7715-permission-types';

/** Mirrors the (unexported) `I18nValue` type from `@metamask/7715-permission-types`. */
export type I18nValue = {
  key: string;
  args?: (string | number)[];
};

/**
 * Translates an {@link I18nValue} (key + optional interpolation args) with the given i18n function.
 * @param t
 * @param value
 */
export function translateI18nValue(t: I18nFunction, value: I18nValue): string {
  return t(value.key, value.args);
}
