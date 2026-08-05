import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

export type SecurityTrustTranslate = (
  key: string,
  substitutions?: string[],
) => string;

export type SecurityTrustInlineBadgeConfig = {
  icon: IconName;
  iconColor: IconColor;
  alertSeverity?: 'success' | 'warning' | 'danger';
  label: string | null;
  accessibleLabel?: string;
  backgroundColor?: 'warning-muted' | 'error-muted';
  textColor?: TextColor;
};

export const getSecurityTrustBadgeConfig = (
  resultType: string | undefined,
  t: SecurityTrustTranslate,
): SecurityTrustInlineBadgeConfig | null => {
  switch (resultType) {
    case 'Verified':
      return {
        icon: IconName.VerifiedFilled,
        iconColor: IconColor.InfoDefault,
        label: null,
        accessibleLabel: t('securityTrustVerified'),
      };
    case 'Warning':
    case 'Spam':
      return {
        icon: IconName.Warning,
        iconColor: IconColor.WarningDefault,
        alertSeverity: 'warning',
        label: t('securityTrustRisky'),
        backgroundColor: 'warning-muted',
        textColor: TextColor.WarningDefault,
      };
    case 'Malicious':
      return {
        icon: IconName.Danger,
        iconColor: IconColor.ErrorDefault,
        alertSeverity: 'danger',
        label: t('securityTrustMalicious'),
        backgroundColor: 'error-muted',
        textColor: TextColor.ErrorDefault,
      };
    default:
      return null;
  }
};

type SecurityTrustInlineBadgeProps = {
  badge: SecurityTrustInlineBadgeConfig;
  testId?: string;
  onClick?: () => void;
};

export const SecurityTrustInlineBadge = ({
  badge,
  testId,
  onClick,
}: SecurityTrustInlineBadgeProps) => {
  if (badge.label === null) {
    const verifiedIcon = (
      <Icon
        aria-label={badge.accessibleLabel}
        data-testid={onClick ? undefined : testId}
        name={badge.icon}
        size={IconSize.Sm}
        color={badge.iconColor}
      />
    );

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          data-testid={testId}
          aria-label={badge.accessibleLabel ?? testId ?? 'security-badge'}
          className="cursor-pointer border-0 bg-transparent p-0 leading-none"
        >
          {verifiedIcon}
        </button>
      );
    }

    return verifiedIcon;
  }

  const tagBackgroundClass =
    badge.backgroundColor === 'warning-muted'
      ? 'bg-warning-muted'
      : 'bg-error-muted';

  const tag = (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      className={`inline-flex self-start items-center gap-1 rounded-md px-2 py-0.5 ${tagBackgroundClass}`}
      data-testid={onClick ? undefined : testId}
    >
      <Icon name={badge.icon} size={IconSize.Sm} color={badge.iconColor} />
      <Text
        variant={TextVariant.BodyXs}
        color={badge.textColor}
        fontWeight={FontWeight.Medium}
      >
        {badge.label}
      </Text>
    </Box>
  );

  if (!onClick) {
    return tag;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="cursor-pointer border-0 bg-transparent p-0"
    >
      {tag}
    </button>
  );
};

export const SecurityTrustVerifiedBadge = ({
  badge,
  testId = 'security-badge-verified',
  onClick,
}: {
  badge: SecurityTrustInlineBadgeConfig;
  testId?: string;
  onClick?: () => void;
}) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    data-testid={onClick ? undefined : testId}
  >
    <SecurityTrustInlineBadge badge={badge} testId={testId} onClick={onClick} />
  </Box>
);
