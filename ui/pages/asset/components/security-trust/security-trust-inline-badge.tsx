import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
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
