import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
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
  TextVariant,
} from '../../../helpers/constants/design-system';

import { AssetType } from '../../../../shared/constants/transaction';
import UserPreferencedCurrencyInput from '../../app/user-preferenced-currency-input/user-preferenced-currency-input.container';
import UserPreferencedTokenInput from '../../app/user-preferenced-token-input/user-preferenced-token-input.component';
import {
  getCurrentDraftTransaction,
  updateSendAmount,
} from '../../../ducks/send';
import { useI18nContext } from '../../../hooks/useI18nContext';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display';
import { PRIMARY } from '../../../helpers/constants/common';
import TokenBalance from '../../ui/token-balance';
import MaxClearButton from './max-clear-button';
import AssetPicker from './asset-picker/asset-picker';

// A component that combines an asset picker with an input for the amount to send.
// Work in progress.
export const AssetPickerAmount = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { asset, amount } = useSelector(getCurrentDraftTransaction);

  if (!asset) {
    throw new Error('No asset is drafted for sending');
  }

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
              <ButtonIcon
                backgroundColor={BackgroundColor.transparent}
                iconName={IconName.SwapVertical}
                ariaLabel={t('switchInputCurrency')}
                size={ButtonIconSize.Sm}
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
      <Box display={Display.Flex}>
        <Text
          color={TextColor.textAlternative}
          marginRight={1}
          variant={TextVariant.bodySm}
        >
          {t('balance')}:
        </Text>
        {asset.type === AssetType.native ? (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Other props are optional but the compiler expects them
          <UserPreferencedCurrencyDisplay
            value={asset.balance}
            type={PRIMARY}
            textProps={{
              color: TextColor.textAlternative,
              variant: TextVariant.bodySm,
            }}
            suffixProps={{
              color: TextColor.textAlternative,
              variant: TextVariant.bodySm,
            }}
          />
        ) : (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Details should be defined for token assets
          <TokenBalance
            token={asset.details}
            textProps={{ color: TextColor.textAlternative }}
            suffixProps={{ color: TextColor.textAlternative }}
          />
        )}
      </Box>
    </Box>
  );
};
