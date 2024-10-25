import React from 'react';
import { useSelector } from 'react-redux';
import { getCurrentCurrency, getTokenList } from '../../../../selectors';
import { TokenListItem } from '../../../multichain';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { useIsOriginalTokenSymbol } from '../../../../hooks/useIsOriginalTokenSymbol';
import { getIntlLocale } from '../../../../ducks/locale/locale';

type TokenCellProps = {
  address: string;
  symbol: string;
  string?: string;
  tokenFiatAmount: number;
  image: string;
  onClick?: (arg: string) => void;
};

export default function TokenCell({
  address,
  image,
  symbol,
  string,
  tokenFiatAmount,
  onClick,
}: TokenCellProps) {
  const currentCurrency = useSelector(getCurrentCurrency);
  const tokenList = useSelector(getTokenList);
  const tokenData = Object.values(tokenList).find(
    (token) =>
      isEqualCaseInsensitive(token.symbol, symbol) &&
      isEqualCaseInsensitive(token.address, address),
  );
  const title = tokenData?.name || symbol;
  const tokenImage = tokenData?.iconUrl || image;
  const locale = useSelector(getIntlLocale);
  const formattedFiatBalance = new Intl.NumberFormat(locale, {
    currency: currentCurrency.toUpperCase(),
    style: 'currency',
  }).format(tokenFiatAmount);

  const isOriginalTokenSymbol = useIsOriginalTokenSymbol(address, symbol);

  return (
    <TokenListItem
      onClick={onClick ? () => onClick(address) : undefined}
      tokenSymbol={symbol}
      tokenImage={tokenImage}
      primary={string}
      secondary={formattedFiatBalance}
      title={title}
      isOriginalTokenSymbol={isOriginalTokenSymbol}
      address={address}
      showPercentage
    />
  );
}
