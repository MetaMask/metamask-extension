import { useSelector } from 'react-redux';
import {
  showPrimaryCurrency,
  showSecondaryCurrency,
} from '../../../../../../shared/modules/currency-display.utils';
import {
  getMultichainCurrencyImage,
  getMultichainCurrentNetwork,
  getMultichainSelectedAccountCachedBalance,
  getMultichainShouldShowFiat,
} from '../../../../../selectors/multichain';
import { getPreferences } from '../../../../../selectors';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import { PRIMARY, SECONDARY } from '../../../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../../hooks/useCurrencyDisplay';
import { TokenWithBalance } from '../asset-list';

export const useNativeTokenBalance = () => {
  const showFiat = useSelector(getMultichainShouldShowFiat);
  const primaryTokenImage = useSelector(getMultichainCurrencyImage);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const { chainId, ticker, type, rpcUrl } = useSelector(
    getMultichainCurrentNetwork,
  );
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
    rpcUrl,
  );
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 });

  const [primaryCurrencyDisplay, primaryCurrencyProperties] =
    useCurrencyDisplay(balance, {
      numberOfDecimals: primaryNumberOfDecimals,
      currency: primaryCurrency,
    });

  const [secondaryCurrencyDisplay, secondaryCurrencyProperties] =
    useCurrencyDisplay(balance, {
      numberOfDecimals: secondaryNumberOfDecimals,
      currency: secondaryCurrency,
    });

  const primaryBalance = showSecondaryCurrency(
    isOriginalNativeSymbol,
    useNativeCurrencyAsPrimaryCurrency,
  )
    ? secondaryCurrencyDisplay
    : undefined;

  const secondaryBalance =
    showFiat &&
    showPrimaryCurrency(
      isOriginalNativeSymbol,
      useNativeCurrencyAsPrimaryCurrency,
    )
      ? primaryCurrencyDisplay
      : undefined;

  const tokenSymbol = useNativeCurrencyAsPrimaryCurrency
    ? primaryCurrencyProperties.suffix
    : secondaryCurrencyProperties.suffix;

  const nativeTokenWithBalance: TokenWithBalance = {
    address: '',
    symbol: tokenSymbol || '',
    string: primaryBalance,
    image: primaryTokenImage,
    tokenFiatAmount: secondaryBalance,
    isNative: true,
  };

  return nativeTokenWithBalance;
};
