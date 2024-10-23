import type { TextProps } from '../text/text.types';

export const SensitiveLengths = {
  Short: '5',
  Medium: '8',
  Long: '13',
} as const;

export type SensitiveLengths =
  (typeof SensitiveLengths)[keyof typeof SensitiveLengths];

export type SensitiveTextProps<C extends React.ElementType = 'p'> = Omit<
  TextProps<C>,
  'children'
> & {
  isHidden: boolean;
  length?: SensitiveLengths;
  children?: React.ReactNode;
};
