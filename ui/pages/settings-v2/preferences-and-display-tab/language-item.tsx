import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { LANGUAGE_ROUTE } from '../../../helpers/constants/routes';
import { SettingsSelectItem } from '../shared';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import type { MetaMaskReduxState } from '../../../store/store';

const localeMap = new Map(locales.map(({ code, name }) => [code, name]));

export const LanguageItem = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const currentLocale = useSelector(
    (state: MetaMaskReduxState) => state.metamask.currentLocale,
  );

  const handleLanguagePress = () => {
    navigate(LANGUAGE_ROUTE);
  };

  const localeName = localeMap.get(currentLocale) ?? currentLocale;

  return (
    <SettingsSelectItem
      label={t('language')}
      value={localeName}
      onPress={handleLanguagePress}
      ariaLabel={t('language')}
    />
  );
};
