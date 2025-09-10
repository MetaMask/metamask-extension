import React from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { TokenListItem } from '../../token-list-item';
import { formatAmount } from '../../../../pages/confirmations/components/simulation-details/formatAmount';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import {
  getMultichainNetworkConfigurationsByChainId,
  getImageForChainId,
} from '../../../../selectors/multichain';
import { selectERC20TokensByChain } from '../../../../selectors/selectors';
import { AssetWithDisplayData, ERC20Asset, NativeAsset } from './types';

type AssetProps = AssetWithDisplayData<NativeAsset | ERC20Asset> & {
  tooltipText?: string;
  assetItemProps?: Pick<
    React.ComponentProps<typeof TokenListItem>,
    'isTitleNetworkName' | 'isTitleHidden' | 'nativeCurrencySymbol'
  >;
  name?: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function Asset({
  address,
  image,
  symbol,
  string: decimalTokenAmount,
  name,
  tooltipText,
  tokenFiatAmount,
  chainId,
  assetItemProps = {},
}: AssetProps) {
  const locale = useSelector(getIntlLocale);

  const currency = useSelector(getCurrentCurrency);
  const allNetworks = useSelector(getMultichainNetworkConfigurationsByChainId);
  const isTokenChainIdInWallet = Boolean(
    chainId ? allNetworks[chainId as keyof typeof allNetworks] : true,
  );

  const cachedTokens = useSelector(selectERC20TokensByChain);

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
  const primaryAmountToUse = tokenFiatAmount
    ? formatCurrency(tokenFiatAmount.toString(), currency, 2)
    : formattedFiat;

  return (
    <TokenListItem
      key={`${chainId}-${symbol}-${address}`}
      chainId={chainId}
      tokenSymbol={symbol}
      tokenImage={
        image ??
        cachedTokens?.[chainId]?.data?.[
          ((address as string) ?? '').toLowerCase()
        ]?.iconUrl
      }
      secondary={isTokenChainIdInWallet ? formattedAmount : undefined}
      primary={isTokenChainIdInWallet ? primaryAmountToUse : undefined}
      title={name ?? symbol}
      tooltipText={tooltipText}
      tokenChainImage={getImageForChainId(chainId)}
      isPrimaryTokenSymbolHidden
      {...assetItemProps}
    />
  );
}
