import React from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import {
  getTokenList,
  selectERC20TokensByChain,
  getNativeCurrencyForChain,
} from '../../../../selectors';
import {
  isChainIdMainnet,
  getImageForChainId,
  getMultichainIsEvm,
} from '../../../../selectors/multichain';
import { TokenListItem } from '../../../multichain';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { formatAmount } from '../../../../pages/confirmations/components/simulation-details/formatAmount';

type TokenCellProps = {
  address: string;
  symbol: string;
  string?: string;
  chainId: string;
  tokenFiatAmount: number | null;
  image: string;
  isNative?: boolean;
  privacyMode?: boolean;
  onClick?: (chainId: string, address: string) => void;
};

export const formatWithThreshold = (
  amount: number | null,
  threshold: number,
  locale: string,
  options: Intl.NumberFormatOptions,
): string => {
  if (amount === null) {
    return '';
  }
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
  privacyMode = false,
  onClick,
}: TokenCellProps) {
  const locale = useSelector(getIntlLocale);
  const currentCurrency = useSelector(getCurrentCurrency);
  const tokenList = useSelector(getTokenList);
  const isEvm = useSelector(getMultichainIsEvm);
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const isMainnet = chainId ? isChainIdMainnet(chainId) : false;
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

  const secondaryThreshold = 0.01;
  // Format for fiat balance with currency style
  const secondary =
    tokenFiatAmount === null
      ? undefined
      : formatWithThreshold(tokenFiatAmount, secondaryThreshold, locale, {
          style: 'currency',
          currency: currentCurrency.toUpperCase(),
        });

  const primary = formatAmount(
    locale,
    new BigNumber(Number(string) || '0', 10),
  );

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

  const tokenChainImage = getImageForChainId(chainId);

  return (
    <TokenListItem
      onClick={handleOnClick}
      tokenSymbol={symbol}
      tokenImage={isNative ? getNativeCurrencyForChain(chainId) : tokenImage}
      tokenChainImage={tokenChainImage || undefined}
      primary={primary}
      secondary={secondary}
      title={title}
      address={address}
      isStakeable={isStakeable}
      showPercentage
      privacyMode={privacyMode}
      isNativeCurrency={isNative}
      chainId={chainId}
    />
  );
}
