import React from 'react';
import {
  twMerge,
  Box,
  BoxBackgroundColor,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { TabEmptyState } from '../../../ui/tab-empty-state';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type PerpsEmptyStateProps = {
  /** Additional CSS class names */
  className?: string;
  /** Callback when the CTA button is clicked */
  onStartTrade?: () => void;
};

/**
 * PerpsEmptyState displays a placeholder when the user has no positions or orders
 *
 * @param options0 - Component props
 * @param options0.className - Additional CSS class names
 * @param options0.onStartTrade - Callback when the CTA button is clicked
 */
export const PerpsEmptyState: React.FC<PerpsEmptyStateProps> = ({
  className,
  onStartTrade,
}) => {
  const t = useI18nContext();

  // TODO: Replace with themed perps image when available
  const placeholderIcon = (
    <Box
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      className="rounded-full"
      padding={4}
    >
      <Icon
        name={IconName.TrendUp}
        size={IconSize.Xl}
        color={IconColor.IconAlternative}
      />
    </Box>
  );

  return (
    <TabEmptyState
      icon={placeholderIcon}
      description={t('perpsEmptyDescription')}
      actionButtonText={t('perpsStartTrading')}
      onAction={onStartTrade}
      data-testid="perps-tab-empty-state"
      className={twMerge('mx-auto mt-5 mb-6 max-w-48', className)}
    />
  );
};

export default PerpsEmptyState;
