import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setFeatureNotificationsEnabled } from '../../../store/actions';
import { getFeatureNotificationsEnabled } from '../../../selectors';
import { ExperimentalTabItem } from './experimental-tab-item';

export type NotificationsItemProps = {
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export const NotificationsItem = ({ sectionRef }: NotificationsItemProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const toggleValue = useSelector(getFeatureNotificationsEnabled);

  return (
    <ExperimentalTabItem
      title={t('notificationsFeatureToggle')}
      description={t('notificationsFeatureToggleDescription')}
      toggleValue={toggleValue}
      toggleCallback={(value) =>
        dispatch(setFeatureNotificationsEnabled(!value))
      }
      toggleDataTestId="toggle-notifications"
      sectionRef={sectionRef}
    />
  );
};
