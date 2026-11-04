import type { ChangeEvent, ComponentPropsWithoutRef, Ref } from 'react';

import type { Input, Text } from '@metamask/design-system-react';

import type { AmountInputFontSize } from '../../../helpers/utils/amount-input-font-size';

/**
 * Extra props for the prefix. `children`, color, and font size stay owned by
 * the component. `data-testid` is set with `prefixTestId`.
 */
export type HeroAmountPrefixProps = Omit<
  ComponentPropsWithoutRef<typeof Text>,
  'children' | 'color' | 'style'
>;

/**
 * Extra props for the field. The value, change handler, and font size stay
 * owned by the component. `data-testid` is set with `inputTestId`.
 */
export type HeroAmountFieldProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  'value' | 'onChange' | 'style' | 'textVariant'
>;

/**
 * Extra props for the hidden amount that sizes the field. `data-testid` is
 * set with `amountTestId`.
 */
export type HeroAmountValueProps = Omit<
  ComponentPropsWithoutRef<typeof Text>,
  'children' | 'style'
>;

/**
 * Extra props for the row. The font-size measurement ref stays owned by the
 * component. `data-testid` is set with `data-testid`.
 */
export type HeroAmountContainerProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
>;

export type HeroAmountInputProps = {
  /**
   * Currency symbol or code rendered beside the amount. It is measured from
   * the rendered glyph, so letter codes such as KRW do not need a width table.
   */
  prefix?: string;
  /**
   * The amount typed into the field, without the currency prefix.
   */
  value: string;
  /**
   * Called with the input change event when the next value is accepted.
   */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /**
   * Decides whether a typed value is kept. Defaults to digits with one
   * separator. Return false to ignore the keystroke.
   */
  isValidInput?: (value: string) => boolean;
  /**
   * Shown, and measured, while `value` is empty.
   */
  placeholder?: string;
  /**
   * Focuses the field on mount.
   */
  autoFocus?: boolean;
  /**
   * Prevents editing and uses the muted text color.
   */
  disabled?: boolean;
  /**
   * Prevents editing.
   */
  readOnly?: boolean;
  /**
   * Renders the prefix and amount in the error color.
   */
  hasError?: boolean;
  /**
   * Largest step of the shared scale. Swap and Bridge start at 40.
   */
  maxFontSize?: AmountInputFontSize;
  /**
   * Width in px used until the row has been measured.
   */
  fallbackWidth?: number;
  /**
   * Accessible name of the field.
   */
  ariaLabel?: string;
  /**
   * Additional CSS classes merged onto the row.
   */
  className?: string;
  /**
   * Test identifier for the row.
   */
  'data-testid'?: string;
  /**
   * Test identifier for the prefix.
   */
  prefixTestId?: string;
  /**
   * Test identifier for the input.
   */
  inputTestId?: string;
  /**
   * Test identifier for the hidden amount that sizes the field.
   */
  amountTestId?: string;
  /**
   * Ref to the native input. Used to focus the field or move the caret.
   */
  inputRef?: Ref<HTMLInputElement>;
  /**
   * Props forwarded to the prefix, such as alignment.
   */
  prefixProps?: HeroAmountPrefixProps;
  /**
   * Props forwarded to the field, such as paste and key handlers.
   */
  inputProps?: HeroAmountFieldProps;
  /**
   * Props forwarded to the hidden amount.
   */
  amountProps?: HeroAmountValueProps;
  /**
   * Props forwarded to the row, such as a click handler that focuses the field.
   */
  containerProps?: HeroAmountContainerProps;
};
