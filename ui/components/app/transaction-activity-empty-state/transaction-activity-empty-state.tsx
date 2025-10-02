import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { twMerge } from '@metamask/design-system-react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { EthMethod } from '@metamask/keyring-api';
import { TabEmptyState } from '../../ui/tab-empty-state';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTheme } from '../../../hooks/useTheme';
import { getUseExternalServices } from '../../../selectors';
import { MetaMetricsSwapsEventSource } from '../../../../shared/constants/metametrics';
import useBridging from '../../../hooks/bridge/useBridging';
import { ThemeType } from '../../../../shared/constants/preferences';

export type TransactionActivityEmptyStateProps = {
  /**
   * Additional className to apply to the component
   */
  className?: string;
  /**
   * The account to use for swap logic
   */
  account: InternalAccount;
};

export const TransactionActivityEmptyState: React.FC<
  TransactionActivityEmptyStateProps
> = ({ className, account }) => {
  const t = useI18nContext();
  const theme = useTheme();
  const isSigningEnabled =
    account.methods.includes(EthMethod.SignTransaction) ||
    account.methods.includes(EthMethod.SignUserOperation);
  const isExternalServicesEnabled = useSelector(getUseExternalServices);

  const { openBridgeExperience } = useBridging();

  const activityIcon =
    theme === ThemeType.dark
      ? './images/empty-state-activity-dark.png'
      : './images/empty-state-activity-light.png';

  const handleSwapOnClick = useCallback(async () => {
    openBridgeExperience(
      MetaMetricsSwapsEventSource.ActivityTabEmptyState,
      undefined, // No specific token
      true, // isSwap = true
    );
  }, [openBridgeExperience]);

  // Determine if swap button should be enabled
  const isSwapButtonEnabled = isSigningEnabled && isExternalServicesEnabled;

  return (
    <TabEmptyState
      icon={
        <img src={activityIcon} alt={t('activity')} width={72} height={72} />
      }
      description={t('activityEmptyDescription')}
      actionButtonText={t('swapTokens')}
      actionButtonProps={{
        isDisabled: !isSwapButtonEnabled,
      }}
      onAction={handleSwapOnClick}
      data-testid="activity-tab-empty-state"
      className={twMerge('max-w-48', className)}
    />
  );
};
