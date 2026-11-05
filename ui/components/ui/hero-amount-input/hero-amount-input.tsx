import React, { useLayoutEffect, useState } from 'react';
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
  AnimatedNumericText,
  canAnimateElements,
  createFlipTracker,
  getElementFontSize,
  usePrefersReducedMotion,
} from '../animated-numeric-text';
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

// With glyph motion, a font-size step shares the glyph slide's duration and
// easing. Centered positions scale with the font size, so the slide and the
// step then add up to one motion instead of overshooting.
const GLYPH_SIZE_TRANSITION =
  'transition-[color,font-size,line-height] duration-[160ms] ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none';

// Glyphs are separate elements, so kerning and ligatures between them are
// lost. Turning both off in the field too keeps its caret under the glyphs.
const GLYPH_TYPOGRAPHY = '[font-kerning:none] [font-variant-ligatures:none]';

const GLYPH_FIELD_TEXT = '[-webkit-text-fill-color:transparent]';

// The field's text is transparent, which Chrome punches out of the default
// selection highlight. An opaque highlight with filled text covers the glyphs.
const GLYPH_FIELD_SELECTION =
  'selection:bg-primary-default selection:text-primary-inverse [&::selection]:[-webkit-text-fill-color:var(--color-primary-inverse)]';

/**
 * The amount glyphs are the first child of the wrapper. They follow the
 * field's horizontal scroll when a long amount overflows.
 *
 * @param amount - The wrapper around the glyphs and the field.
 * @param field - The field, if it is mounted.
 */
