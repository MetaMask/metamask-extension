import React, { useMemo, memo } from 'react';
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
function Asset({
  address,
  image,
  symbol,
  string: decimalTokenAmount,
  name,
  tooltipText,
  tokenFiatAmount,
  chainId,
  accountType,
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

  const formattedAmount = useMemo(
    () =>
      decimalTokenAmount
        ? `${formatTokenQuantity(Number(decimalTokenAmount), symbol)}`
        : undefined,
    [decimalTokenAmount, formatTokenQuantity, symbol],
  );

  const primaryAmountToUse = useMemo(
    () =>
      tokenFiatAmount
        ? formatCurrency(tokenFiatAmount, currency)
        : formattedFiat,
    [tokenFiatAmount, formatCurrency, currency, formattedFiat],
  );

  const tokenImage = useMemo(
    () =>
      image ??
      cachedTokens?.[chainId]?.data?.[((address as string) ?? '').toLowerCase()]
        ?.iconUrl,
    [image, cachedTokens, chainId, address],
  );

  const tokenChainImage = useMemo(() => getImageForChainId(chainId), [chainId]);

  return (
    <TokenListItem
      key={`${chainId}-${symbol}-${address}`}
      chainId={chainId}
      tokenSymbol={symbol}
      tokenImage={tokenImage}
      secondary={isTokenChainIdInWallet ? formattedAmount : undefined}
      primary={isTokenChainIdInWallet ? primaryAmountToUse : undefined}
      title={name ?? symbol}
      tooltipText={tooltipText}
      tokenChainImage={tokenChainImage}
      isDestinationToken={isDestinationToken}
      address={address}
      accountType={accountType}
      {...assetItemProps}
    />
  );
}

export default memo(Asset);
