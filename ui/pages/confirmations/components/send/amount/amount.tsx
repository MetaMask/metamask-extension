import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  FlexWrap,
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
import { getSymbolLayout, SYMBOL_RIGHT_INSET_PX } from './symbol-layout';

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

  const symbol = fiatMode ? fiatCurrencyName?.toUpperCase() : asset?.symbol;
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const symbolRef = useRef<HTMLElement | null>(null);
  const [symbolLayout, setSymbolLayout] = useState<SymbolLayout>({
    left: SYMBOL_RIGHT_INSET_PX,
    paddingRight: 0,
  });

  useLayoutEffect(() => {
    const field = fieldRef.current;
    const input = inputRef.current;
    const measure = measureRef.current;
    const symbolElement = symbolRef.current;
    if (!field || !input || !measure || !symbolElement) {
      return undefined;
    }

    const update = () => {
      const inputStyle = window.getComputedStyle(input);
      measure.style.font = inputStyle.font;
      measure.style.letterSpacing = inputStyle.letterSpacing;
      measure.style.fontVariantNumeric = inputStyle.fontVariantNumeric;
      measure.style.fontFeatureSettings = inputStyle.fontFeatureSettings;

      const fieldRect = field.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      const paddingLeft = Number.parseFloat(inputStyle.paddingLeft) || 0;
      const { left, paddingRight } = getSymbolLayout({
        fieldLeft: fieldRect.left,
        fieldWidth: fieldRect.width,
        inputRight: inputRect.right,
        symbolWidth: symbolElement.getBoundingClientRect().width,
        textStart: inputRect.left - fieldRect.left + paddingLeft,
        textWidth: measure.getBoundingClientRect().width,
      });

      setSymbolLayout((current) =>
        current.left === left && current.paddingRight === paddingRight
          ? current
          : { left, paddingRight },
      );
    };

    update();

    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(update);
    observer?.observe(field);

    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) {
        update();
      }
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [amount, symbol]);

  if (asset?.standard === ERC721) {
    return null;
  }

  return (
    <Box marginTop={4}>
      <Text variant={TextVariant.bodyMd} paddingBottom={1}>
        {t('amount')}
      </Text>
      <Box
        ref={fieldRef}
        style={{ position: 'relative' }}
        width={BlockSize.Full}
      >
        <span
          aria-hidden="true"
          ref={measureRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'pre',
            pointerEvents: 'none',
          }}
        >
          {amount || '0'}
        </span>
        <TextField
          error={Boolean(amountError)}
          inputProps={
            symbolLayout.paddingRight > 0
              ? {
                  style: {
                    boxSizing: 'border-box',
                    paddingRight: symbolLayout.paddingRight,
                  },
                }
              : undefined
          }
          inputRef={inputRef}
          onChange={onChange}
          onPaste={setAmountInputMethodPasted}
          onInput={setAmountInputMethodManual}
          placeholder="0"
          testId="send-amount-input"
          value={amount}
          width={BlockSize.Full}
          size={TextFieldSize.Lg}
        />
        {symbol ? (
          <Text
            as="span"
            data-testid="send-amount-symbol"
            ref={symbolRef}
            style={{
              position: 'absolute',
              left: symbolLayout.left,
              top: '50%',
              margin: 0,
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {symbol}
          </Text>
        ) : null}
      </Box>
      <Box
        display={Display.Flex}
        flexWrap={FlexWrap.Wrap}
        gap={1}
        justifyContent={JustifyContent.spaceBetween}
        marginTop={1}
      >
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={1}
          paddingLeft={4}
        >
          <Text
            color={
              amountError ? TextColor.errorDefault : TextColor.textAlternative
            }
            data-testid="send-amount-fiat-value"
            role={amountError ? 'alert' : undefined}
            variant={TextVariant.bodySm}
          >
            {amountError ||
              (conversionSupportedForAsset ? alternateDisplayValue : '')}
          </Text>
          {conversionSupportedForAsset && !amountError && (
            <ButtonIcon
              aria-pressed={fiatMode}
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
        <Box display={Display.Flex} marginLeft="auto">
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            data-testid="send-amount-balance"
          >
            {balanceDisplayValue}
          </Text>
          {!isNonEvmNativeSendType && (
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
