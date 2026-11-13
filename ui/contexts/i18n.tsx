import React, { createContext, useMemo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { I18NMessageDict, I18NSubstitution } from '../../shared/lib/i18n';
import {
  getCurrentLocale,
  getCurrentLocaleMessages,
  getEnLocaleMessages,
} from '../ducks/locale/locale';
import { getMessage } from '../helpers/utils/i18n-helper';

// Substitutions that are React elements make `getMessage` return JSX, which
// existing callers ignore, so the context keeps the string-only signature.
export type TranslateFunction = (
  key: string,
  substitutions?: unknown[],
) => string;

export const I18nContext = createContext<TranslateFunction>(
  (key) => `[${key}]`,
);

export const I18nProvider = ({ children }: { children?: ReactNode }) => {
  const currentLocale = useSelector(getCurrentLocale) as string;
  // The selectors are typed as `Record<string, string>`, but the stored
  // values are `I18NMessage` objects.
  const current = useSelector(
    getCurrentLocaleMessages,
  ) as unknown as I18NMessageDict;
  const en = useSelector(getEnLocaleMessages) as unknown as I18NMessageDict;

  const t = useMemo<TranslateFunction>(() => {
    return (key, substitutions) => {
      const args = substitutions as I18NSubstitution[] | undefined;
      return (getMessage(currentLocale, current, key, args) ||
        getMessage(currentLocale, en, key, args)) as string;
    };
  }, [currentLocale, current, en]);

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
};
