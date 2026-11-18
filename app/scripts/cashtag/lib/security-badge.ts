import { IconColor, IconName } from '@metamask/design-system-react';
import type { TokenTrustConfig } from '#shared/lib/token-search/types';

export function getSecurityInlineBadge(
  resultType: string | null | undefined,
): TokenTrustConfig | null {
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

type SecurityStatusBadge = {
  icon: IconName;
  iconColor: IconColor;
  label: string;
  tone: 'success' | 'warning' | 'error';
};

export function getSecurityStatusBadge(
  resultType: string | null | undefined,
): SecurityStatusBadge | null {
  switch (resultType) {
    case 'Verified':
      return {
        icon: IconName.SecurityTick,
        iconColor: IconColor.SuccessDefault,
        label: 'Verified',
        tone: 'success',
      };
    case 'Warning':
    case 'Spam':
      return {
        icon: IconName.Warning,
        iconColor: IconColor.WarningDefault,
        label: 'Risky',
        tone: 'warning',
      };
    case 'Malicious':
      return {
        icon: IconName.Danger,
        iconColor: IconColor.ErrorDefault,
        label: 'Malicious',
        tone: 'error',
      };
    default:
      return null;
  }
}
