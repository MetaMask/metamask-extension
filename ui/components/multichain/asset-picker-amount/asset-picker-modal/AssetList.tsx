import React from 'react';
import classnames from 'classnames';
import {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';
import type { CaipChainId } from '@metamask/utils';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { AssetType } from '../../../../../shared/constants/transaction';
import { Box } from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexWrap,
} from '../../../../helpers/constants/design-system';
import { TokenListItem } from '../..';
import LoadingScreen from '../../../ui/loading-screen';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getMultichainCurrentCurrency,
  getMultichainCurrentChainId,
  getImageForChainId,
  getMultichainCurrentNetwork,
  getMultichainNativeCurrency,
  getMultichainSelectedAccountCachedBalance,
} from '../../../../selectors/multichain';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import AssetComponent from './Asset';
import { AssetWithDisplayData, ERC20Asset, NFT, NativeAsset } from './types';

type AssetListProps = {
  handleAssetChange: (
    token: AssetWithDisplayData<ERC20Asset> | AssetWithDisplayData<NativeAsset>,
  ) => void;
  asset?:
    | ERC20Asset
    | NativeAsset
    | Pick<NFT, 'type' | 'tokenId' | 'image' | 'symbol' | 'address'>;
  tokenList: (
    | AssetWithDisplayData<ERC20Asset>
    | AssetWithDisplayData<NativeAsset>
  )[];
  isTokenDisabled?: (
    token: AssetWithDisplayData<ERC20Asset> | AssetWithDisplayData<NativeAsset>,
  ) => boolean;
  network?:
    | NetworkConfiguration
    | AddNetworkFields
    | (Omit<NetworkConfiguration, 'chainId'> & { chainId: CaipChainId });
  isTokenListLoading?: boolean;
  assetItemProps?: Pick<
    React.ComponentProps<typeof TokenListItem>,
    'isTitleNetworkName' | 'isTitleHidden'
  >;
};

export default function AssetList({
  handleAssetChange,
  asset,
  tokenList,
  isTokenDisabled,
  network,
  isTokenListLoading = false,
  assetItemProps = {},
}: AssetListProps) {
  const t = useI18nContext();

  const currentNetwork = useMultichainSelector(getMultichainCurrentNetwork);
  // If a network is provided, display tokens in that network
  // Otherwise, assume tokens in the current network are displayed
  const networkToUse = network ?? currentNetwork;
  // This indicates whether tokens in the wallet's active network are displayed
  const isSelectedNetworkActive =
    networkToUse.chainId === currentNetwork.chainId;

  const chainId = useMultichainSelector(getMultichainCurrentChainId);
  const nativeCurrency = useMultichainSelector(getMultichainNativeCurrency);
  const balanceValue = useMultichainSelector(
    getMultichainSelectedAccountCachedBalance,
  );
  const currentCurrency = useMultichainSelector(getMultichainCurrentCurrency);

  const [primaryCurrencyValue] = useCurrencyDisplay(balanceValue, {
    currency: currentCurrency,
    hideLabel: true,
  });

  const [secondaryCurrencyValue] = useCurrencyDisplay(balanceValue, {
    currency: nativeCurrency,
  });

  return (
    <Box className="tokens-main-view-modal">
      {isTokenListLoading && (
        <LoadingScreen
          loadingMessage={t('loadingTokenList')}
          showLoadingSpinner
        />
      )}
      {tokenList.map((token) => {
        const tokenAddress = token.address?.toLowerCase();

        const isMatchingChainId = token.chainId === networkToUse?.chainId;
        const isMatchingAddress =
          // the native asset can have an undefined, null, '', or zero address so compare symbols
          (token.type === AssetType.native && token.symbol === asset?.symbol) ||
          tokenAddress === asset?.address?.toLowerCase();
        const isSelected = isMatchingChainId && isMatchingAddress;

        const isDisabled = isTokenDisabled?.(token) ?? false;

        return (
          <Box
            padding={0}
            gap={0}
            margin={0}
            key={`${token.symbol}-${tokenAddress ?? ''}-${token.chainId}`}
            backgroundColor={
              isSelected
                ? BackgroundColor.primaryMuted
                : BackgroundColor.transparent
            }
            className={classnames('multichain-asset-picker-list-item', {
              'multichain-asset-picker-list-item--selected': isSelected,
              'multichain-asset-picker-list-item--disabled': isDisabled,
            })}
            data-testid="asset-list-item"
            onClick={() => {
              if (isDisabled) {
                return;
              }
              handleAssetChange(token);
            }}
          >
            {isSelected ? (
              <Box
                className="multichain-asset-picker-list-item__selected-indicator"
                borderRadius={BorderRadius.pill}
                backgroundColor={BackgroundColor.primaryDefault}
              />
            ) : null}
            <Box
              key={token.address}
              padding={0}
              display={Display.Block}
              flexWrap={FlexWrap.NoWrap}
              alignItems={AlignItems.center}
            >
              <Box>
                {token.type === AssetType.native &&
                token.chainId === chainId &&
                isSelectedNetworkActive ? (
                  // Only use this component for the native token of the active network
                  <TokenListItem
                    chainId={token.chainId}
                    title={token.symbol}
                    primary={primaryCurrencyValue}
                    tokenSymbol={token.symbol}
                    secondary={secondaryCurrencyValue}
                    tokenImage={token.image}
                    isPrimaryTokenSymbolHidden
                    tokenChainImage={getImageForChainId(token.chainId)}
                    {...assetItemProps}
                  />
                ) : (
                  <AssetComponent
                    {...token}
                    tooltipText={
                      isDisabled ? 'swapTokenNotAvailable' : undefined
                    }
                    assetItemProps={assetItemProps}
                  />
                )}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
