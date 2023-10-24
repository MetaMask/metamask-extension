import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Label,
  Text,
} from '../../component-library';
import {
  BorderRadius,
  IconColor,
} from '../../../helpers/constants/design-system';

import { AssetType } from '../../../../shared/constants/transaction';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { getNativeCurrencyImage, getTokenList } from '../../../selectors';
import UserPreferencedCurrencyInput from '../../app/user-preferenced-currency-input/user-preferenced-currency-input.container';
import UserPreferencedTokenInput from '../../app/user-preferenced-token-input/user-preferenced-token-input.component';
import {
  getCurrentDraftTransaction,
  getSendAmount,
  getSendAsset,
  sendAmountIsInError,
  updateSendAmount,
} from '../../../ducks/send';
import { Numeric } from '../../../../shared/modules/Numeric';
import { useI18nContext } from '../../../hooks/useI18nContext';
import AssetPicker from './asset-picker/asset-picker';
import MaxClearButton from './max-clear-button/max-clear-button';

// A component that combines an asset picker with an input for the amount to send.
// Work in progress.
export default function AssetPickerAmount() {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const asset = useSelector(getSendAsset);
  const amount = useSelector(getSendAmount);
  const inError = useSelector(sendAmountIsInError);
  const transaction = useSelector(getCurrentDraftTransaction);
  const nativeCurrency = useSelector(getNativeCurrency);
  const nativeCurrencyImage = useSelector(getNativeCurrencyImage);
  const tokenList = useSelector(getTokenList);

  let balance = new Numeric(transaction.asset.balance, 16).toBase(10);
  if (asset.type === AssetType.native) {
    balance = balance.applyConversionRate(1 / Math.pow(10, 18));
  }

  // TODO: Handle really long symbols in the UI
  const symbol =
    asset.type === AssetType.native ? nativeCurrency : asset.details?.symbol;

  const image =
    asset.type === AssetType.native
      ? nativeCurrencyImage
      : asset.details.image ??
        tokenList?.[asset.details.address.toLowerCase()]?.iconUrl;

  return (
    // TODO: Error state when insufficient funds
    <Box className="asset-picker-amount">
      <Label className="asset-picker-amount__amount">{t('amount')}</Label>
      <MaxClearButton />
      <Box className="asset-picker-amount__box" borderRadius={BorderRadius.LG}>
        <AssetPicker asset={{ symbol, image }} />

        {/* TODO: See if the native and token inputs can be merged into 1 component */}
        {asset.type === AssetType.native ? (
          <UserPreferencedCurrencyInput
            onChange={(newAmount) => dispatch(updateSendAmount(newAmount))}
            hexValue={amount}
            error={inError}
            className="asset-picker-amount__input"
            swapIcon={(onClick) => (
              <Icon
                className="asset-picker-amount__swap-icon"
                name={IconName.SwapVertical}
                size={IconSize.Sm}
                color={IconColor.primaryDefault}
                onClick={onClick}
              />
            )}
          />
        ) : (
          <UserPreferencedTokenInput
            error={inError}
            onChange={(newAmount) => dispatch(updateSendAmount(newAmount))}
            token={asset.details}
            value={amount}
            className="asset-picker-amount__input"
            // TODO: Consider supporting swapping currencies for tokens so you can
            // type fiat values. (But only when a conversion rate is available)
          />
        )}
      </Box>
      <Text className="asset-picker-amount__balance">
        {/* TODO: Consider rounding the balance so its not super long? */}
        {t('balance')}: {balance.toString()} {symbol}
      </Text>
    </Box>
  );
}
