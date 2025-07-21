import { useSelector } from 'react-redux';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { getMultichainSelectedAccountCachedBalance } from '../../../../selectors/multichain';

const usePrimaryCurrencyProperties = () => {
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency('PRIMARY', {
    ethNumberOfDecimals: 4,
    shouldCheckShowNativeToken: true,
  });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(balance, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  return {
    primaryCurrencyProperties,
  };
};

export default usePrimaryCurrencyProperties;
