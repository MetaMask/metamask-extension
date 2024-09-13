import React, { useCallback, useContext } from 'react';
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
import { AssetPicker } from '../../../asset-picker-amount/asset-picker';
import type { Amount } from '../../../../../ducks/send';
import {
  estimateFee,
  updateSendAmount,
  validateAmountField,
} from '../../../../../ducks/multichain-send/multichain-send';
import {
  AssetWithDisplayData,
  NativeAsset,
} from '../../../asset-picker-amount/asset-picker-modal/types';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  getCurrentMultichainDraftTransaction,
  getCurrentMultichainDraftTransactionId,
} from '../../../../../selectors/multichain';
import { getSelectedInternalAccount } from '../../../../../selectors';
import { decimalToHex } from '../../../../../../shared/modules/conversion.utils';
import { MultichainMaxClearButton } from './max-clear-button';

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
  const currentDraftTransaction = useSelector(
    getCurrentMultichainDraftTransaction,
  );

  const borderColor = amount.error
    ? BorderColor.errorDefault
    : BorderColor.borderMuted;

  const onAmountChange = useCallback(async (sendAmount) => {
    dispatch(updateSendAmount(sendAmount));
    await dispatch(
      estimateFee({
        account: selectedAccount,
        transactionId: currentTransactionId,
      }),
    );
    dispatch(validateAmountField());
  }, []);

  // TODO: fix when there are more than only native assets
  const onAssetChange = (
    // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-unused-vars
    newAsset: AssetWithDisplayData<NativeAsset>,
  ) => {
    // TODO: implement when there are more than only native assets
  };

  return (
    <Box className="asset-picker-amount">
      <Box
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
          // @ts-expect-error only native assets are supported for multichain
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
        {currentDraftTransaction && (
          <MultichainMaxClearButton
            draftTransaction={currentDraftTransaction}
          />
        )}
      </Box>
    </Box>
  );
};
