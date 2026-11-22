import * as React from 'react';

export type UnitInputRef = {
  updateIsOverflowing: () => void;
};

export type UnitInputProps = {
  className?: string;
  dataTestId?: string;
  children?: React.ReactNode;
  actionComponent?: React.ReactNode;
  error?: boolean;
  onChange?: (value: string | number) => void;
  onBlur?: () => void;
  placeholder?: string;
  suffix?: string;
  hideSuffix?: boolean;
  value?: string | number;
  keyPressRegex?: RegExp;
  isDisabled?: boolean;
  isFocusOnInput?: boolean;
  onPaste?: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  'data-testid'?: string;
  type?: string;
  step?: number;
  min?: number;
};

declare const UnitInput: React.ForwardRefExoticComponent<
  UnitInputProps & React.RefAttributes<UnitInputRef>
>;

export default UnitInput;
