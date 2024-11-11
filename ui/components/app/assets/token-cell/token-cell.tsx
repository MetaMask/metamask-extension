import React from 'react';
import { useSelector } from 'react-redux';
import {
  getCurrentCurrency,
  getTokenList,
  selectERC20TokensByChain,
  getPreferences,
  getNativeCurrencyForChain,
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

type TokenCellProps = {
  address: string;
  symbol: string;
  string?: string;
  chainId: string;
  tokenFiatAmount: number;
  image: string;
  isNative?: boolean;
  onClick?: (chainId: string, address: string) => void;
};

export const formatWithThreshold = (
  amount: number,
  threshold: number,
  locale: string,
  options: Intl.NumberFormatOptions,
): string => {
  if (amount === 0) {
    return new Intl.NumberFormat(locale, options).format(0);
  }
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
  const locale = useSelector(getIntlLocale);
  const currentCurrency = useSelector(getCurrentCurrency);
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

  const secondaryThreshold = 0.0;
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

  function handleOnClick() {
    if (!onClick || !chainId) {
      return;
    }
    onClick(chainId, address);
  }

  if (!chainId) {
    return null;
  }

  return (
    <TokenListItem
      onClick={handleOnClick}
      tokenSymbol={symbol}
      tokenImage={isNative ? getNativeCurrencyForChain(chainId) : tokenImage}
      tokenChainImage={chainId ? getImageForChainId(chainId) : undefined}
      primary={primary}
      secondary={secondary}
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
