import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Icon,
  IconSize,
  TextColor,
} from '@metamask/design-system-react';
import { Tag } from '../../../../components/component-library';
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
          aria-label={testId ?? 'security-badge'}
          className="cursor-pointer border-0 bg-transparent p-0 leading-none"
        >
          {verifiedIcon}
        </button>
      );
    }

    return verifiedIcon;
  }

  const backgroundColor =
    badge.backgroundColor === 'warning-muted'
      ? BackgroundColor.warningMuted
      : BackgroundColor.errorMuted;

  const tag = (
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
