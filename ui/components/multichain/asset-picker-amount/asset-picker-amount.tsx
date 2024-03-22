import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Label } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getSelectedInternalAccount } from '../../../selectors';

import { TokenStandard } from '../../../../shared/constants/transaction';
import type { Amount, Asset } from '../../../ducks/send';
import { useI18nContext } from '../../../hooks/useI18nContext';
import MaxClearButton from './max-clear-button';
import {
  AssetPicker,
  type AssetPickerProps,
} from './asset-picker/asset-picker';
import { SwappableCurrencyInput } from './swappable-currency-input/swappable-currency-input';
import { AssetBalance } from './asset-balance/asset-balance';
import { getIsFiatPrimary } from './utils';

type AssetPickerAmountProps = OverridingUnion<
  AssetPickerProps,
  {
    // all of these props should be explicitly received
    asset: Asset;
    amount: Amount;
    onAmountChange: (newAmount: string) => void;
  }
>;

// A component that combines an asset picker with an input for the amount to send.
export const AssetPickerAmount = ({
  asset,
  amount,
  onAmountChange,
  ...assetPickerProps
}: AssetPickerAmountProps) => {
  const t = useI18nContext();

  const selectedAccount = useSelector(getSelectedInternalAccount);

  const isFiatPrimary = useSelector(getIsFiatPrimary);

  const [isFocused, setIsFocused] = useState(false);

  const { error } = amount;

  useEffect(() => {
    if (!asset) {
      throw new Error('No asset is drafted for sending');
    }
  }, [selectedAccount]);

  let borderColor = BorderColor.borderDefault;

  if (amount.error) {
    borderColor = BorderColor.errorDefault;
  } else if (isFocused) {
    borderColor = BorderColor.primaryDefault;
  }

  return (
    <Box className="asset-picker-amount">
      <Box display={Display.Flex}>
        <Label variant={TextVariant.bodyMdMedium}>{t('amount')}</Label>
        {/* The fiat value will always leave dust and is often inaccurate anyways */}
        {!isFiatPrimary && <MaxClearButton asset={asset} />}
      </Box>
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
        marginTop={1}
        marginBottom={1}
        padding={1}
        // apply extra padding if there isn't an input component to apply it
        paddingTop={asset.details?.standard === TokenStandard.ERC721 ? 4 : 1}
        paddingBottom={asset.details?.standard === TokenStandard.ERC721 ? 4 : 1}
      >
        <AssetPicker asset={asset} {...assetPickerProps} />
        <SwappableCurrencyInput
          onAmountChange={onAmountChange}
          assetType={asset.type}
          asset={asset}
          amount={amount}
        />
      </Box>
      <AssetBalance asset={asset} error={error} />
    </Box>
  );
};
