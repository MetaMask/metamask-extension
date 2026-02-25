import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setFeatureNotificationsEnabled } from '../../../store/actions';
import { getFeatureNotificationsEnabled } from '../../../selectors';
import { SettingsToggleItem } from '../settings-toggle-item';

export type NotificationsItemProps = {
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export const NotificationsItem = ({ sectionRef }: NotificationsItemProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const value = useSelector(getFeatureNotificationsEnabled);

  return (
    <SettingsToggleItem
      title={t('notificationsFeatureToggle')}
      description={t('notificationsFeatureToggleDescription')}
      value={value}
      onToggle={(newValue) =>
        dispatch(setFeatureNotificationsEnabled(!newValue))
      }
      dataTestId="toggle-notifications"
      sectionRef={sectionRef}
    />
  );
};
