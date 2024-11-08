import React, { useState } from 'react';
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
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { getCurrentNetwork } from '../../../../selectors';
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
  networkProps?: Pick<
    React.ComponentProps<typeof AssetPickerModalNetwork>,
    'network' | 'networks' | 'onNetworkChange' | 'shouldDisableNetwork'
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
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const selectedNetwork =
    networkProps?.network ??
    (currentNetwork?.chainId && allNetworks[currentNetwork.chainId]);

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

  const [isSelectingNetwork, setIsSelectingNetwork] = useState(false);

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
          onClose={() => {
            setIsSelectingNetwork(false);
          }}
          onBack={() => {
            setIsSelectingNetwork(false);
            setShowAssetPickerModal(true);
          }}
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
          onAssetChange(token);
          setShowAssetPickerModal(false);
        }}
        sendingAsset={sendingAsset}
        network={networkProps?.network ? networkProps.network : undefined}
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
      />

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
