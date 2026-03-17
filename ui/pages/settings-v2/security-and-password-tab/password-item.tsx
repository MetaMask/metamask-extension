import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SECURITY_PASSWORD_CHANGE_ROUTE } from '../../../helpers/constants/routes';
import { SettingsSelectItem } from '../shared';

const PasswordItem = () => {
  const t = useI18nContext();

  return (
    <SettingsSelectItem
      label={t('password')}
      value=""
      to={SECURITY_PASSWORD_CHANGE_ROUTE}
    />
  );
};

PasswordItem.displayName = 'PasswordItem';

export default PasswordItem;
