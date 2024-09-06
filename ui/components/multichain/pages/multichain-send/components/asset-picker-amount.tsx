import React, { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import type { Amount } from '../../../../../ducks/send';
import {
  estimateFee,
  updateSendAmount,
} from '../../../../../ducks/multichain-send/multichain-send';
import { NativeAsset } from '../../../asset-picker-amount/asset-picker-modal/types';
import { I18nContext } from '../../../../../contexts/i18n';
import { getCurrentMultichainDraftTransactionId } from '../../../../../selectors/multichain';
import { getSelectedInternalAccount } from '../../../../../selectors';
import { decimalToHex } from '../../../../../../shared/modules/conversion.utils';

export type MultichainAssetPickerAmountProps = {
  asset: NativeAsset & { balance: string };
  amount: Amount;
  error: string;
};

export const MultichainAssetPickerAmount = ({
  asset,
  amount,
  error,
}: MultichainAssetPickerAmountProps) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const currentTransactionId = useSelector(
    getCurrentMultichainDraftTransactionId,
  );
  const [isFocused, setIsFocused] = useState(false);

  // TODO: fix border color based on errors
  const borderColor = BorderColor.borderMuted;

  const onAmountChange = useCallback(async (sendAmount) => {
    dispatch(updateSendAmount(sendAmount));
    await dispatch(
      estimateFee({
        account: selectedAccount,
        transactionId: currentTransactionId,
      }),
    );
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
        <AssetPicker
          header={t('sendSelectSendAsset')}
          asset={asset}
          onAssetChange={onAssetChange}
          sendingAsset={asset}
        />
        <SwappableCurrencyInput
          onAmountChange={async (e) => await onAmountChange(e)}
          assetType={asset.type}
          asset={asset}
          amount={{
            ...amount,
            value: decimalToHex(amount.value),
          }}
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
