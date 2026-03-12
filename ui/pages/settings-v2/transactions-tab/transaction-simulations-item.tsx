import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TRANSACTION_SIMULATIONS_LEARN_MORE_LINK } from '../../../../shared/lib/ui-utils';
import { setUseTransactionSimulations } from '../../../store/actions';
import { getIsActiveShieldSubscription } from '../../../selectors/subscription';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const TransactionSimulationsItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const useTransactionSimulations = useSelector(
    (state: { metamask?: { useTransactionSimulations?: boolean } }) =>
      state.metamask?.useTransactionSimulations,
  );
  const hasActiveShieldSubscription = useSelector(
    getIsActiveShieldSubscription,
  );

  const description = t('simulationsSettingDescription', [
    <a
      key="learn_more_link"
      href={TRANSACTION_SIMULATIONS_LEARN_MORE_LINK}
      rel="noopener noreferrer"
      target="_blank"
      className="font-medium text-primary-default"
    >
      {t('learnMoreUpperCase')}
    </a>,
  ]);

  return (
    <SettingsToggleItem
      title={t('simulationsSettingSubHeader')}
      description={description}
      value={Boolean(useTransactionSimulations)}
      onToggle={(value: boolean) =>
        dispatch(setUseTransactionSimulations(!value))
      }
      containerDataTestId="useTransactionSimulations"
      dataTestId="useTransactionSimulations-toggle"
      disabled={hasActiveShieldSubscription}
    />
  );
};
