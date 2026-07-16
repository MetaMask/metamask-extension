import React, { createContext, useMemo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { I18NMessageDict, I18NSubstitution } from '../../shared/lib/i18n';
import {
  getCurrentLocale,
  getCurrentLocaleMessages,
  getEnLocaleMessages,
} from '../ducks/locale/locale';
import { getMessage } from '../helpers/utils/i18n-helper';

export type I18nFunction = (key: string, ...args: unknown[]) => string;

export const I18nContext = createContext<I18nFunction>((key) => `[${key}]`);

export const I18nProvider = ({ children }: { children?: ReactNode }) => {
  const currentLocale = useSelector(getCurrentLocale);
  const current = useSelector(getCurrentLocaleMessages);
  const en = useSelector(getEnLocaleMessages);

  const t = useMemo<I18nFunction>(() => {
    return (key, ...args) =>
      (getMessage(
        currentLocale as string,
        current as unknown as I18NMessageDict,
        key,
        args[0] as I18NSubstitution[],
      ) ||
        getMessage(
          currentLocale as string,
          en as unknown as I18NMessageDict,
          key,
          args[0] as I18NSubstitution[],
        )) as string;
  }, [currentLocale, current, en]);

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
};
