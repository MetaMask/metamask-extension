import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { NetworkConfiguration } from '@metamask/network-controller';
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import {
  getCurrentCurrency,
  getSelectedAccountCachedBalance,
} from '../../../../selectors';
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';
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
import AssetComponent from './Asset';
import { AssetWithDisplayData, ERC20Asset, NativeAsset } from './types';

type AssetListProps = {
  handleAssetChange: (
    token: AssetWithDisplayData<ERC20Asset> | AssetWithDisplayData<NativeAsset>,
  ) => void;
  asset?: ERC20Asset | NativeAsset;
  tokenList: (
    | AssetWithDisplayData<ERC20Asset>
    | AssetWithDisplayData<NativeAsset>
  )[];
  isTokenDisabled?: (
    token: AssetWithDisplayData<ERC20Asset> | AssetWithDisplayData<NativeAsset>,
  ) => boolean;
  network?: NetworkConfiguration;
  isTokenListLoading?: boolean;
};

export default function AssetList({
  handleAssetChange,
  asset,
  tokenList,
  isTokenDisabled,
  network,
  isTokenListLoading = false,
}: AssetListProps) {
  const t = useI18nContext();
  const selectedToken = asset?.address;

  const chainId = useSelector(getCurrentChainId);
  const nativeCurrency = useSelector(getNativeCurrency);
  const balanceValue = useSelector(getSelectedAccountCachedBalance);
  const currentCurrency = useSelector(getCurrentCurrency);

  const isSelectedNetworkActive =
    !network?.chainId || chainId === network?.chainId;

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
        const isSelected = tokenAddress === selectedToken?.toLowerCase();
        const isDisabled = isTokenDisabled?.(token) ?? false;

        return (
          <Box
            padding={0}
            gap={0}
            margin={0}
            key={`${token.symbol}-${tokenAddress ?? ''}`}
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
              <Box marginInlineStart={2}>
                {token.type === AssetType.native ? (
                  <TokenListItem
                    chainId={chainId}
                    title={token.symbol}
                    primary={
                      isSelectedNetworkActive ? primaryCurrencyValue : undefined
                    }
                    tokenSymbol={token.symbol}
                    secondary={
                      isSelectedNetworkActive
                        ? secondaryCurrencyValue
                        : undefined
                    }
                    tokenImage={token.image}
                    isPrimaryTokenSymbolHidden
                  />
                ) : (
                  <AssetComponent
                    key={token.address}
                    {...token}
                    tooltipText={
                      isDisabled ? 'swapTokenNotAvailable' : undefined
                    }
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
