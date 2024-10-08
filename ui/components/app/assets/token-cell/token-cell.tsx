import React from 'react';
import { useSelector } from 'react-redux';
import { getTokenList } from '../../../../selectors';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { TokenListItem } from '../../../multichain';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { useIsOriginalTokenSymbol } from '../../../../hooks/useIsOriginalTokenSymbol';
import { getIntlLocale } from '../../../../ducks/locale/locale';

type TokenCellProps = {
  address: string;
  symbol: string;
  string?: string;
  image: string;
  chainId: string;
  onClick?: (arg: string) => void;
};

export default function TokenCell({
  address,
  image,
  symbol,
  string,
  chainId,
  onClick,
}: TokenCellProps) {
  const tokenList = useSelector(getTokenList);
  const tokenData = Object.values(tokenList).find(
    (token) =>
      isEqualCaseInsensitive(token.symbol, symbol) &&
      isEqualCaseInsensitive(token.address, address),
  );
  const title = tokenData?.name || symbol;
  const tokenImage = tokenData?.iconUrl || image;
  const formattedFiat = useTokenFiatAmount(address, string, symbol, {}, false);
  const locale = useSelector(getIntlLocale);
  const primary =
    new Intl.NumberFormat(locale, {
      minimumSignificantDigits: 1,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
    }).format(string.toString()) || '0';

  const isOriginalTokenSymbol = useIsOriginalTokenSymbol(address, symbol);

  return (
    <TokenListItem
      onClick={onClick ? () => onClick(address) : undefined}
      tokenSymbol={symbol}
      tokenImage={tokenImage}
      primary={primary}
      secondary={isOriginalTokenSymbol ? formattedFiat : null}
      title={title}
      isOriginalTokenSymbol={isOriginalTokenSymbol}
      address={address}
      chainId={chainId}
      showPercentage
    />
  );
}
