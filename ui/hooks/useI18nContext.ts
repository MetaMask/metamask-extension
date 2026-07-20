import { useContext } from 'react';
import { I18nContext, type I18nFunction } from '../contexts/i18n';

/**
 * A shortcut for accessing the i18n context.
 *
 * @returns The i18n translation function.
 */
export function useI18nContext(): I18nFunction {
  return useContext(I18nContext);
}
