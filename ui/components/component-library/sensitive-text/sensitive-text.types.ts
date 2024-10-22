import type { TextProps } from '../text/text.types';

export enum SensitiveLengths {
  Short = 5,
  Medium = 8,
  Long = 13,
}

export type SensitiveTextProps<C extends React.ElementType = 'p'> = Omit<
  TextProps<C>,
  'children'
> & {
  isHidden: boolean;
  length?: SensitiveLengths;
  children?: React.ReactNode;
};
