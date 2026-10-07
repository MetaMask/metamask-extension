import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrencyRateControllerCurrentCurrency as getCurrentCurrency } from '../../../../shared/lib/selectors/assets-migration';
import { CURRENCY_ROUTE } from '../../../helpers/constants/routes';
import { SettingsSelectItem } from '../shared/settings-select-item';
import { PREFERENCES_ITEMS } from '../search-config';

export const LocalCurrencyItem = () => {
  const t = useI18nContext();
  const currentCurrency = useSelector(getCurrentCurrency);

  return (
    <SettingsSelectItem
      label={t(PREFERENCES_ITEMS['local-currency'])}
      to={CURRENCY_ROUTE}
      value={currentCurrency.toUpperCase()}
    />
  );
};
