import React, { createContext, useMemo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { I18NSubstitution } from '../../shared/lib/i18n';
import {
  getCurrentLocale,
  getCurrentLocaleMessages,
  getEnLocaleMessages,
} from '../ducks/locale/locale';
import { getMessage } from '../helpers/utils/i18n-helper';

export type I18nFunction = (
  key: string,
  substitutions?: I18NSubstitution[],
) => ReturnType<typeof getMessage>;

export const I18nContext = createContext<I18nFunction>((key) => `[${key}]`);

export const I18nProvider = ({ children }: { children?: ReactNode }) => {
  const currentLocale = useSelector(getCurrentLocale);
  const current = useSelector(getCurrentLocaleMessages);
  const en = useSelector(getEnLocaleMessages);

  const t = useMemo<I18nFunction>(() => {
    return (key, substitutions) => {
      if (!currentLocale) {
        return null;
      }

      if (current) {
        const message = getMessage(currentLocale, current, key, substitutions);
        if (message) {
          return message;
        }
      }

      if (en) {
        return getMessage(currentLocale, en, key, substitutions);
      }

      return null;
    };
  }, [currentLocale, current, en]);

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
};
