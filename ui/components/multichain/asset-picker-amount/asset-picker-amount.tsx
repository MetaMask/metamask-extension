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
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';

import { AssetType } from '../../../../shared/constants/transaction';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import UserPreferencedCurrencyInput from '../../app/user-preferenced-currency-input/user-preferenced-currency-input.container';
import UserPreferencedTokenInput from '../../app/user-preferenced-token-input/user-preferenced-token-input.component';
import {
  getCurrentDraftTransaction,
  updateSendAmount,
} from '../../../ducks/send';
import { Numeric } from '../../../../shared/modules/Numeric';
import { useI18nContext } from '../../../hooks/useI18nContext';
import AssetPicker from './asset-picker/asset-picker';
import MaxClearButton from './max-clear-button';

// A component that combines an asset picker with an input for the amount to send.
// Work in progress.
export const AssetPickerAmount = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { asset, amount } = useSelector(getCurrentDraftTransaction);
  const nativeCurrency = useSelector(getNativeCurrency);

  if (!asset) {
    throw new Error('No asset is drafted for sending');
  }

  let balance = new Numeric(asset.balance, 16).toBase(10);
  if (asset.type === AssetType.native) {
    balance = balance.applyConversionRate(1 / Math.pow(10, 18));
  }

  // TODO: Handle long symbols in the UI
  const symbol =
    asset.type === AssetType.native ? nativeCurrency : asset.details?.symbol;

  return (
    <Box className="asset-picker-amount">
      <Box display={Display.Flex}>
        <Label>{t('amount')}</Label>
        <MaxClearButton />
      </Box>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        backgroundColor={BackgroundColor.backgroundDefault}
        paddingLeft={3}
        paddingRight={3}
        borderRadius={BorderRadius.LG}
        borderColor={
          amount.error ? BorderColor.errorDefault : BorderColor.primaryDefault
        }
        borderStyle={BorderStyle.solid}
        borderWidth={2}
      >
        <AssetPicker asset={asset} />

        {asset.type === AssetType.native ? (
          <UserPreferencedCurrencyInput
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: I'm not sure why the types don't find `onChange`
            onChange={(newAmount: string) =>
              dispatch(updateSendAmount(newAmount))
            }
            hexValue={amount.value}
            className="asset-picker-amount__input"
            swapIcon={(onClick: React.MouseEventHandler) => (
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
            onChange={(newAmount: string) =>
              dispatch(updateSendAmount(newAmount))
            }
            token={asset.details}
            value={amount.value}
            className="asset-picker-amount__input"
          />
        )}
      </Box>
      <Text color={TextColor.textAlternative}>
        {/* TODO: Consider rounding the balance so its not super long? */}
        {t('balance')}: {balance.toString()} {symbol}
      </Text>
    </Box>
  );
};
