import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Box } from '../../../../component-library';
import {
  Display,
  AlignItems,
  BorderRadius,
  BorderColor,
  BorderStyle,
  BackgroundColor,
} from '../../../../../helpers/constants/design-system';
import { SwappableCurrencyInput } from '../../../asset-picker-amount/swappable-currency-input';
import { AssetBalance } from '../../../asset-picker-amount/asset-balance';
import MaxClearButton from '../../../asset-picker-amount/max-clear-button';
import { AssetPicker } from '../../../asset-picker-amount/asset-picker';
import type { Amount, Asset } from '../../../../../ducks/send';
import { updateSendAmount } from '../../../../../ducks/multichain-send/multichain-send';

export type MultichainAssetPickerAmountProps = {
  asset: Asset;
  amount: Amount;
  error: string;
};

export const MultichainAssetPickerAmount = ({
  asset,
  amount,
  error,
}: MultichainAssetPickerAmountProps) => {
  const dispatch = useDispatch();
  const [isFocused, setIsFocused] = useState(false);

  // TODO: fix border color based on errors
  const borderColor = BorderColor.borderMuted;

  const onAmountChange = useCallback((sendAmount) => {
    if (sendAmount < 0) {
      return;
    }
    dispatch(updateSendAmount(sendAmount));
  }, []);

  // TODO: fix when there are more than only native assets
  const onAssetChange = (asset) => {};

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
        paddingTop={1}
        paddingBottom={1}
      >
        <AssetPicker asset={asset} onAssetChange={onAssetChange} />
        <SwappableCurrencyInput
          onAmountChange={onAmountChange}
          assetType={asset.type}
          asset={asset}
          amount={amount}
          isAmountLoading={false}
        />
      </Box>
      <Box display={Display.Flex}>
        {/* Only show balance if mutable */}
        <AssetBalance asset={asset} error={error} />
        {/* The fiat value will always leave dust and is often inaccurate anyways */}
        <MaxClearButton asset={asset} />
      </Box>
    </Box>
  );
};
