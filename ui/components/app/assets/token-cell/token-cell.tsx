import React from 'react';
import { useSelector } from 'react-redux';
import BN from 'bn.js';
import {
  getCurrentCurrency,
  getTokenList,
  selectERC20TokensByChain,
  getPreferences,
  getNativeCurrencyForChain,
  getMarketData,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getCurrencyRates,
} from '../../../../selectors';
import {
  isChainIdMainnet,
  getImageForChainId,
  getMultichainIsEvm,
} from '../../../../selectors/multichain';
import { TokenListItem } from '../../../multichain';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { useIsOriginalTokenSymbol } from '../../../../hooks/useIsOriginalTokenSymbol';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { stringifyBalance } from '../../../../hooks/useTokenBalances';

type TokenCellProps = {
  address: string;
  symbol: string;
  string?: string;
  chainId: string;
  tokenFiatAmount: number;
  image: string;
  isNative?: boolean;
  onClick?: (arg: string) => void;
};

const formatWithThreshold = (
  amount: number,
  threshold: number,
  locale: string,
  options: Intl.NumberFormatOptions,
): string => {
  return amount < threshold
    ? `<${new Intl.NumberFormat(locale, options).format(threshold)}`
    : new Intl.NumberFormat(locale, options).format(amount);
};

export default function TokenCell({
  address,
  image,
  symbol,
  chainId,
  string,
  tokenFiatAmount,
  isNative,
  onClick,
}: TokenCellProps) {
  const currentCurrency = useSelector(getCurrentCurrency);
  const currencyRates = useSelector(getCurrencyRates);
  console.log('currency rates', currencyRates);
  const nativeBalances = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  );
  const marketData = useSelector(getMarketData);
  const tokenList = useSelector(getTokenList);
  const isEvm = useSelector(getMultichainIsEvm);
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const isMainnet = chainId ? isChainIdMainnet(chainId) : false;
  const { privacyMode } = useSelector(getPreferences);
  const tokenData = Object.values(tokenList).find(
    (token) =>
      isEqualCaseInsensitive(token.symbol, symbol) &&
      isEqualCaseInsensitive(token.address, address),
  );

  const tokenMarketPrice = marketData[chainId]?.[address]?.price;

  const title =
    tokenData?.name ||
    (chainId === '0x1' && symbol === 'ETH'
      ? 'Ethereum'
      : chainId &&
        erc20TokensByChain?.[chainId]?.data?.[address.toLowerCase()]?.name) ||
    symbol;

  const tokenImage =
    tokenData?.iconUrl ||
    (chainId &&
      erc20TokensByChain?.[chainId]?.data?.[address.toLowerCase()]?.iconUrl) ||
    image;

  const locale = useSelector(getIntlLocale);

  const secondaryThreshold = 0.01;
  const primaryThreshold = 0.00001;

  // Format for fiat balance with currency style
  const secondary = formatWithThreshold(
    tokenFiatAmount,
    secondaryThreshold,
    locale,
    {
      style: 'currency',
      currency: currentCurrency.toUpperCase(),
    },
  );

  // Format for primary amount with 5 decimal places
  const primary = formatWithThreshold(
    Number(string),
    primaryThreshold,
    locale,
    {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    },
  );

  const isOriginalTokenSymbol = useIsOriginalTokenSymbol(address, symbol);

  let isStakeable = isMainnet && isEvm && isNative;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  isStakeable = false;
  ///: END:ONLY_INCLUDE_IF

  const secondaryTokenDisplayText = () => {
    if (isNative) {
      // @ts-ignore
      const nativeTokenBalanceHex = nativeBalances?.[chainId];

      if (nativeTokenBalanceHex !== '0x0') {
        const decimalBalance = hexToDecimal(nativeTokenBalanceHex);
        const readableBalance = stringifyBalance(
          new BN(decimalBalance),
          new BN(18),
          5,
        );
        const nativeTokenFiatAmount =
          parseFloat(readableBalance) * currencyRates[symbol].conversionRate;
        return formatWithThreshold(
          nativeTokenFiatAmount,
          secondaryThreshold,
          locale,
          {
            style: 'currency',
            currency: currentCurrency.toUpperCase(),
          },
        );
      }
    }
    if (tokenMarketPrice && !isNative) {
      return secondary;
    }
    return '';
  };

  const primaryTokenDisplayText = () => {
    if (isNative) {
      let nativeBalance;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const nativeTokenBalanceHex = nativeBalances?.[chainId];
      // console.log('nativeTokenBalanceHex', chainId, nativeTokenBalanceHex);

      if (nativeTokenBalanceHex !== '0x0') {
        const decimalBalance = hexToDecimal(nativeTokenBalanceHex);
        const readableBalance = stringifyBalance(
          new BN(decimalBalance),
          new BN(16),
          5,
        );
        nativeBalance = readableBalance || 0;
      }
      console.log('nativeBalance', chainId, nativeBalance);

      return formatWithThreshold(
        Number(nativeBalance),
        primaryThreshold,
        locale,
        {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        },
      );
    }
    if (tokenMarketPrice && !isNative) {
      return primary;
    }
    return '';
  };

  return (
    <TokenListItem
      onClick={onClick ? () => onClick(address) : undefined}
      tokenSymbol={symbol}
      tokenImage={isNative ? getNativeCurrencyForChain(chainId) : tokenImage}
      tokenChainImage={chainId ? getImageForChainId(chainId) : undefined}
      primary={primaryTokenDisplayText()}
      secondary={secondaryTokenDisplayText()}
      title={title}
      isOriginalTokenSymbol={isOriginalTokenSymbol}
      address={address}
      isStakeable={isStakeable}
      showPercentage
      privacyMode={privacyMode}
      isNativeCurrency={isNative}
      chainId={chainId}
    />
  );
}
