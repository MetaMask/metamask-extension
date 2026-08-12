import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { PermissionsEmptyState } from '../../gator-permissions/components';

export const NoConnectionContent = () => {
  const t = useI18nContext();

  return (
    <PermissionsEmptyState
      description={t('noConnectionDescription')}
      descriptionTestId="no-connection-description"
    />
  );
};
