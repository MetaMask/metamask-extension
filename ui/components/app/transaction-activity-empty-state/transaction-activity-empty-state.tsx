import React from 'react';
import { twMerge } from '@metamask/design-system-react';
import { TabEmptyState } from '../../ui/tab-empty-state';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeType } from '../../../../shared/constants/preferences';

export type TransactionActivityEmptyStateProps = {
  /**
   * Additional className to apply to the component
   */
  className?: string;
};

export const TransactionActivityEmptyState: React.FC<
  TransactionActivityEmptyStateProps
> = ({ className }) => {
  const t = useI18nContext();
  const theme = useTheme();

  // Theme-aware icon selection
  const activityIcon =
    theme === ThemeType.dark
      ? './images/empty-state-activity-dark.png'
      : './images/empty-state-activity-light.png';

  return (
    <TabEmptyState
      icon={
        <img src={activityIcon} alt={t('activity')} width={72} height={72} />
      }
      description={t('activityEmptyDescription')}
      data-testid="activity-tab-empty-state"
      className={twMerge('max-w-64', className)}
    />
  );
};
