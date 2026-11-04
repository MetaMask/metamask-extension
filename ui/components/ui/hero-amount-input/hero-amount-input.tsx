import React, { useRef } from 'react';
import {
  FontFamily,
  Input,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  HERO_AMOUNT_DIGIT_WIDTH_EM,
  HERO_AMOUNT_MAX_FONT_SIZE,
  HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE,
  HERO_AMOUNT_SKELETON_WIDTH,
  isPartialHeroAmount,
} from './hero-amount-input.constants';
import {
  useHeroAmountPrefixWidthEm,
  useHeroAmountRowWidth,
} from './hero-amount-input.hooks';
import type {
  HeroAmountInputProps,
  HeroAmountInputSkeletonProps,
} from './hero-amount-input.types';
import { getHeroAmountFontSize } from './hero-amount-input.utils';

// `color` is listed because this replaces the MMDS Input `transition-colors`.
const SIZE_TRANSITION =
  'transition-[color,font-size,line-height] duration-100 ease-out motion-reduce:transition-none';

export const HeroAmountInputSkeleton: React.FC<
  HeroAmountInputSkeletonProps
> = ({
  maxFontSize = HERO_AMOUNT_MAX_FONT_SIZE,
  align = 'center',
  className,
  'data-testid': dataTestId = 'hero-amount-input-skeleton',
}) => (
  <div
    data-testid={dataTestId}
    className={twMerge(
      'flex w-full items-center',
      align === 'start' ? 'justify-start' : 'justify-center',
      className,
    )}
    style={{ height: maxFontSize }}
  >
    <Skeleton
      height={maxFontSize}
      width={HERO_AMOUNT_SKELETON_WIDTH}
      className="rounded-lg"
    />
  </div>
);

export const HeroAmountInput: React.FC<HeroAmountInputProps> = ({
  prefix = '',
  value,
  onChange,
  maxDecimals,
  autoFocus = false,
  disabled = false,
  readOnly = false,
  hasError = false,
  isLoading = false,
  maxFontSize = HERO_AMOUNT_MAX_FONT_SIZE,
  align = 'center',
  className,
  'data-testid': dataTestId = 'hero-amount-input',
  inputRef,
  prefixProps,
  valueProps,
  inputProps,
}) => {
  const t = useI18nContext();
  const probeRef = useRef<HTMLSpanElement>(null);
  const [rowRef, rowWidth] = useHeroAmountRowWidth();
  const prefixEm = useHeroAmountPrefixWidthEm(prefix, probeRef);

  if (isLoading) {
    return (
      <HeroAmountInputSkeleton
        maxFontSize={maxFontSize}
        align={align}
        className={className}
        data-testid={`${dataTestId}-skeleton`}
      />
    );
  }

  const displayValue = value || '0';
  const fontSize = getHeroAmountFontSize(
    prefixEm + displayValue.length * HERO_AMOUNT_DIGIT_WIDTH_EM,
    rowWidth,
    maxFontSize,
  );
  const amountStyle = { fontSize, lineHeight: `${fontSize}px` };

  let textColor = TextColor.TextDefault;
  if (hasError) {
    textColor = TextColor.ErrorDefault;
  } else if (disabled && !readOnly) {
    textColor = TextColor.TextMuted;
  }

  const { className: prefixClassName, ...restPrefixProps } = prefixProps ?? {};
  const { className: valueClassName, ...restValueProps } = valueProps ?? {};
  const { className: inputClassName, ...restInputProps } = inputProps ?? {};

  return (
    <div
      ref={rowRef}
      data-testid={dataTestId}
      className={twMerge(
        'relative flex w-full min-w-0 items-center overflow-hidden',
        align === 'start' ? 'justify-start' : 'justify-center',
        className,
      )}
      style={{ height: maxFontSize }}
      onClick={(event) => {
        if (!disabled) {
          event.currentTarget.querySelector('input')?.focus();
        }
      }}
    >
      {prefix ? (
        <>
          <span
            ref={probeRef}
            aria-hidden="true"
            className="pointer-events-none invisible absolute font-hero whitespace-pre"
            style={{ fontSize: HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE }}
          >
            {prefix}
          </span>
          <Text
            data-testid={`${dataTestId}-prefix`}
            {...restPrefixProps}
            variant={TextVariant.AmountDisplayLg}
            fontFamily={FontFamily.Hero}
            color={textColor}
            className={twMerge(SIZE_TRANSITION, prefixClassName, 'shrink-0')}
            style={amountStyle}
          >
            {prefix}
          </Text>
        </>
      ) : null}
      {/*
       * An <input> does not size to its value, so a hidden copy of the amount
       * sizes this wrapper and the field fills it. The wrapper shrinks to the
       * space beside the prefix so a long amount cannot cover the symbol.
       */}
      <span className="relative w-max min-w-0 overflow-hidden">
        <Text
          data-testid={`${dataTestId}-value`}
          {...restValueProps}
          aria-hidden="true"
          variant={TextVariant.AmountDisplayLg}
          fontFamily={FontFamily.Hero}
          className={twMerge(
            'invisible block min-w-[1ch] whitespace-pre',
            SIZE_TRANSITION,
            valueClassName,
          )}
          style={amountStyle}
        >
          {displayValue}
        </Text>
        <Input
          aria-label={t('amount')}
          data-testid={`${dataTestId}-input`}
          {...restInputProps}
          ref={inputRef}
          autoFocus={autoFocus && !disabled}
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={value}
          onChange={(event) => {
            if (isPartialHeroAmount(event.target.value, maxDecimals)) {
              onChange?.(event.target.value);
            }
          }}
          isDisabled={disabled}
          isReadOnly={readOnly}
          isStateStylesDisabled
          textVariant={TextVariant.AmountDisplayLg}
          className={twMerge(
            'absolute inset-0 rounded-none border-0 bg-transparent p-0 text-left font-hero',
            textColor,
            disabled ? 'cursor-default' : 'cursor-text',
            SIZE_TRANSITION,
            inputClassName,
          )}
          style={amountStyle}
        />
      </span>
    </div>
  );
};
