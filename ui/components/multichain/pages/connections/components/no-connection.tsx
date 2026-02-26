import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTheme } from '../../../../../hooks/useTheme';
import { TabEmptyState } from '../../../../ui/tab-empty-state';
import { ThemeType } from '../../../../../../shared/constants/preferences';

export const NoConnectionContent = () => {
  const t = useI18nContext();
  const theme = useTheme();

  const permissionIcon =
    theme === ThemeType.dark
      ? '/images/empty-state-permissions-dark.png'
      : '/images/empty-state-permissions-light.png';

  return (
    <TabEmptyState
      icon={
        <img
          src={permissionIcon}
          alt={t('noConnectionDescription')}
          width={72}
          height={72}
        />
      }
      description={t('noConnectionDescription')}
      descriptionProps={{
        'data-testid': 'no-connection-description',
      }}
      className="connections-page__no-site-connected-content h-full mx-auto"
    />
  );
};
