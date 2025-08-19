import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarTokenSize,
  IconName,
  AvatarToken,
  Text,
  Box,
  ButtonBase,
  AvatarNetworkSize,
  BadgeWrapper,
  AvatarNetwork,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { AssetType } from '../../../../../shared/constants/transaction';
import { AssetPickerModal } from '../asset-picker-modal/asset-picker-modal';
import Tooltip from '../../../ui/tooltip';
import { LARGE_SYMBOL_LENGTH } from '../constants';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ellipsify } from '../../../../pages/confirmations/send-legacy/send.utils';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
  NFT,
} from '../asset-picker-modal/types';
import { TabName } from '../asset-picker-modal/asset-picker-modal-tabs';
import { AssetPickerModalNetwork } from '../asset-picker-modal/asset-picker-modal-network';
import {
  GOERLI_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../../../shared/constants/network';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import {
  getMultichainCurrentChainId,
  getMultichainCurrentNetwork,
  getImageForChainId,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../../selectors/multichain';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { getNftImage } from '../../../../helpers/utils/nfts';
import { BridgeAssetPickerButton } from './bridge-asset-picker-button';

const ELLIPSIFY_LENGTH = 13; // 6 (start) + 4 (end) + 3 (...)

export type AssetPickerProps = {
  asset?:
    | ERC20Asset
    | NativeAsset
    | Pick<NFT, 'type' | 'tokenId' | 'image' | 'symbol' | 'address'>
    | undefined;
  /**
   * Needs to be wrapped in a callback
   */
  onAssetChange: (
    newAsset:
      | AssetWithDisplayData<NativeAsset>
      | AssetWithDisplayData<ERC20Asset>,
  ) => void;
  onClick?: () => void;
  isDisabled?: boolean;
  isMultiselectEnabled?: boolean;
  autoFocus?: boolean;
  networkProps?: Pick<
    React.ComponentProps<typeof AssetPickerModalNetwork>,
    | 'network'
    | 'networks'
    | 'onNetworkChange'
    | 'shouldDisableNetwork'
    | 'header'
  >;
  dataTestId?: string;
} & Pick<
  React.ComponentProps<typeof AssetPickerModal>,
  | 'visibleTabs'
  | 'header'
  | 'sendingAsset'
  | 'action'
  | 'customTokenListGenerator'
  | 'isTokenListLoading'
>;

// A component that lets the user pick from a list of assets.
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function AssetPicker({
  header,
  asset,
  onAssetChange,
  networkProps,
  sendingAsset,
  action,
  onClick,
  isDisabled = false,
  visibleTabs,
  customTokenListGenerator,
  isTokenListLoading = false,
  isMultiselectEnabled = false,
  autoFocus = true,
  dataTestId = 'asset-picker',
}: AssetPickerProps) {
  const t = useI18nContext();

  const [showAssetPickerModal, setShowAssetPickerModal] = useState(false);

  const isNFT = asset?.type === AssetType.NFT;

  // selected asset details
  const primaryTokenImage = asset?.image;
  const symbol = asset?.symbol;

  const isSymbolLong = symbol && symbol.length > LARGE_SYMBOL_LENGTH;
  const formattedSymbol =
    isSymbolLong && !isNFT
      ? `${symbol.substring(0, LARGE_SYMBOL_LENGTH - 1)}...`
      : symbol;

  // Badge details
  const currentChainId = useMultichainSelector(getMultichainCurrentChainId);
  const allNetworks = useSelector(getMultichainNetworkConfigurationsByChainId);
  // These 2 have similar data but different types
  const currentNetworkConfiguration =
    allNetworks[currentChainId as keyof typeof allNetworks];
  const currentNetworkProviderConfig = useMultichainSelector(
    getMultichainCurrentNetwork,
  );
  const selectedNetwork = networkProps?.network ?? currentNetworkConfiguration;

  const allNetworksToUse = networkProps?.networks ?? Object.values(allNetworks);
  const { balanceByChainId } = useMultichainBalances();
  // This is used to determine which tokens to display when isMultiselectEnabled=true
  const [selectedChainIds, setSelectedChainIds] = useState<string[]>(
    isMultiselectEnabled
      ? (allNetworksToUse
          ?.map(({ chainId }) => chainId)
          .sort((a, b) => balanceByChainId[b] - balanceByChainId[a]) ?? [])
      : [],
  );
  const [isSelectingNetwork, setIsSelectingNetwork] = useState(false);

  useEffect(() => {
    const newChainId = networkProps?.network?.chainId;
    newChainId &&
      !selectedChainIds.includes(newChainId) &&
      setSelectedChainIds((c) => [...c, newChainId]);
  }, [networkProps?.network?.chainId]);

  const handleAssetPickerTitle = (): string | undefined => {
    if (isDisabled) {
      return t('swapTokenNotAvailable');
    }

    return undefined;
  };

  const handleButtonClick = () => {
    if (networkProps && !networkProps.network) {
      setIsSelectingNetwork(true);
    } else {
      setShowAssetPickerModal(true);
    }
    onClick?.();
  };

  return (
    <>
      {networkProps && (
        <AssetPickerModalNetwork
          isOpen={isSelectingNetwork}
          onClose={() => setIsSelectingNetwork(false)}
          onBack={() => {
            setIsSelectingNetwork(false);
            setShowAssetPickerModal(true);
          }}
          isMultiselectEnabled={isMultiselectEnabled}
          onMultiselectSubmit={(chainIds: string[]) => {
            setSelectedChainIds(chainIds);
            // If there is only 1 selected network switch to that network to populate tokens
            if (
              chainIds.length === 1 &&
              chainIds[0] !== currentNetworkProviderConfig?.chainId
            ) {
              if (networkProps?.onNetworkChange) {
                networkProps.onNetworkChange(
                  allNetworks[chainIds[0] as keyof typeof allNetworks],
                );
              }
            }
          }}
          selectedChainIds={selectedChainIds}
          {...networkProps}
        />
      )}
      {/* This is the Modal that ask to choose token to send */}
      <AssetPickerModal
        visibleTabs={visibleTabs}
        header={header}
        action={action}
        isOpen={showAssetPickerModal}
        onClose={() => setShowAssetPickerModal(false)}
        asset={asset}
        onAssetChange={(
          token:
            | AssetWithDisplayData<ERC20Asset>
            | AssetWithDisplayData<NativeAsset>,
        ) => {
          // If isMultiselectEnabled=true, update the network when a token is selected
          if (isMultiselectEnabled && networkProps?.onNetworkChange) {
            const networkFromToken = token.chainId
              ? allNetworks[token.chainId as keyof typeof allNetworks]
              : undefined;
            if (networkFromToken) {
              networkProps.onNetworkChange(networkFromToken);
            }
          }
          onAssetChange(token);
          setShowAssetPickerModal(false);
        }}
        isMultiselectEnabled={isMultiselectEnabled}
        sendingAsset={sendingAsset}
        network={networkProps?.network}
        networks={networkProps?.networks}
        selectedChainIds={selectedChainIds}
        onNetworkPickerClick={
          networkProps?.networks
            ? () => {
                setShowAssetPickerModal(false);
                setIsSelectingNetwork(true);
              }
            : undefined
        }
        defaultActiveTabKey={
          asset?.type === AssetType.NFT ? TabName.NFTS : TabName.TOKENS
        }
        customTokenListGenerator={customTokenListGenerator}
        isTokenListLoading={isTokenListLoading}
        autoFocus={autoFocus}
      />

      {/** If the action is swap or bridge, use the BridgeAssetPickerButton as the trigger button instead of the default */}
      {action === 'bridge' || action === 'swap' ? (
        <BridgeAssetPickerButton
          onClick={handleButtonClick}
          asset={asset}
          network={networkProps?.network}
          data-testid={`${dataTestId}-button`}
          action={action}
        />
      ) : (
        <ButtonBase
          data-testid={`${dataTestId}-button`}
          className="asset-picker"
          disabled={isDisabled}
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={2}
          padding={2}
          paddingLeft={2}
          paddingRight={2}
          justifyContent={isNFT ? JustifyContent.spaceBetween : undefined}
          backgroundColor={BackgroundColor.transparent}
          onClick={handleButtonClick}
          endIconName={IconName.ArrowDown}
          endIconProps={{
            color: IconColor.iconDefault,
            marginInlineStart: 0,
            display: isDisabled ? Display.None : Display.InlineBlock,
          }}
          title={handleAssetPickerTitle()}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={3}>
            <Box display={Display.Flex}>
              <BadgeWrapper
                badge={
                  <AvatarNetwork
                    size={AvatarNetworkSize.Xs}
                    name={selectedNetwork?.name ?? ''}
                    src={
                      selectedNetwork?.chainId
                        ? getImageForChainId(selectedNetwork.chainId)
                        : undefined
                    }
                    borderWidth={2}
                    backgroundColor={
                      Object.entries({
                        [GOERLI_DISPLAY_NAME]: BackgroundColor.goerli,
                        [SEPOLIA_DISPLAY_NAME]: BackgroundColor.sepolia,
                      }).find(([tickerSubstring]) =>
                        selectedNetwork?.nativeCurrency?.includes(
                          tickerSubstring,
                        ),
                      )?.[1]
                    }
                    borderColor={
                      primaryTokenImage
                        ? BorderColor.borderMuted
                        : BorderColor.borderDefault
                    }
                  />
                }
              >
                <AvatarToken
                  borderRadius={isNFT ? BorderRadius.LG : BorderRadius.full}
                  src={getNftImage(primaryTokenImage) ?? undefined}
                  size={AvatarTokenSize.Md}
                  name={symbol}
                  {...(isNFT && {
                    backgroundColor: BackgroundColor.transparent,
                  })}
                />
              </BadgeWrapper>
            </Box>

            <Tooltip
              disabled={!isSymbolLong}
              title={symbol}
              position="bottom"
              wrapperClassName="mm-box"
            >
              <Text
                className="asset-picker__symbol"
                variant={TextVariant.bodyMd}
                color={TextColor.textDefault}
              >
                {formattedSymbol}
              </Text>
              {isNFT && asset?.tokenId && (
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  #
                  {String(asset.tokenId).length < ELLIPSIFY_LENGTH
                    ? asset.tokenId
                    : ellipsify(String(asset.tokenId), 6, 4)}
                </Text>
              )}
            </Tooltip>
          </Box>
        </ButtonBase>
      )}
    </>
  );
}
