import React, { useState, useMemo, useEffect, useContext, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  IconName,
  IconSize,
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
import { getNotifySnaps, getThirdPartyNotifySnaps } from '../../selectors';
import {
  selectIsFeatureAnnouncementsEnabled,
  selectIsMetamaskNotificationsEnabled,
  getMetamaskNotifications,
} from '../../selectors/metamask-notifications/metamask-notifications';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../helpers/constants/design-system';
import {
  deleteExpiredNotifications,
  showConfirmTurnOnMetamaskNotifications,
} from '../../store/actions';
import { selectIsBackupAndSyncEnabled } from '../../selectors/identity/backup-and-sync';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { NewFeatureTag } from './NewFeatureTag';
import { NotificationsList, TAB_KEYS } from './notifications-list';

export type Notification = NotificationServicesController.Types.INotification;

const { TRIGGER_TYPES, TRIGGER_TYPES_WALLET_SET } =
  NotificationServicesController.Constants;

// NOTE - these 2 data sources are combined in our controller.
// FUTURE - we could separate these data sources into separate methods.
const useMetaMaskNotifications = () => {
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
          (n) =>
            n.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT &&
            n.type !== TRIGGER_TYPES.SNAP,
        )
      : [];
  }, [isMetamaskNotificationsEnabled, notificationsData]);

  const snapNotifications = useMemo(() => {
    return (notificationsData ?? []).filter(
      (n) => n.type === TRIGGER_TYPES.SNAP,
    );
  }, [notificationsData]);

  return {
    featureAnnouncementNotifications,
    walletNotifications,
    snapNotifications,
  };
};

const useCombinedNotifications = () => {
  const {
    featureAnnouncementNotifications,
    walletNotifications,
    snapNotifications,
  } = useMetaMaskNotifications();

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

export const filterNotifications = (
  activeTab: TAB_KEYS,
  notifications: Notification[],
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
    return notifications.filter(
      (notification) => notification.type === TRIGGER_TYPES.SNAP,
    );
  }

  return notifications;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function Notifications() {
  const navigate = useNavigate();
  const t = useI18nContext();
  const dispatch = useDispatch();

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

  useEffect(() => {
    dispatch(deleteExpiredNotifications());
  }, [dispatch]);

  const trackEvent = useContext(MetaMetricsContext);

  // Track if modal was dismissed in this session to avoid re-showing
  const modalDismissedRef = useRef(false);

  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  // Check if the turn on notifications modal is currently open
  const currentModalName = useSelector(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => state.appState.modal.modalState?.name,
  );
  const isModalAlreadyOpen =
    currentModalName === 'TURN_ON_METAMASK_NOTIFICATIONS';

  let hasThirdPartyNotifySnaps = false;
  hasThirdPartyNotifySnaps = useSelector(getThirdPartyNotifySnaps).length > 0;
  console.log(useSelector(getThirdPartyNotifySnaps));
  useEffect(() => {
    const shouldShowEnableModal =
      !hasThirdPartyNotifySnaps &&
      !isMetamaskNotificationsEnabled &&
      !isModalAlreadyOpen &&
      !modalDismissedRef.current &&
      !isLoading &&
      !error;

    if (shouldShowEnableModal) {
      trackEvent({
        category: MetaMetricsEventCategory.NotificationsActivationFlow,
        event: MetaMetricsEventName.NotificationsActivated,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          action_type: 'started',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_profile_syncing_enabled: isBackupAndSyncEnabled,
        },
      });
      dispatch(showConfirmTurnOnMetamaskNotifications());
    }
  }, [
    dispatch,
    hasThirdPartyNotifySnaps,
    isMetamaskNotificationsEnabled,
    isModalAlreadyOpen,
    isLoading,
    error,
    isBackupAndSyncEnabled,
    // Removed trackEvent from dependencies to prevent unnecessary re-renders
  ]);

  // Track when modal is dismissed
  useEffect(() => {
    if (
      currentModalName !== 'TURN_ON_METAMASK_NOTIFICATIONS' &&
      modalDismissedRef.current === false
    ) {
      // Modal was closed, mark as dismissed for this session
      modalDismissedRef.current = true;
    }
  }, [currentModalName]);

  return (
    <NotificationsPage>
      {/* Back and Settings Buttons */}
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={() => {
              navigate(DEFAULT_ROUTE);
            }}
            data-testid="back-button"
          />
        }
        endAccessory={
          <ButtonIcon
            ariaLabel="Notifications Settings"
            iconName={IconName.Setting}
            size={ButtonIconSize.Md}
            iconProps={{
              size: IconSize.Lg,
            }}
            onClick={() => {
              navigate(NOTIFICATIONS_SETTINGS_ROUTE);
            }}
            data-testid="notifications-settings-button"
          />
        }
        marginBottom={0}
      >
        {t('notifications')}
      </Header>
      <Content padding={0}>
        {hasNotifySnaps && (
          <Tabs
            defaultActiveTabKey={activeTab}
            onTabClick={(tab: string) => setActiveTab(tab as TAB_KEYS)}
            tabListProps={{ className: 'px-4' }}
          >
            <Tab
              data-testid={TAB_KEYS.ALL}
              name={t('all')}
              tabKey={TAB_KEYS.ALL}
            />
            <Tab
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
