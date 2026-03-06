import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getTheme } from '../../../selectors';
import { THEME_ROUTE } from '../../../helpers/constants/routes';
import { ThemeType } from '../../../../shared/constants/preferences';
import { SettingsSelectItem } from '../shared';

const THEME_LABEL_KEYS: Record<ThemeType, string> = {
  [ThemeType.light]: 'lightTheme',
  [ThemeType.dark]: 'darkTheme',
  [ThemeType.os]: 'osTheme',
};

export const ThemeItem = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const theme = useSelector(getTheme) as ThemeType;

  const handleThemePress = () => {
    navigate(THEME_ROUTE);
  };

  const themeLabelKey =
    THEME_LABEL_KEYS[theme] ?? THEME_LABEL_KEYS[ThemeType.os];

  return (
    <SettingsSelectItem
      label={t('theme')}
      value={t(themeLabelKey)}
      onPress={handleThemePress}
      ariaLabel={t('theme')}
    />
  );
};
