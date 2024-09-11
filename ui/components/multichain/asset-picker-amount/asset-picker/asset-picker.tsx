import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarTokenSize,
  IconName,
  AvatarToken,
  Text,
  Box,
  Button,
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
  getCurrentNetwork,
  getTestNetworkBackgroundColor,
} from '../../../../selectors';
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

const ELLIPSIFY_LENGTH = 13; // 6 (start) + 4 (end) + 3 (...)

export type AssetPickerProps = {
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
} & Pick<
  React.ComponentProps<typeof AssetPickerModal>,
  'visibleTabs' | 'header' | 'sendingAsset'
>;

// A component that lets the user pick from a list of assets.
export function AssetPicker({
  header,
  asset,
  onAssetChange,
  sendingAsset,
  onClick,
  isDisabled = false,
  visibleTabs,
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
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  const handleAssetPickerTitle = (): string | undefined => {
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    if (isDisabled) {
      return t('swapTokenNotAvailable');
    }
    ///: END:ONLY_INCLUDE_IF

    return undefined;
  };

  return (
    <>
      {/* This is the Modal that ask to choose token to send */}
      <AssetPickerModal
        visibleTabs={visibleTabs}
        header={header}
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
        defaultActiveTabKey={
          asset?.type === AssetType.NFT ? TabName.NFTS : TabName.TOKENS
        }
      />

      <Button
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
        onClick={() => {
          setShowAssetPickerModal(true);
          onClick?.();
        }}
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
                  name={currentNetwork?.nickname ?? ''}
                  src={currentNetwork?.rpcPrefs?.imageUrl}
                  backgroundColor={testNetworkBackgroundColor}
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
                {...(isNFT && { backgroundColor: BackgroundColor.transparent })}
              />
            </BadgeWrapper>
          </Box>

          <Tooltip disabled={!isSymbolLong} title={symbol} position="bottom">
            <Text className="asset-picker__symbol" variant={TextVariant.bodyMd}>
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
      </Button>
    </>
  );
}
