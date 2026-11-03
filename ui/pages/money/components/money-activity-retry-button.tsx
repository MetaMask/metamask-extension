import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type MoneyActivityRetryButtonProps = {
  className: string;
  onClick: () => void;
};

/**
 * Retry control for Accounts API load failures on the Money Activity page.
 *
 * @param options0 - Component props.
 * @param options0.className - Spacing around the button.
 * @param options0.onClick - Refetch handler.
 * @returns The retry button.
 */
export function MoneyActivityRetryButton({
  className,
  onClick,
}: MoneyActivityRetryButtonProps) {
  const t = useI18nContext();

  return (
    <Button
      variant={ButtonVariant.Secondary}
      size={ButtonSize.Md}
      className={className}
      onClick={onClick}
      data-testid="money-activity-retry"
    >
      {t('moneyActivityRetry')}
    </Button>
  );
}
