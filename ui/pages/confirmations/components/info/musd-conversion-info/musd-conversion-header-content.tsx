import { type ReactNode } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type HeaderContent = {
  title: ReactNode;
  endAccessory: ReactNode;
};

export function useMusdConversionHeaderContent(): HeaderContent {
  const t = useI18nContext();

  return {
    title: t('musdConvert'),
    endAccessory: null,
  };
}
