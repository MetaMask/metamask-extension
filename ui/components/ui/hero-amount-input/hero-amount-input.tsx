import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  FontFamily,
  Input,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';

import {
  AMOUNT_INPUT_MAX_FONT_SIZE,
  AMOUNT_INPUT_TRANSITION_CLASS_NAME,
  getAmountInputFontSizeForEm,
  getAmountInputTextStyle,
} from '../../../helpers/utils/amount-input-font-size';
import { useAmountInputFontSize } from '../../../hooks/useAmountInputFontSize';

import {
  HERO_AMOUNT_DIGIT_WIDTH_EM,
  HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE,
  isPartialHeroAmount,
} from './hero-amount-input.constants';
import type { HeroAmountInputProps } from './hero-amount-input.types';

/**
 * Width of the prefix in em, measured from a fixed-size probe so the result
 * does not depend on the font size being chosen.
 *
 * @param prefix - The currency symbol or code.
 * @param probeRef - The offscreen element rendering the prefix.
 * @returns The prefix width in em.
 */
function usePrefixWidthEm(
  prefix: string,
  probeRef: React.RefObject<HTMLSpanElement | null>,
): number {
  const [prefixEm, setPrefixEm] = useState(
    () => prefix.length * HERO_AMOUNT_DIGIT_WIDTH_EM,
  );

  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!prefix || !probe) {
      setPrefixEm(0);
      return undefined;
    }

    const measure = () => {
      const { width } = probe.getBoundingClientRect();
      if (width <= 0) {
        return;
      }
      const next = width / HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE;
      setPrefixEm((previous) => (previous === next ? previous : next));
    };

    measure();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) {
        measure();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [prefix, probeRef]);

  return prefixEm;
}

export const HeroAmountInput: React.FC<HeroAmountInputProps> = ({
  prefix = '',
  value,
  onChange,
  isValidInput = isPartialHeroAmount,
  placeholder = '0',
  autoFocus = false,
  disabled = false,
  readOnly = false,
  hasError = false,
  maxFontSize = AMOUNT_INPUT_MAX_FONT_SIZE,
  fallbackWidth,
  ariaLabel = 'Amount',
  className,
  'data-testid': dataTestId = 'hero-amount-input',
  prefixTestId = 'hero-amount-prefix',
  inputTestId = 'hero-amount-field',
  amountTestId = 'hero-amount-value',
  inputRef,
  prefixProps,
  inputProps,
  amountProps,
  containerProps,
}) => {
  const probeRef = useRef<HTMLSpanElement>(null);
  const prefixEm = usePrefixWidthEm(prefix, probeRef);
  const displayValue = value || placeholder;
  const { containerRef, fontSize } = useAmountInputFontSize(displayValue, {
    fallbackWidth,
    maxFontSize,
    widthEm: prefixEm + displayValue.length * HERO_AMOUNT_DIGIT_WIDTH_EM,
  });
  const amountStyle = getAmountInputTextStyle(fontSize);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isValidInput(event.target.value)) {
      return;
    }
    onChange?.(event);
  };
  let textColor = TextColor.TextDefault;
  if (hasError) {
    textColor = TextColor.ErrorDefault;
  } else if (disabled) {
    textColor = TextColor.TextMuted;
  }
  const {
    className: containerClassName,
    style: containerStyle,
    ...restContainerProps
  } = containerProps ?? {};
  const { className: prefixClassName, ...restPrefixProps } = prefixProps ?? {};
  const { className: inputClassName, ...restInputProps } = inputProps ?? {};
  const { className: amountClassName, ...restAmountProps } = amountProps ?? {};

  return (
    <div
      {...restContainerProps}
      ref={containerRef}
      data-testid={dataTestId}
      className={twMerge(
        'relative flex w-full min-w-0 items-center justify-center overflow-hidden',
        className,
        containerClassName,
      )}
      style={{ minHeight: maxFontSize, ...containerStyle }}
    >
      {prefix ? (
        <span
          ref={probeRef}
          aria-hidden="true"
          data-testid="hero-amount-prefix-probe"
          className="pointer-events-none absolute font-hero whitespace-pre"
          style={{
            fontSize: HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE,
            visibility: 'hidden',
          }}
        >
          {prefix}
        </span>
      ) : null}
      {prefix ? (
        <Text
          {...restPrefixProps}
          data-testid={prefixTestId}
          variant={TextVariant.AmountDisplayLg}
          fontFamily={FontFamily.Hero}
          color={textColor}
          className={twMerge(
            AMOUNT_INPUT_TRANSITION_CLASS_NAME,
            prefixClassName,
          )}
          style={amountStyle}
        >
          {prefix}
        </Text>
      ) : null}
      <span className="relative w-max min-w-[1ch] max-w-full">
        <Text
          {...restAmountProps}
          aria-hidden="true"
          data-testid={amountTestId}
          variant={TextVariant.AmountDisplayLg}
          fontFamily={FontFamily.Hero}
          className={twMerge(
            'invisible block min-w-[1ch] whitespace-pre',
            AMOUNT_INPUT_TRANSITION_CLASS_NAME,
            amountClassName,
          )}
          style={amountStyle}
        >
          {displayValue}
        </Text>
        <Input
          {...restInputProps}
          ref={inputRef}
          aria-label={ariaLabel}
          autoFocus={autoFocus && !disabled}
          data-testid={inputTestId}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          isDisabled={disabled}
          isReadOnly={readOnly}
          isStateStylesDisabled
          textVariant={TextVariant.AmountDisplayLg}
          className={twMerge(
            'absolute inset-0 rounded-none border-0 bg-transparent p-0 text-left font-hero',
            textColor,
            disabled ? 'cursor-default' : 'cursor-text',
            AMOUNT_INPUT_TRANSITION_CLASS_NAME,
            inputClassName,
          )}
          style={amountStyle}
        />
      </span>
    </div>
  );
};
