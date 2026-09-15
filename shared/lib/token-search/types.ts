import { IconColor, IconName, TextColor } from '@metamask/design-system-react';

export type TokenTrustConfig = {
  icon: IconName;
  iconColor: IconColor;
  alertSeverity?: 'success' | 'warning' | 'danger';
  label: string | null;
  accessibleLabel?: string;
  backgroundColor?: 'warning-muted' | 'error-muted';
  textColor?: TextColor;
};
