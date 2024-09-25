import React, { useContext, useState } from 'react';
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
import { Asset, getSendAnalyticProperties } from '../../../../ducks/send';
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
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';
import {
  getCurrentNetwork,
  getIpfsGateway,
  getNativeCurrencyImage,
  getTestNetworkBackgroundColor,
  getTokenList,
} from '../../../../selectors';
import Tooltip from '../../../ui/tooltip';
import { LARGE_SYMBOL_LENGTH } from '../constants';
import { getAssetImageURL } from '../../../../helpers/utils/util';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { useI18nContext } from '../../../../hooks/useI18nContext';
///: END:ONLY_INCLUDE_IF

import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { ellipsify } from '../../../../pages/confirmations/send/send.utils';

const ELLIPSIFY_LENGTH = 13; // 6 (start) + 4 (end) + 3 (...)

export type AssetPickerProps = {
  asset: Asset;
  /**
   * Needs to be wrapped in a callback
   */
  onAssetChange: (newAsset: Asset) => void;
  /**
   * Sending asset for UI treatments; only for dest component
   */
  sendingAsset?: Asset;
  isDisabled?: boolean;
};

// A component that lets the user pick from a list of assets.
export function AssetPicker({
  asset,
  onAssetChange,
  sendingAsset,
  isDisabled = false,
}: AssetPickerProps) {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const t = useI18nContext();
  ///: END:ONLY_INCLUDE_IF
  const trackEvent = useContext(MetaMetricsContext);
  const sendAnalytics = useSelector(getSendAnalyticProperties);

  const nativeCurrencySymbol = useSelector(getNativeCurrency);
  const nativeCurrencyImageUrl = useSelector(getNativeCurrencyImage);
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenList: Record<string, any> = useSelector(getTokenList);

  const ipfsGateway = useSelector(getIpfsGateway);

  const [showAssetPickerModal, setShowAssetPickerModal] = useState(false);

  let primaryTokenImage: string | undefined;

  if (asset.type === AssetType.native) {
    primaryTokenImage = nativeCurrencyImageUrl;
  } else if (tokenList && asset.details) {
    primaryTokenImage =
      getAssetImageURL(asset.details?.image, ipfsGateway) ||
      tokenList[asset.details.address?.toLowerCase()]?.iconUrl;
  }

  let sendingTokenImage: string | undefined;

  if (sendingAsset) {
    if (sendingAsset.type === AssetType.native) {
      sendingTokenImage = nativeCurrencyImageUrl;
    } else if (tokenList && sendingAsset.details) {
      sendingTokenImage =
        getAssetImageURL(sendingAsset.details?.image, ipfsGateway) ||
        tokenList[sendingAsset.details.address?.toLowerCase()]?.iconUrl;
    }
  }

  const symbol =
    asset.type === AssetType.native
      ? nativeCurrencySymbol
      : asset.details?.symbol;

  const isSymbolLong = symbol?.length > LARGE_SYMBOL_LENGTH;
  const isNFT = asset.type === AssetType.NFT;

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
        isOpen={showAssetPickerModal}
        onClose={() => setShowAssetPickerModal(false)}
        asset={asset}
        onAssetChange={onAssetChange}
        sendingAssetImage={sendingTokenImage}
        sendingAssetSymbol={
          sendingAsset?.details?.symbol || nativeCurrencySymbol
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
          trackEvent(
            {
              event: MetaMetricsEventName.sendTokenModalOpened,
              category: MetaMetricsEventCategory.Send,
              properties: {
                is_destination_asset_picker_modal: Boolean(sendingAsset),
              },
              sensitiveProperties: {
                ...sendAnalytics,
              },
            },
            { excludeMetaMetricsId: false },
          );
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
                src={primaryTokenImage}
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
            {asset.details?.tokenId && (
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                #
                {String(asset.details.tokenId).length < ELLIPSIFY_LENGTH
                  ? asset.details.tokenId
                  : ellipsify(String(asset.details.tokenId), 6, 4)}
              </Text>
            )}
          </Tooltip>
        </Box>
      </Button>
    </>
  );
}
