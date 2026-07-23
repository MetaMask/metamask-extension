import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Icon,
  IconSize,
  TextColor,
} from '@metamask/design-system-react';
import {
  Tag,
} from '../../../../components/component-library';
import { IconSize as LegacyIconSize } from '../../../../components/component-library/icon/icon.types';
import {
  BackgroundColor,
  FontWeight,
  TextColor as LegacyTextColor,
} from '../../../../helpers/constants/design-system';
import type { ResultTypeConfig } from '../../utils/security-utils';

export type SecurityTrustInlineBadgeConfig = NonNullable<
  ResultTypeConfig['badge']
>;

type SecurityTrustInlineBadgeProps = {
  badge: SecurityTrustInlineBadgeConfig;
  testId?: string;
};

export const SecurityTrustInlineBadge = ({
  badge,
  testId,
}: SecurityTrustInlineBadgeProps) => {
  if (badge.label === null) {
    return (
      <Icon
        data-testid={testId}
        name={badge.icon}
        size={IconSize.Sm}
        color={badge.iconColor}
      />
    );
  }

  const backgroundColor =
    badge.backgroundColor === 'warning-muted'
      ? BackgroundColor.warningMuted
      : BackgroundColor.errorMuted;

  return (
    <Tag
      label={badge.label}
      iconName={badge.icon}
      backgroundColor={backgroundColor}
      labelProps={{
        color:
          badge.textColor === TextColor.WarningDefault
            ? LegacyTextColor.warningDefault
            : LegacyTextColor.errorDefault,
        fontWeight: FontWeight.Medium,
      }}
      startIconProps={{
        className:
          badge.textColor === TextColor.WarningDefault
            ? 'text-warning-default'
            : 'text-error-default',
        size: LegacyIconSize.Sm,
      }}
    />
  );
};

export const SecurityTrustVerifiedBadge = ({
  badge,
  testId = 'security-badge-verified',
}: {
  badge: SecurityTrustInlineBadgeConfig;
  testId?: string;
}) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    data-testid={testId}
  >
    <SecurityTrustInlineBadge badge={badge} testId={testId} />
  </Box>
);
