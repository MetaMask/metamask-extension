import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { SMART_TRANSACTIONS_LEARN_MORE_URL } from '../../../../shared/constants/smartTransactions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setSmartTransactionsPreferenceEnabled } from '../../../store/actions';
import { getSmartTransactionsPreferenceEnabled } from '../../../../shared/modules/selectors';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const SmartTransactionsItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const value = useSelector(getSmartTransactionsPreferenceEnabled);

  const description = t('stxOptInSupportedNetworksDescription', [
    <a
      key="learn_more"
      href={SMART_TRANSACTIONS_LEARN_MORE_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.PrimaryDefault}
        fontWeight={FontWeight.Medium}
      >
        {t('learnMoreUpperCase')}
      </Text>
    </a>,
  ]);

  return (
    <SettingsToggleItem
      title={t('smartTransactions')}
      description={description}
      value={value}
      onToggle={(oldValue: boolean) =>
        dispatch(setSmartTransactionsPreferenceEnabled(!oldValue))
      }
      containerDataTestId="advanced-setting-enable-smart-transactions"
      dataTestId="settings-page-stx-opt-in-toggle"
    />
  );
};
