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
import { TokenWithFiatAmount } from '../types';
import useShouldShowFiat from '../hooks/useShouldShowFiat';

type TokenCellProps = {
  token: TokenWithFiatAmount;
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
  token,
  privacyMode = false,
  onClick,
}: TokenCellProps) {
  const locale = useSelector(getIntlLocale);
  const currentCurrency = useSelector(getCurrentCurrency);
  const tokenList = useSelector(getTokenList);
  const isEvm = useSelector(getMultichainIsEvm);
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const isEvmMainnet =
    token.chainId && isEvm ? isChainIdMainnet(token.chainId) : false;
  const tokenData = Object.values(tokenList).find(
    (tokenToFind) =>
      isEqualCaseInsensitive(tokenToFind.symbol, token.symbol) &&
      isEqualCaseInsensitive(tokenToFind.address, token.address),
  );

  const shouldShowFiat = useShouldShowFiat(); // TODO: break out currency formatter into a useFormattedFiatHook (chain agnostic)

  const title =
    tokenData?.name ||
    (token.chainId === '0x1' && token.symbol === 'ETH'
      ? 'Ethereum'
      : token.chainId &&
        erc20TokensByChain?.[token.chainId]?.data?.[token.address.toLowerCase()]
          ?.name) ||
    token.symbol;

  const tokenImage =
    tokenData?.iconUrl ||
    (token.chainId &&
      erc20TokensByChain?.[token.chainId]?.data?.[token.address.toLowerCase()]
        ?.iconUrl) ||
    token.image;

  const secondaryThreshold = 0.01;
  // Format for fiat balance with currency style
  const secondary = shouldShowFiat
    ? formatWithThreshold(token.tokenFiatAmount, secondaryThreshold, locale, {
        style: 'currency',
        currency: currentCurrency.toUpperCase(),
      })
    : undefined;

  const primary = formatAmount(
    locale,
    new BigNumber(Number(token.string) || '0', 10),
  );

  const isStakeable = isEvmMainnet && isEvm && token.isNative;

  function handleOnClick() {
    if (!onClick || !token.chainId) {
      return;
    }
    onClick(token.chainId, token.address);
  }

  if (!token.chainId) {
    return null;
  }

  const tokenChainImage = getImageForChainId(token.chainId);

  return (
    <TokenListItem
      onClick={handleOnClick}
      tokenSymbol={token.symbol}
      tokenImage={
        token.isNative ? getNativeCurrencyForChain(token.chainId) : tokenImage
      }
      tokenChainImage={tokenChainImage || undefined}
      primary={primary}
      secondary={secondary}
      title={title}
      address={token.address}
      isStakeable={isStakeable}
      showPercentage
      privacyMode={privacyMode}
      isNativeCurrency={token.isNative}
      chainId={token.chainId}
    />
  );
}
