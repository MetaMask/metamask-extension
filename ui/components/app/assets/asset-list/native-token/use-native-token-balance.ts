import currencyFormatter from 'currency-formatter';
import { useSelector } from 'react-redux';

import {
  getMultichainCurrencyImage,
  getMultichainCurrentNetwork,
  getMultichainSelectedAccountCachedBalance,
  getMultichainShouldShowFiat,
} from '../../../../../selectors/multichain';
import { getPreferences } from '../../../../../selectors';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import { PRIMARY, SECONDARY } from '../../../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../../hooks/useCurrencyDisplay';
import { TokenWithBalance } from '../asset-list';

export const useNativeTokenBalance = () => {
  const showFiat = useSelector(getMultichainShouldShowFiat);
  const primaryTokenImage = useSelector(getMultichainCurrencyImage);
  const { showNativeTokenAsMainBalance } = useSelector(getPreferences);
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
  const currentCurrency = useSelector(getCurrentCurrency);
  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, {
    ethNumberOfDecimals: 4,
    shouldCheckShowNativeToken: true,
  });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, {
    ethNumberOfDecimals: 4,
    shouldCheckShowNativeToken: true,
  });

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

  const primaryBalance = isOriginalNativeSymbol
    ? secondaryCurrencyDisplay
    : undefined;

  const secondaryBalance =
    showFiat && isOriginalNativeSymbol ? primaryCurrencyDisplay : undefined;

  const tokenSymbol = showNativeTokenAsMainBalance
    ? primaryCurrencyProperties.suffix
    : secondaryCurrencyProperties.suffix;

  const unformattedTokenFiatAmount = showNativeTokenAsMainBalance
    ? secondaryCurrencyDisplay.toString()
    : primaryCurrencyDisplay.toString();

  // useCurrencyDisplay passes along the symbol and formatting into the value here
  // for sorting we need the raw value, without the currency and it should be decimal
  // this is the easiest way to do this without extensive refactoring of useCurrencyDisplay
  const tokenFiatAmount = currencyFormatter
    .unformat(unformattedTokenFiatAmount, {
      code: currentCurrency.toUpperCase(),
    })
    .toString();

  const nativeTokenWithBalance: TokenWithBalance = {
    address: '',
    symbol: tokenSymbol ?? '',
    string: primaryBalance,
    image: primaryTokenImage,
    secondary: secondaryBalance,
    tokenFiatAmount,
    isNative: true,
  };

  return nativeTokenWithBalance;
};
