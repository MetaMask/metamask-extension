import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { CURRENCY_ROUTE } from '../../../helpers/constants/routes';
import { SettingsSelectItem } from '../shared';

export const LocalCurrencyItem = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const currentCurrency = useSelector(getCurrentCurrency);

  const handleCurrencyPress = () => {
    navigate(CURRENCY_ROUTE);
  };

  return (
    <SettingsSelectItem
      label={t('localCurrency')}
      value={currentCurrency.toUpperCase()}
      onPress={handleCurrencyPress}
    />
  );
};
