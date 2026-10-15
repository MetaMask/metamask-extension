import type { ReactNode } from 'react';

export type PayWithRowTrailingVariant = 'checkmark' | 'chevron' | 'none';

export type PayWithRowConfig = {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  isSelected?: boolean;
  trailingElement?: PayWithRowTrailingVariant;
  onPress?: () => void;
  testId?: string;
};

export type PayWithSectionConfig = {
  id: string;
  title: string;
  rows: PayWithRowConfig[];
  testId?: string;
};
