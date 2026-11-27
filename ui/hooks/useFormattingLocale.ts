import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../ducks/locale/locale';
import { resolveFormattingLocale } from '../helpers/utils/locale';
import { useEventListener } from './useEventListener';

// App language combined with the browser's region, e.g. "en-DE".
export function useFormattingLocale() {
  const appLanguage = useSelector(getIntlLocale);
  const [deviceLocales, setDeviceLocales] = useState(() => navigator.languages);
  useEventListener('languagechange', () =>
    setDeviceLocales(navigator.languages),
  );

  return useMemo(
    () => resolveFormattingLocale({ appLanguage, deviceLocales }),
    [appLanguage, deviceLocales],
  );
}
