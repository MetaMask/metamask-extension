import { IconColor, IconName } from '@metamask/design-system-react';
import type { SecurityTrustInlineBadgeConfig } from '#shared/types/tokens';

export function getSecurityInlineBadge(
  resultType: string | null | undefined,
): SecurityTrustInlineBadgeConfig | null {
  switch (resultType) {
    case 'Verified':
      return {
        icon: IconName.VerifiedFilled,
        iconColor: IconColor.InfoDefault,
        label: null,
        accessibleLabel: 'Verified',
      };
    case 'Warning':
    case 'Spam':
      return {
        icon: IconName.Warning,
        iconColor: IconColor.WarningDefault,
        label: null,
        accessibleLabel: 'Risky',
      };
    case 'Malicious':
      return {
        icon: IconName.Danger,
        iconColor: IconColor.ErrorDefault,
        label: null,
        accessibleLabel: 'Malicious',
      };
    default:
      return null;
  }
}

export type SecurityStatusBadge = {
  icon: IconName;
  iconColor: IconColor;
  label: string;
};

export function getSecurityStatusBadge(
  resultType: string | null | undefined,
): SecurityStatusBadge | null {
  if (resultType !== 'Verified') {
    return null;
  }

  return {
    icon: IconName.SecurityTick,
    iconColor: IconColor.SuccessDefault,
    label: 'Verified',
  };
}
