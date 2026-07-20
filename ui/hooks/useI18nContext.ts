import { useContext } from 'react';
import { I18nContext } from '../contexts/i18n';

export type I18nFunction = (key: string, ...args: unknown[]) => string;

/**
 * useI18ncContext
 *
 * A time saving shortcut to using useContext + I18ncontext in many
 * different places.
 *
 * @returns I18n function from contexts/I18n.js
 */
export function useI18nContext(): I18nFunction {
  return useContext(I18nContext) as I18nFunction;
}
