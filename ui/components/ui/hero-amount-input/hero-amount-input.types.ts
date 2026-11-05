import type { ComponentPropsWithoutRef, Ref } from 'react';

import type { Input, Text } from '@metamask/design-system-react';

import type { HeroAmountFontSize } from './hero-amount-input.constants';

/**
 * Extra props for the prefix. Text, color, and font size stay owned by the
 * component. `data-testid` defaults to `${data-testid}-prefix`.
 */
export type HeroAmountPrefixProps = Omit<
  ComponentPropsWithoutRef<typeof Text>,
  'children' | 'color' | 'style' | 'variant' | 'fontFamily'
> & { 'data-testid'?: string };

/**
 * Extra props for the hidden amount that sizes the field. `data-testid`
 * defaults to `${data-testid}-value`.
 */
export type HeroAmountValueProps = Omit<
  ComponentPropsWithoutRef<typeof Text>,
  'children' | 'style' | 'variant' | 'fontFamily'
> & { 'data-testid'?: string };

/**
 * Extra props for the field, such as a paste handler. Value, change handling,
 * state, and font size stay owned by the component. `data-testid` defaults to
 * `${data-testid}-input`.
 */
export type HeroAmountFieldProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  | 'value'
  | 'onChange'
  | 'style'
  | 'textVariant'
  | 'isDisabled'
  | 'isReadOnly'
  | 'autoFocus'
  | 'type'
  | 'inputMode'
  | 'placeholder'
> & { 'data-testid'?: string };

export type HeroAmountInputProps = {
  /**
   * Currency symbol or code shown before the amount. Its rendered width is
   * measured, so codes such as KRW need no width table.
   */
  prefix?: string;
  /**
   * The amount in the field, without the prefix.
   */
  value: string;
  /**
   * Called with the next value when a keystroke is accepted: digits with at
   * most one `.` or `,` separator.
   */
  onChange?: (value: string) => void;
  /**
   * Digits allowed after the separator. Unlimited if omitted.
   */
  maxDecimals?: number;
  /**
   * Focuses the field on mount.
   */
  autoFocus?: boolean;
  /**
   * Prevents editing and mutes the text.
   */
  disabled?: boolean;
  /**
   * Prevents editing. Shows a value the user cannot change, such as a quote,
   * in the default text color.
   */
  readOnly?: boolean;
  /**
   * Renders the prefix and amount in the error color.
   */
  hasError?: boolean;
  /**
   * Renders a skeleton instead of the field.
   */
  isLoading?: boolean;
  /**
   * Largest step of the scale, and the row height. Swap and Bridge use 40.
   */
  maxFontSize?: HeroAmountFontSize;
  /**
   * Horizontal placement of the amount in the row. Swap and Bridge use
   * `start` beside the asset picker.
   */
  align?: 'center' | 'start';
  /**
   * Additional CSS classes merged onto the row.
   */
  className?: string;
  /**
   * Test id of the row. Child test ids are derived from it.
   */
  'data-testid'?: string;
  /**
   * Ref to the native input, for focus or caret control.
   */
  inputRef?: Ref<HTMLInputElement>;
  /**
   * Props forwarded to the prefix.
   */
  prefixProps?: HeroAmountPrefixProps;
  /**
   * Props forwarded to the hidden amount.
   */
  valueProps?: HeroAmountValueProps;
  /**
   * Props forwarded to the field.
   */
  inputProps?: HeroAmountFieldProps;
};

export type HeroAmountInputSkeletonProps = {
  /**
   * Height of the skeleton, matching the row it replaces.
   */
  maxFontSize?: HeroAmountFontSize;
  /**
   * Horizontal placement of the skeleton.
   */
  align?: 'center' | 'start';
  /**
   * Additional CSS classes merged onto the skeleton row.
   */
  className?: string;
  /**
   * Test id of the skeleton.
   */
  'data-testid'?: string;
};
