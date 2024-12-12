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
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../../shared/modules/selectors/networks';
import Tooltip from '../../../ui/tooltip';
import { LARGE_SYMBOL_LENGTH } from '../constants';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { useI18nContext } from '../../../../hooks/useI18nContext';
///: END:ONLY_INCLUDE_IF
import { ellipsify } from '../../../../pages/confirmations/send/send.utils';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
  NFT,
} from '../asset-picker-modal/types';
import { TabName } from '../asset-picker-modal/asset-picker-modal-tabs';
import { AssetPickerModalNetwork } from '../asset-picker-modal/asset-picker-modal-network';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  GOERLI_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../../../shared/constants/network';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';

const ELLIPSIFY_LENGTH = 13; // 6 (start) + 4 (end) + 3 (...)

export type AssetPickerProps = {
  children?: (
    onClick: () => void,
    networkImageSrc?: string,
  ) => React.ReactElement; // Overrides default button
  asset?:
    | ERC20Asset
    | NativeAsset
    | Pick<NFT, 'type' | 'tokenId' | 'image' | 'symbol'>
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
  action?: 'send' | 'receive';
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
} & Pick<
  React.ComponentProps<typeof AssetPickerModal>,
  | 'visibleTabs'
  | 'header'
  | 'sendingAsset'
  | 'customTokenListGenerator'
  | 'isTokenListLoading'
>;

// A component that lets the user pick from a list of assets.
export function AssetPicker({
  children,
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
}: AssetPickerProps) {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const t = useI18nContext();
  ///: END:ONLY_INCLUDE_IF

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
  const currentChainId = useSelector(getCurrentChainId);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const currentNetwork = allNetworks[currentChainId];
  const selectedNetwork =
    networkProps?.network ??
    (currentNetwork?.chainId && allNetworks[currentNetwork.chainId]);

  const allNetworksToUse = networkProps?.networks ?? Object.values(allNetworks);
  const { balanceByChainId } = useMultichainBalances();
  // This is used to determine which tokens to display when isMultiselectEnabled=true
  const [selectedChainIds, setSelectedChainIds] = useState<string[]>(
    isMultiselectEnabled
      ? allNetworksToUse
          ?.map(({ chainId }) => chainId)
          .sort((a, b) => balanceByChainId[b] - balanceByChainId[a]) ?? []
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
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    if (isDisabled) {
      return t('swapTokenNotAvailable');
    }
    ///: END:ONLY_INCLUDE_IF

    return undefined;
  };

  const networkImageSrc =
    selectedNetwork?.chainId &&
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      selectedNetwork.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ];

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
              chainIds[0] !== currentNetwork?.chainId
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
          networkProps
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

      {/** If a child prop is passed in, use it as the trigger button instead of the default */}
      {children?.(handleButtonClick, networkImageSrc) || (
        <ButtonBase
          data-testid="asset-picker-button"
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
                    src={networkImageSrc}
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
                  src={primaryTokenImage ?? undefined}
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
