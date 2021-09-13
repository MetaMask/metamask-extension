import { useContext } from 'react';
import { I18nContext } from '../contexts/i18n';

/**
 * useI18ncContext
 *
 * A time saving shortcut to using useContext + I18ncontext in many
 * different places.
 *
 * @returns {Function} I18n function from contexts/I18n.js
 */
export function useI18nContext() {
  return useContext(I18nContext);
}
