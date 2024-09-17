import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TokenListMap } from '@metamask/assets-controllers';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box, Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  getIpfsGateway,
  getNativeCurrencyImage,
  getSelectedInternalAccount,
  getTokenList,
} from '../../../selectors';

import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import {
  getCurrentDraftTransaction,
  getIsNativeSendPossible,
  getSendMaxModeState,
  type Amount,
  type Asset,
} from '../../../ducks/send';
import { NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR } from '../../../pages/confirmations/send/send.constants';
import { getAssetImageURL } from '../../../helpers/utils/util';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import MaxClearButton from './max-clear-button';
import {
  AssetPicker,
  type AssetPickerProps,
} from './asset-picker/asset-picker';
import { SwappableCurrencyInput } from './swappable-currency-input/swappable-currency-input';
import { AssetBalance } from './asset-balance/asset-balance';

type AssetPickerAmountProps = OverridingUnion<
  AssetPickerProps,
  {
    // all of these props should be explicitly received
    asset: Asset;
    amount: Amount;
    isAmountLoading?: boolean;
    error?: string;
    /**
     * Callback for when the amount changes; disables the input when undefined
     */
    onAmountChange?: (
      newAmountRaw: string,
      newAmountFormatted?: string,
    ) => void;
  }
>;

// A component that combines an asset picker with an input for the amount to send.
export const AssetPickerAmount = ({
  asset,
  amount,
  onAmountChange,
  isAmountLoading,
  error: passedError,
  ...assetPickerProps
}: AssetPickerAmountProps) => {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const t = useI18nContext();

  const { swapQuotesError, sendAsset, receiveAsset } = useSelector(
    getCurrentDraftTransaction,
  );
  const isDisabled = !onAmountChange;
  const isSwapsErrorShown = isDisabled && swapQuotesError;

  const isMaxMode = useSelector(getSendMaxModeState);
  const isNativeSendPossible = useSelector(getIsNativeSendPossible);

  const nativeCurrencySymbol = useSelector(getNativeCurrency);
  const nativeCurrencyImageUrl = useSelector(getNativeCurrencyImage);
  const tokenList = useSelector(getTokenList) as TokenListMap;

  const ipfsGateway = useSelector(getIpfsGateway);

  useEffect(() => {
    // if this input is immutable – avoids double fire
    if (isDisabled) {
      return;
    }

    // if native send is not possible
    if (isNativeSendPossible) {
      return;
    }

    // if max mode already enabled
    if (!isMaxMode) {
      return;
    }

    // disable max mode and replace with "0"
    onAmountChange('0x0');
  }, [isNativeSendPossible]);

  const [isFocused, setIsFocused] = useState(false);
  const [isNFTInputChanged, setIsTokenInputChanged] = useState(false);

  const handleChange = useCallback(
    (newAmountRaw, newAmountFormatted) => {
      if (!isNFTInputChanged && asset.type === AssetType.NFT) {
        setIsTokenInputChanged(true);
      }
      onAmountChange?.(newAmountRaw, newAmountFormatted);
    },
    [onAmountChange, isNFTInputChanged, asset.type],
  );

  useEffect(() => {
    setIsTokenInputChanged(false);
  }, [asset]);

  const { error: rawError } = amount;

  // if input hasn't been touched, don't show the zero amount error
  const isLowBalanceErrorInvalid =
    rawError === NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR &&
    asset.type === AssetType.NFT &&
    !isNFTInputChanged;

  const error = rawError && !isLowBalanceErrorInvalid ? rawError : undefined;

  useEffect(() => {
    if (!asset) {
      throw new Error('No asset is drafted for sending');
    }
  }, [selectedAccount]);

  let borderColor = BorderColor.borderMuted;

  if (isDisabled) {
    // if disabled, do not show source-side border colors
    if (isSwapsErrorShown) {
      borderColor = BorderColor.errorDefault;
    }
  } else if (error) {
    borderColor = BorderColor.errorDefault;
  } else if (isFocused) {
    borderColor = BorderColor.primaryDefault;
  }

  const isSwapAndSendFromNative =
    sendAsset.type === AssetType.native &&
    receiveAsset.type !== AssetType.native;

  let standardizedAsset;
  if (asset?.type === AssetType.native) {
    standardizedAsset = {
      type: asset.type,
      image: nativeCurrencyImageUrl,
      symbol: nativeCurrencySymbol as string,
    };
  } else if (asset?.type === AssetType.token && asset?.details?.symbol) {
    standardizedAsset = {
      type: asset.type,
      image:
        getAssetImageURL(asset.details.image, ipfsGateway) ||
        (tokenList &&
          asset.details?.address &&
          tokenList[asset.details.address.toLowerCase()]?.iconUrl),
      symbol: asset.details.symbol,
      address: asset.details.address,
    };
  } else if (
    asset?.type === AssetType.NFT &&
    asset?.details?.tokenId !== undefined &&
    asset?.details?.image
  ) {
    standardizedAsset = {
      type: asset.type as AssetType.NFT,
      tokenId: asset.details.tokenId,
      image: asset.details.image,
      symbol: asset.details.symbol,
    };
  }

  return (
    <Box className="asset-picker-amount">
      <Box
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        display={Display.Flex}
        alignItems={AlignItems.center}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.LG}
        borderColor={borderColor}
        borderStyle={BorderStyle.solid}
        borderWidth={1}
        marginBottom={1}
        padding={1}
        // apply extra padding if there isn't an input component to apply it
        paddingTop={asset.details?.standard === TokenStandard.ERC721 ? 4 : 1}
        paddingBottom={asset.details?.standard === TokenStandard.ERC721 ? 4 : 1}
      >
        <AssetPicker asset={standardizedAsset} {...assetPickerProps} />
        <SwappableCurrencyInput
          onAmountChange={onAmountChange ? handleChange : undefined}
          assetType={asset.type}
          asset={asset}
          amount={amount}
          isAmountLoading={isAmountLoading}
        />
      </Box>
      <Box display={Display.Flex}>
        {/* Only show balance if mutable */}
        {onAmountChange && (
          <AssetBalance asset={asset} error={passedError || error} />
        )}
        {isSwapsErrorShown && (
          <Text variant={TextVariant.bodySm} color={TextColor.errorDefault}>
            {t(swapQuotesError)}
          </Text>
        )}
        {/* The fiat value will always leave dust and is often inaccurate anyways */}
        {onAmountChange && isNativeSendPossible && !isSwapAndSendFromNative && (
          <MaxClearButton asset={asset} />
        )}
      </Box>
    </Box>
  );
};
