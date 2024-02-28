import { useSelector } from 'react-redux';
import {
  getPreferences,
  getSendInputCurrencySwitched,
} from '../../../../selectors';

export default function useIsFiatPrimary() {
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const sendInputCurrencySwitched = useSelector(getSendInputCurrencySwitched);

  const isFiatPrimary = Boolean(
    (useNativeCurrencyAsPrimaryCurrency && sendInputCurrencySwitched) ||
      (!useNativeCurrencyAsPrimaryCurrency && !sendInputCurrencySwitched),
  );

  return isFiatPrimary;
}
