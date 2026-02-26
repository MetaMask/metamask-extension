import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getShowNativeTokenAsMainBalance } from '../../../selectors';
import { setShowNativeTokenAsMainBalancePreference } from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const ShowNetworkTokenToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const showNativeTokenAsMainBalance = useSelector(
    getShowNativeTokenAsMainBalance,
  );

  return (
    <SettingsToggleItem
      title={t('showNativeTokenAsMainBalance')}
      value={showNativeTokenAsMainBalance}
      onToggle={(value) => {
        const newValue = !value;
        dispatch(setShowNativeTokenAsMainBalancePreference(newValue));
        trackEvent({
          category: MetaMetricsEventCategory.Settings,
          event: MetaMetricsEventName.SettingsUpdated,
          properties: {
            show_native_token_as_main_balance: newValue,
          },
        });
      }}
      containerDataTestId="show-native-token-as-main-balance"
      dataTestId="show-native-token-as-main-balance"
    />
  );
};
