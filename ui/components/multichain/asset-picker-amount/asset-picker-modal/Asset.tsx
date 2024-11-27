import React from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import { getTokenList } from '../../../../selectors';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { TokenListItem } from '../../token-list-item';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { formatAmount } from '../../../../pages/confirmations/components/simulation-details/formatAmount';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { AssetWithDisplayData, ERC20Asset } from './types';

type AssetProps = AssetWithDisplayData<ERC20Asset> & {
  tooltipText?: string;
};

export default function Asset({
  address,
  image,
  symbol,
  string: decimalTokenAmount,
  tooltipText,
}: AssetProps) {
  const locale = useSelector(getIntlLocale);

  const chainId = useSelector(getCurrentChainId);
  const tokenList = useSelector(getTokenList);
  const tokenData = address
    ? Object.values(tokenList).find(
        (token) =>
          isEqualCaseInsensitive(token.symbol, symbol) &&
          isEqualCaseInsensitive(token.address, address),
      )
    : undefined;

  const title = tokenData?.name || symbol;
  const tokenImage = tokenData?.iconUrl || image;
  const formattedFiat = useTokenFiatAmount(
    address ?? undefined,
    decimalTokenAmount,
    symbol,
    {},
    true,
  );
  const formattedAmount = decimalTokenAmount
    ? `${formatAmount(
        locale,
        new BigNumber(decimalTokenAmount || '0', 10),
      )} ${symbol}`
    : undefined;

  return (
    <TokenListItem
      chainId={chainId}
      tokenSymbol={symbol}
      tokenImage={tokenImage}
      secondary={formattedAmount}
      primary={formattedFiat}
      title={title}
      tooltipText={tooltipText}
      isPrimaryTokenSymbolHidden
    />
  );
}
