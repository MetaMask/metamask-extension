import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  IconName,
  ButtonIcon,
  ButtonIconSize,
  Box,
} from '../../components/component-library';
import { Tabs, Tab } from '../../components/ui/tabs';
import {
  DEFAULT_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
} from '../../helpers/constants/routes';
import { NotificationsPage } from '../../components/multichain';
import { Content, Header } from '../../components/multichain/pages/page';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import { useUnreadNotificationsCounter } from '../../hooks/metamask-notifications/useCounter';
import { getNotifications, getNotifySnaps } from '../../selectors';
import {
  selectIsFeatureAnnouncementsEnabled,
  selectIsMetamaskNotificationsEnabled,
  getMetamaskNotifications,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { deleteExpiredNotifications } from '../../store/actions';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { NotificationsList } from './notifications-list';
import { processSnapNotifications } from './snap/utils/utils';
import { SnapNotification } from './snap/types/types';
import { NewFeatureTag } from './NewFeatureTag';

type Notification = NotificationServicesController.Types.INotification;

const { TRIGGER_TYPES, TRIGGER_TYPES_WALLET_SET } =
  NotificationServicesController.Constants;

export type NotificationType = Notification | SnapNotification;

// NOTE - Tab filters could change once we support more notifications.
export const enum TAB_KEYS {
  // Shows all notifications
  ALL = 'notifications-all-tab',

  // These are only on-chain notifications (no snaps or feature announcements)
  WALLET = 'notifications-wallet-tab',

  // These are 3rd party notifications (snaps, feature announcements, web3 alerts)
  WEB3 = 'notifications-other-tab',
}

// Cleanup method to ensure we aren't keeping really old notifications.
// See internals to tweak expiry date
const useEffectDeleteExpiredNotifications = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(deleteExpiredNotifications());
    };
  }, [dispatch]);
};

const useSnapNotifications = () => {
  const snapNotifications = useSelector(getNotifications);

  const processedSnapNotifications: SnapNotification[] = useMemo(() => {
    return processSnapNotifications(snapNotifications);
  }, [snapNotifications]);

  return processedSnapNotifications;
};

// NOTE - these 2 data sources are combined in our controller.
// FUTURE - we could separate these data sources into separate methods.
const useFeatureAnnouncementAndWalletNotifications = () => {
  const isFeatureAnnouncementsEnabled = useSelector(
    selectIsFeatureAnnouncementsEnabled,
  );

  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  const notificationsData = useSelector(getMetamaskNotifications);

  const featureAnnouncementNotifications = useMemo(() => {
    return isFeatureAnnouncementsEnabled
      ? (notificationsData ?? []).filter(
          (n) => n.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        )
      : [];
  }, [isFeatureAnnouncementsEnabled, notificationsData]);

  const walletNotifications = useMemo(() => {
    return isMetamaskNotificationsEnabled
      ? (notificationsData ?? []).filter(
          (n) => n.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        )
      : [];
  }, [isMetamaskNotificationsEnabled, notificationsData]);

  return {
    featureAnnouncementNotifications,
    walletNotifications,
  };
};

const useCombinedNotifications = () => {
  const snapNotifications = useSnapNotifications();
  const { featureAnnouncementNotifications, walletNotifications } =
    useFeatureAnnouncementAndWalletNotifications();

  const combinedNotifications = useMemo(() => {
    const notifications = [
      ...snapNotifications,
      ...featureAnnouncementNotifications,
      ...walletNotifications,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return notifications;
  }, [
    snapNotifications,
    featureAnnouncementNotifications,
    walletNotifications,
  ]);

  return combinedNotifications;
};

const filterNotifications = (
  activeTab: TAB_KEYS,
  notifications: NotificationType[],
) => {
  if (activeTab === TAB_KEYS.ALL) {
    return notifications;
  }

  if (activeTab === TAB_KEYS.WALLET) {
    return notifications.filter(
      (notification) =>
        TRIGGER_TYPES_WALLET_SET.has(notification.type) ||
        notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
    );
  }

  if (activeTab === TAB_KEYS.WEB3) {
    return notifications.filter((notification) => notification.type === 'SNAP');
  }

  return notifications;
};

export default function Notifications() {
  const history = useHistory();
  const t = useI18nContext();

  useEffectDeleteExpiredNotifications();
  const { isLoading, error } = useMetamaskNotificationsContext();

  const [activeTab, setActiveTab] = useState<TAB_KEYS>(TAB_KEYS.ALL);
  const combinedNotifications = useCombinedNotifications();
  const { notificationsUnreadCount } = useUnreadNotificationsCounter();
  const filteredNotifications = useMemo(
    () => filterNotifications(activeTab, combinedNotifications),
    [activeTab, combinedNotifications],
  );

  let hasNotifySnaps = false;
  hasNotifySnaps = useSelector(getNotifySnaps).length > 0;

  return (
    <NotificationsPage>
      {/* Back and Settings Buttons */}
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() => {
              history.push(DEFAULT_ROUTE);
            }}
            data-testid="back-button"
          />
        }
        endAccessory={
          <ButtonIcon
            ariaLabel="Notifications Settings"
            iconName={IconName.Setting}
            size={ButtonIconSize.Sm}
            onClick={() => {
              history.push(NOTIFICATIONS_SETTINGS_ROUTE);
            }}
            data-testid="notifications-settings-button"
          />
        }
        marginBottom={0}
      >
        {t('notifications')}
      </Header>
      <Content paddingLeft={0} paddingRight={0} paddingTop={0}>
        {hasNotifySnaps && (
          <Tabs
            defaultActiveTabKey={activeTab}
            onTabClick={(tab) => setActiveTab(tab)}
            tabsClassName="notifications__tabs"
          >
            <Tab
              activeClassName="notifications__tab--active"
              className="notifications__tab"
              data-testid={TAB_KEYS.ALL}
              name={t('all')}
              tabKey={TAB_KEYS.ALL}
            />
            <Tab
              activeClassName="notifications__tab--active"
              className="notifications__tab"
              data-testid={TAB_KEYS.WALLET}
              name={
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.center}
                  alignItems={AlignItems.center}
                  gap={2}
                >
                  {t('wallet')}
                  <NewFeatureTag />
                </Box>
              }
              tabKey={TAB_KEYS.WALLET}
            ></Tab>
            <Tab
              activeClassName="notifications__tab--active"
              className="notifications__tab"
              data-testid={TAB_KEYS.WEB3}
              name={t('web3')}
              tabKey={TAB_KEYS.WEB3}
            />
          </Tabs>
        )}
        <NotificationsList
          activeTab={activeTab}
          notifications={filteredNotifications}
          isLoading={isLoading}
          isError={Boolean(error)}
          notificationsCount={notificationsUnreadCount}
        />
      </Content>
    </NotificationsPage>
  );
}
