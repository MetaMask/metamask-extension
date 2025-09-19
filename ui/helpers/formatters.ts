import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createFormatters } from '@metamask/assets-controllers';
import { getIntlLocale } from '../ducks/locale/locale';

export function useFormatters() {
  const locale = useSelector(getIntlLocale);

  return useMemo(() => createFormatters({ locale }), [locale]);
}