function syncGlyphScroll(
  amount: HTMLElement,
  field: HTMLInputElement | null,
): void {
  const glyphs = amount.firstElementChild;
  if (glyphs instanceof HTMLElement) {
    const scrollLeft = field?.scrollLeft ?? 0;
    glyphs.style.transform = scrollLeft ? `translateX(${-scrollLeft}px)` : '';
  }
}

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
  const [rowRef, rowWidth, row] = useHeroAmountRowWidth();
  const [probeRef, prefixEm] = useHeroAmountPrefixWidthEm(prefix);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isComposing, setIsComposing] = useState(false);
  const [amount, setAmount] = useState<HTMLSpanElement | null>(null);
  const [rowTracker] = useState(createFlipTracker);
  // The glyph layer draws the digits under the field, whose text is
  // transparent, so the field still draws the caret and selection. Reduced
  // motion and IME composition show the field's own text instead.
  const showGlyphs =
    !prefersReducedMotion && !isComposing && canAnimateElements();
  const sizeTransition = showGlyphs ? GLYPH_SIZE_TRANSITION : SIZE_TRANSITION;

  // Slides the prefix and amount when a centered row re-centers, like the
  // Mobile container's LinearTransition. Positions are kept in em from the
  // row's anchor so a font-size step is not read as movement.
  useLayoutEffect(() => {
    if (!row || !amount) {
      return;
    }
    const glyphs = amount.firstElementChild ?? amount;
    rowTracker.play(
      row,
      {
        origin: align === 'center' ? row.clientWidth / 2 : 0,
        scale: getElementFontSize(glyphs),
      },
      showGlyphs,
    );
    syncGlyphScroll(amount, amount.querySelector('input'));
  }, [align, amount, row, rowTracker, showGlyphs, value]);

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
  const widthEm = prefixEm + displayValue.length * HERO_AMOUNT_DIGIT_WIDTH_EM;
  const fontSize = getHeroAmountFontSize(widthEm, rowWidth, maxFontSize);
  // Shrinking and clipping are only needed once the amount can reach the
  // prefix. Otherwise the wrapper keeps the amount's width: a glyph zooming
  // out past the new end stays visible, and the field does not scroll while
  // a font-size step is still at the larger size.
  const mayOverflow = !showGlyphs || widthEm * fontSize > rowWidth;
  const amountStyle = { fontSize, lineHeight: `${fontSize}px` };

  let textColor: TextColor = TextColor.TextDefault;
  if (hasError) {
    textColor = TextColor.ErrorDefault;
  } else if (disabled && !readOnly) {
    textColor = TextColor.TextMuted;
  }

  const { className: prefixClassName, ...restPrefixProps } = prefixProps ?? {};
  const { className: valueClassName, ...restValueProps } = valueProps ?? {};
  const { className: inputClassName, ...restInputProps } = inputProps ?? {};

  // A label row focuses the field natively from a click on the prefix or the
  // space around the amount, and does nothing when the field is disabled.
  // `overflow-clip` keeps the browser from scrolling the row to the caret
  // while a font-size step briefly overflows it.
  return (
    <label
      ref={rowRef}
      data-testid={dataTestId}
      className={twMerge(
        'relative flex w-full min-w-0 items-center overflow-clip',
        align === 'start' ? 'justify-start' : 'justify-center',
        className,
      )}
      style={{ height: maxFontSize }}
    >
      {prefix ? (
        <>
          {/*
           * The probe takes the prefix variant's weight classes through asChild,
           * so it measures the same weight as the rendered prefix. The inline
           * size overrides the variant size.
           */}
          <Text
            asChild
            variant={TextVariant.AmountDisplayLg}
            fontFamily={FontFamily.Hero}
          >
            <span
              ref={probeRef}
              aria-hidden="true"
              className="pointer-events-none invisible absolute whitespace-pre"
              style={{ fontSize: HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE }}
            >
              {prefix}
            </span>
          </Text>
          <Text
            data-flip-key="prefix"
            data-testid={`${dataTestId}-prefix`}
            {...restPrefixProps}
            variant={TextVariant.AmountDisplayLg}
            fontFamily={FontFamily.Hero}
            color={textColor}
            className={twMerge(sizeTransition, prefixClassName, 'shrink-0')}
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
      <span
        ref={setAmount}
        data-flip-key="amount"
        className={twMerge(
          'relative w-max',
          mayOverflow ? 'min-w-0 overflow-hidden' : 'shrink-0',
        )}
      >
        <Text
          data-testid={`${dataTestId}-value`}
          color={textColor}
          {...restValueProps}
          aria-hidden="true"
          variant={TextVariant.AmountDisplayLg}
          fontFamily={FontFamily.Hero}
          className={twMerge(
            'block min-w-[1ch] whitespace-pre',
            showGlyphs ? GLYPH_TYPOGRAPHY : 'invisible',
            sizeTransition,
            valueClassName,
          )}
          style={amountStyle}
        >
          <AnimatedNumericText value={value} animated={showGlyphs} />
          {value ? null : (
            <span className="invisible [font-family:inherit]">0</span>
          )}
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
          onCompositionStart={(event) => {
            setIsComposing(true);
            restInputProps.onCompositionStart?.(event);
          }}
          onCompositionEnd={(event) => {
            setIsComposing(false);
            restInputProps.onCompositionEnd?.(event);
          }}
          onScroll={(event) => {
            if (amount) {
              syncGlyphScroll(amount, event.currentTarget);
            }
            restInputProps.onScroll?.(event);
          }}
          isDisabled={disabled}
          isReadOnly={readOnly}
          isStateStylesDisabled
          textVariant={TextVariant.AmountDisplayLg}
          className={twMerge(
            'absolute inset-0 rounded-none border-0 bg-transparent p-0 text-left font-hero',
            textColor,
            disabled ? 'cursor-default' : 'cursor-text',
            showGlyphs && `${GLYPH_TYPOGRAPHY} ${GLYPH_FIELD_SELECTION}`,
            // `color` stays set so the caret keeps the text color.
            showGlyphs && value && GLYPH_FIELD_TEXT,
            sizeTransition,
            inputClassName,
          )}
          style={amountStyle}
        />
      </span>
    </label>
  );
};
