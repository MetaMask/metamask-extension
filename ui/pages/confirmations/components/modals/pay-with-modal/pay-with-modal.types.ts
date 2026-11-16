import type { ReactNode } from 'react';

export type PayWithRowTrailingVariant = 'checkmark' | 'chevron' | 'none';

export type PayWithRowTagRenderer = () => ReactNode;

export type PayWithRowConfig = {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  isSelected?: boolean;
  tagRenderers?: PayWithRowTagRenderer[];
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
