import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ERC721 } from '@metamask/controller-utils';

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
import {
  formatToFixedDecimals,
  getFractionLength,
  isValidPositiveNumericString,
} from '../../../utils/send';

export const Amount = ({
  setAmountValueError,
}: {
  setAmountValueError: (str?: string) => void;
}) => {
  const t = useI18nContext();
  const { asset, updateValue, value } = useSendContext();
  const [amount, setAmount] = useState(value ?? '');
  const [amountValueError, setAmountValueErrorLocal] = useState<string>();
  const { balance } = useBalance();
  const [fiatMode, setFiatMode] = useState(false);
  const {
    conversionSupportedForAsset,
    getFiatValue,
    getFiatDisplayValue,
    getNativeValue,
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
      fiatMode
        ? `${formatToFixedDecimals(value, 5)} ${asset?.symbol}`
        : getFiatDisplayValue(amount),
    [amount, fiatMode, getFiatDisplayValue, value],
  );
  const { amountError } = useAmountValidation();

  useEffect(() => {
    let amtError: string | undefined;
    if (amountError) {
      amtError = amountError;
    } else if (amount === undefined || amount === null || amount === '') {
      amtError = undefined;
    } else if (!isValidPositiveNumericString(amount)) {
      amtError = t('invalidValue');
    }
    setAmountValueError(amtError);
    setAmountValueErrorLocal(amtError);
  }, [amount, amountError, setAmountValueError, setAmountValueErrorLocal, t]);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const fractionSize = getFractionLength(newValue);
      if (
        (fiatMode && fractionSize > 2) ||
        (!fiatMode && fractionSize > (asset?.decimals ?? 0))
      ) {
        return;
      }
      updateValue(fiatMode ? getNativeValue(newValue) : newValue);
      setAmount(newValue);
    },
    [asset, fiatMode, getNativeValue, setAmount, updateValue],
  );

  const toggleFiatMode = useCallback(() => {
    const newFiatMode = !fiatMode;
    setFiatMode(newFiatMode);
    if (newFiatMode) {
      if (amount !== undefined && isValidPositiveNumericString(amount)) {
        setAmount(getFiatValue(amount));
      }
      setAmountInputTypeFiat();
    } else {
      if (!value || isValidPositiveNumericString(value)) {
        setAmount(value ?? '');
      }
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
    value,
  ]);

  const updateToMax = useCallback(() => {
    const maxValue = getMaxAmount() ?? '0';
    setAmount(fiatMode ? getFiatValue(maxValue) : maxValue);
    updateValue(maxValue, true);
    setAmountInputMethodPressedMax();
  }, [
    fiatMode,
    getFiatValue,
    getMaxAmount,
    setAmount,
    setAmountInputMethodPressedMax,
    updateValue,
  ]);

  if (asset?.standard === ERC721) {
    return null;
  }

  return (
    <Box marginTop={4}>
      <Text variant={TextVariant.bodyMd} paddingBottom={1}>
        {t('amount')}
      </Text>
      <TextField
        error={Boolean(amountValueError)}
        onChange={onChange}
        onPaste={setAmountInputMethodPasted}
        onInput={setAmountInputMethodManual}
        value={amount}
        endAccessory={
          <div>
            {conversionSupportedForAsset && (
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
            amountValueError
              ? TextColor.errorDefault
              : TextColor.textAlternative
          }
          variant={TextVariant.bodySm}
        >
          {amountValueError ||
            (conversionSupportedForAsset ? alternateDisplayValue : '')}
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
