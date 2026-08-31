import { FontWeight, TextColor, TextVariant } from '@metamask/design-system-react';

export type InlineEditableLabelProps = {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  placeholder?: string;
  maxLength?: number;
  ariaLabel?: string;
  variant?: TextVariant;
  color?: TextColor;
  fontWeight?: FontWeight;
  className?: string;
  testId?: string;
  disabled?: boolean;
};
