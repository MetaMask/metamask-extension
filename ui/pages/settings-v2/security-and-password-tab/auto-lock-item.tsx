import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPreferences } from '../../../selectors';
import { AUTO_LOCK_ROUTE } from '../../../helpers/constants/routes';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../../shared/constants/preferences';
import { SettingsSelectItem } from '../shared';
import { formatAutoLockLabel } from './auto-lock-utils';

const AutoLockItem = () => {
  const t = useI18nContext();
  const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT } =
    useSelector(getPreferences);

  return (
    <SettingsSelectItem
      label={t('autoLock')}
      value={formatAutoLockLabel(
        autoLockTimeLimit,
        t as (key: string, substitutions?: string[]) => string,
      )}
      to={AUTO_LOCK_ROUTE}
    />
  );
};

AutoLockItem.displayName = 'AutoLockItem';

export default AutoLockItem;
