import type { TextProps } from '../text/text.types';

/**
 * SensitiveText length options.
 */
export const SensitiveTextLength = {
  Short: '6',
  Medium: '9',
  Long: '12',
  ExtraLong: '20',
} as const;

/**
 * Type for SensitiveTextLength values.
 */
export type SensitiveTextLengthType =
  (typeof SensitiveTextLength)[keyof typeof SensitiveTextLength];
/**
 * Type for custom length values.
 */
export type CustomLength = string;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type SensitiveTextProps<C extends React.ElementType = 'p'> = Omit<
  TextProps<C>,
  'children'
> & {
  /**
   * Boolean to determine whether the text should be hidden or visible.
   *
   * @default false
   */
  isHidden?: boolean;
  /**
   * Determines the length of the hidden text (number of asterisks).
   * Can be a predefined SensitiveTextLength or a custom string number.
   *
   * @default SensitiveTextLength.Short
   */
  length?: SensitiveTextLengthType | CustomLength;
  /**
   * The text content to be displayed or hidden.
   */
  children?: React.ReactNode;
};
