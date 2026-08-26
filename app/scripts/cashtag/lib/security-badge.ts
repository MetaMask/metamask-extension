import { IconColor, IconName } from '@metamask/design-system-react';
import type { SecurityTrustInlineBadgeConfig } from '#ui/components/app/security-trust';

/**
 * Local, string-literal reimplementation of getSecurityTrustBadgeConfig
 * (ui/components/app/security-trust/security-trust-inline-badge.tsx). The
 * cashtag widget has no i18n context, so it can't call the shared function's
 * `t()` argument.
 *
 * Unlike the shared version, every result type renders icon-only here: the
 * ticker-list "Name" column is a fixed narrow width, and a labelled pill
 * (e.g. "Risky") doesn't shrink, so it was squeezing the ticker text out
 * entirely instead of sharing the row with it.
 */
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

/**
 * Local reimplementation of getResultTypeConfig's 'Verified' case
 * (ui/pages/asset/utils/security-utils.ts), for the token-detail pill. Only
 * 'Verified' has a detail-page treatment today.
 */
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
