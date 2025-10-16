import React from 'react';
import { useSelector } from 'react-redux';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { TokenListItem } from '../../token-list-item';
import { useFormatters } from '../../../../hooks/useFormatters';
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
  isDestinationToken?: boolean;
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
  isDestinationToken = false,
}: AssetProps) {
  const { formatCurrency, formatTokenQuantity } = useFormatters();

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
    ? `${formatTokenQuantity(Number(decimalTokenAmount), symbol)}`
    : undefined;
  const primaryAmountToUse = tokenFiatAmount
    ? formatCurrency(tokenFiatAmount, currency)
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
      isDestinationToken={isDestinationToken}
      address={address}
      {...assetItemProps}
    />
  );
}
