import React from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { getCurrentCurrency, getTokenList } from '../../../../selectors';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { TokenListItem } from '../../token-list-item';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { formatAmount } from '../../../../pages/confirmations/components/simulation-details/formatAmount';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import { AssetWithDisplayData, ERC20Asset, NativeAsset } from './types';

type AssetProps = AssetWithDisplayData<NativeAsset | ERC20Asset> & {
  tooltipText?: string;
};

export default function Asset({
  address,
  image,
  symbol,
  string: decimalTokenAmount,
  tooltipText,
  tokenFiatAmount,
  chainId,
}: AssetProps) {
  const locale = useSelector(getIntlLocale);

  const currency = useSelector(getCurrentCurrency);
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
        new BigNumber(decimalTokenAmount.toString(), 10),
      )} ${symbol}`
    : undefined;

  return (
    <TokenListItem
      key={`${chainId}-${symbol}-${address}`}
      chainId={chainId}
      tokenSymbol={symbol}
      tokenImage={tokenImage}
      secondary={formattedAmount}
      primary={
        tokenFiatAmount
          ? formatCurrency(tokenFiatAmount.toString(), currency, 2)
          : formattedFiat
      }
      title={title}
      tooltipText={tooltipText}
      tokenChainImage={
        CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
          chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
        ]
      }
      isPrimaryTokenSymbolHidden
    />
  );
}
