import React, { useCallback, useMemo, useState } from 'react';
import { ERC721, ERC1155 } from '@metamask/controller-utils';

import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  IconName,
  IconSize,
  Text,
  TextField,
  TextFieldSize,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAmountSelectionMetrics } from '../../../hooks/send/metrics/useAmountSelectionMetrics';
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
  amountError,
}: {
  amountError: string | undefined;
}) => {
  const t = useI18nContext();
  const { asset, updateValue, value } = useSendContext();
  const [amount, setAmount] = useState(value ?? '');
  const { balance } = useBalance();
  const [fiatMode, setFiatMode] = useState(false);
  const {
    conversionSupportedForAsset,
    fiatCurrencyName,
    getFiatValue,
    getFiatDisplayValue,
    getNativeValue,
  } = useCurrencyConversions();
  const { getMaxAmount } = useMaxAmount();
  const { isNonEvmSendType, isTronSendType } = useSendType();
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

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const fractionSize = getFractionLength(newValue);

      const numericRegex = /^\d*\.?\d*$/u;
      if (!numericRegex.test(newValue)) {
        return;
      }

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
    setAmount,
    setAmountInputTypeFiat,
    setAmountInputTypeToken,
    setFiatMode,
    value,
  ]);

  const updateToMax = useCallback(async () => {
    const maxValue = (await getMaxAmount()) ?? '0';
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

  const balanceDisplayValue = useMemo(() => {
    if (fiatMode) {
      return `${getFiatDisplayValue(String(balance))} ${t('available')}`;
    }

    // For ERC1155 tokens, use name or just show balance without symbol
    if (asset?.standard === ERC1155) {
      const displayName = asset?.name ? ` ${asset.name}` : '';
      return `${balance}${displayName} ${t('available')}`;
    }

    // For other tokens, use symbol
    return `${balance} ${asset?.symbol} ${t('available')}`;
  }, [
    fiatMode,
    getFiatDisplayValue,
    balance,
    asset?.symbol,
    asset?.name,
    asset?.standard,
    t,
  ]);

  const showFiatToggle = conversionSupportedForAsset && !amountError;

  if (asset?.standard === ERC721) {
    return null;
  }

  return (
    <Box marginTop={4}>
      <Text variant={TextVariant.bodyMd} paddingBottom={1}>
        {t('amount')}
      </Text>
      <TextField
        error={Boolean(amountError)}
        endAccessory={
          <Text>
            {fiatMode ? fiatCurrencyName?.toUpperCase() : asset?.symbol}
          </Text>
        }
        onChange={onChange}
        onPaste={setAmountInputMethodPasted}
        onInput={setAmountInputMethodManual}
        paddingRight={3}
        placeholder="0"
        size={TextFieldSize.Lg}
        testId="send-amount-input"
        value={amount}
        width={BlockSize.Full}
      />
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        marginTop={1}
      >
        <Box
          alignItems={AlignItems.center}
          display={Display.Flex}
          gap={1}
          paddingLeft={4}
        >
          <Text
            color={
              amountError ? TextColor.errorDefault : TextColor.textAlternative
            }
            data-testid="send-amount-fiat-value"
            variant={TextVariant.bodySm}
          >
            {amountError ||
              (conversionSupportedForAsset ? alternateDisplayValue : '')}
          </Text>
          {showFiatToggle && (
            <ButtonIcon
              ariaLabel="toggle fiat mode"
              color={IconColor.iconAlternative}
              data-testid="toggle-fiat-mode"
              iconName={IconName.SwapVertical}
              iconProps={{ size: IconSize.Md }}
              onClick={toggleFiatMode}
              size={ButtonIconSize.Sm}
            />
          )}
        </Box>
        <Box display={Display.Flex}>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            data-testid="send-amount-balance"
          >
            {balanceDisplayValue}
          </Text>
          {(!isNonEvmSendType || isTronSendType) && (
            <ButtonLink
              marginLeft={2}
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
