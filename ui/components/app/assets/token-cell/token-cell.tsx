import React from 'react';
import { useSelector } from 'react-redux';
import {
  getCurrentCurrency,
  getTokenList,
  selectERC20TokensByChain,
  getPreferences,
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
  chainId?: string;
  tokenFiatAmount: number;
  image: string;
  isNative?: boolean;
  onClick?: (arg: string) => void;
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
    (chainId &&
      erc20TokensByChain?.[chainId]?.data?.[address.toLowerCase()]?.name) ||
    symbol;
  const tokenImage =
    tokenData?.iconUrl ||
    (chainId &&
      erc20TokensByChain?.[chainId]?.data?.[address.toLowerCase()]?.iconUrl) ||
    image;

  const locale = useSelector(getIntlLocale);
  const formattedFiatBalance = new Intl.NumberFormat(locale, {
    currency: currentCurrency.toUpperCase(),
    style: 'currency',
  }).format(tokenFiatAmount);

  const isOriginalTokenSymbol = useIsOriginalTokenSymbol(address, symbol);

  let isStakeable = isMainnet && isEvm && isNative;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  isStakeable = false;
  ///: END:ONLY_INCLUDE_IF

  return (
    <TokenListItem
      onClick={onClick ? () => onClick(address) : undefined}
      tokenSymbol={symbol}
      tokenImage={tokenImage}
      tokenChainImage={chainId ? getImageForChainId(chainId) : undefined}
      primary={string}
      secondary={formattedFiatBalance}
      title={title}
      isOriginalTokenSymbol={isOriginalTokenSymbol}
      address={address}
      isStakeable={isStakeable}
      showPercentage
      privacyMode={privacyMode}
    />
  );
}
