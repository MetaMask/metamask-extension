import React from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ButtonIcon, IconName, IconSize } from '../../component-library';
import { useUnreadNotificationsCounter, useReadNotificationsCounter } from '../../../hooks/metamask-notifications/useCounter';
import { selectIsMetamaskNotificationsEnabled, selectIsMetamaskNotificationsFeatureSeen } from '../../../selectors/metamask-notifications/metamask-notifications';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import { showConfirmTurnOnMetamaskNotifications } from '../../../store/actions';
import { NOTIFICATIONS_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory, MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { NotificationsTagCounter } from '../notifications-tag-counter';

export const NotificationsButton = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = React.useContext(MetaMetricsContext);
  const { notificationsUnreadCount } = useUnreadNotificationsCounter();
  const { notificationsReadCount } = useReadNotificationsCounter();
  const isMetamaskNotificationsEnabled = useSelector(selectIsMetamaskNotificationsEnabled);
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isMetamaskNotificationFeatureSeen = useSelector(selectIsMetamaskNotificationsFeatureSeen);
  // 这里可以根据需要引入 getThirdPartyNotifySnaps 判断
  // const hasThirdPartyNotifySnaps = useSelector(getThirdPartyNotifySnaps).length > 0;
  // 这里只保留主流程

  const handleNotificationsClick = () => {
    // const shouldShowEnableModal = !hasThirdPartyNotifySnaps && !isMetamaskNotificationsEnabled;
    const shouldShowEnableModal = !isMetamaskNotificationsEnabled;
    if (shouldShowEnableModal) {
      trackEvent({
        category: MetaMetricsEventCategory.NotificationsActivationFlow,
        event: MetaMetricsEventName.NotificationsActivated,
        properties: {
          action_type: 'started',
          is_profile_syncing_enabled: isBackupAndSyncEnabled,
        },
      });
      dispatch(showConfirmTurnOnMetamaskNotifications());
      return;
    }
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationsMenuOpened,
      properties: {
        unread_count: notificationsUnreadCount,
        read_count: notificationsReadCount,
      },
    });
    history.push(NOTIFICATIONS_ROUTE);
  };

  return (
    <ButtonIcon
      iconName={IconName.Notification}
      ariaLabel={t('notifications')}
      onClick={handleNotificationsClick}
      size={IconSize.Md}
      style={{ position: 'relative' }}
    >
      <NotificationsTagCounter noLabel />
      {/* 可选：未读红点/数字，可用 NotificationsTagCounter 组件 */}
      {notificationsUnreadCount === 0 && !isMetamaskNotificationFeatureSeen && (
        <span className="new-feature-tag" />
      )}
    </ButtonIcon>
  );
};
