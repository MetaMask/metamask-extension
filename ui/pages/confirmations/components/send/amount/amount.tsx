import React, { useCallback, useMemo, useState } from 'react';
import { ERC1155, ERC721 } from '@metamask/controller-utils';

import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  IconName,
  Text,
  TextField,
  TextFieldSize,
} from '../../../../../components/component-library';
import {
  BlockSize,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAmountSelectionMetrics } from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import { useAmountValidation } from '../../../hooks/send/useAmountValidation';
import { useBalance } from '../../../hooks/send/useBalance';
import { useCurrencyConversions } from '../../../hooks/send/useCurrencyConversions';
import { useMaxAmount } from '../../../hooks/send/useMaxAmount';
import { useSendContext } from '../../../context/send';
import { useSendType } from '../../../hooks/send/useSendType';
import { getFractionLength } from '../../../utils/send';

export const Amount = () => {
  const t = useI18nContext();
  const { asset, updateValue, value } = useSendContext();
  const [amount, setAmount] = useState(value ?? '');
  const { balance } = useBalance();
  const [fiatMode, setFiatMode] = useState(false);
  const {
    getFiatValue,
    getFiatDisplayValue,
    getNativeValue,
    getNativeDisplayValue,
  } = useCurrencyConversions();
  const { getMaxAmount } = useMaxAmount();
  const { isNonEvmNativeSendType } = useSendType();
  const {
    setAmountInputMethodManual,
    setAmountInputMethodPasted,
    setAmountInputMethodPressedMax,
    setAmountInputTypeFiat,
    setAmountInputTypeToken,
  } = useAmountSelectionMetrics();
  const alternateDisplayValue = useMemo(
    () =>
      fiatMode ? getNativeDisplayValue(amount) : getFiatDisplayValue(amount),
    [amount, fiatMode, getFiatDisplayValue, getNativeDisplayValue],
  );
  const { amountError } = useAmountValidation();

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      if (getFractionLength(newValue) > (asset?.decimals ?? 0)) {
        return;
      }
      updateValue(fiatMode ? getNativeValue(newValue) : newValue);
      setAmount(newValue);
    },
    [asset, fiatMode, getNativeValue, setAmount, updateValue],
  );

  const toggleFiatMode = useCallback(() => {
    const newFiatMode = !fiatMode;
    if (amount !== undefined) {
      setAmount(newFiatMode ? getFiatValue(amount) : getNativeValue(amount));
    }
    setFiatMode(newFiatMode);
    if (newFiatMode) {
      setAmountInputTypeFiat();
    } else {
      setAmountInputTypeToken();
    }
  }, [
    amount,
    fiatMode,
    getFiatValue,
    getNativeValue,
    setAmount,
    setAmountInputTypeFiat,
    setAmountInputTypeToken,
    setFiatMode,
  ]);

  const updateToMax = useCallback(() => {
    const maxValue = getMaxAmount() ?? '0';
    updateValue(fiatMode ? getNativeValue(maxValue) : maxValue, true);
    setAmount(maxValue);
    setAmountInputMethodPressedMax();
  }, [
    fiatMode,
    getMaxAmount,
    getNativeValue,
    setAmount,
    setAmountInputMethodPressedMax,
    updateValue,
  ]);

  const isERC1155 = asset?.standard === ERC1155;
  const isERC721 = asset?.standard === ERC721;
  const isTokenTransfer = asset && !isERC1155 && !isERC721;

  if (isERC721) {
    return null;
  }

  return (
    <Box marginTop={4}>
      <Text variant={TextVariant.bodyMd} paddingBottom={1}>
        {t('amount')}
      </Text>
      <TextField
        error={Boolean(amountError)}
        onChange={onChange}
        onPaste={setAmountInputMethodPasted}
        onInput={setAmountInputMethodManual}
        value={amount}
        endAccessory={
          <div>
            {isTokenTransfer && (
              <ButtonIcon
                ariaLabel="toggle fiat mode"
                iconName={IconName.SwapVertical}
                onClick={toggleFiatMode}
                size={ButtonIconSize.Sm}
                data-testid="toggle-fiat-mode"
              />
            )}
          </div>
        }
        width={BlockSize.Full}
        size={TextFieldSize.Lg}
      />
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        marginTop={1}
      >
        <Text
          color={
            amountError ? TextColor.errorDefault : TextColor.textAlternative
          }
          variant={TextVariant.bodySm}
        >
          {isTokenTransfer ? amountError || `~${alternateDisplayValue}` : ''}
        </Text>
        <Box display={Display.Flex}>
          <Text color={TextColor.textAlternative} variant={TextVariant.bodySm}>
            {balance} {asset?.symbol} {t('available')}
          </Text>
          {!isNonEvmNativeSendType && (
            <ButtonLink
              marginLeft={1}
              onClick={updateToMax}
              variant={TextVariant.bodySm}
            >
              {t('max')}
            </ButtonLink>
          )}
        </Box>
      </Box>
    </Box>
  );
};
