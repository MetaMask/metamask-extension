import React, { useDeferredValue, useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  type INotification,
  TRIGGER_TYPES,
  NOTIFICATION_API_TRIGGER_TYPES_SET,
} from '@metamask/notification-services-controller/notification-services';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
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
  PREVIOUS_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
} from '../../helpers/constants/routes';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import { useUnreadNotificationsCounter } from '../../hooks/metamask-notifications/useCounter';
import { useSafeState } from '../../hooks/metamask-notifications/useNotifications';
import { getNotifySnaps } from '../../selectors';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsFeatureAnnouncementsEnabled,
  getMetamaskNotifications,
  getIsUpdatingMetamaskNotifications,
  isFetchingMetamaskNotifications,
} from '../../selectors/metamask-notifications/metamask-notifications';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../helpers/constants/design-system';
import {
  deleteExpiredNotifications,
  getNotificationPreferences,
} from '../../store/actions';
import { useGlobalMenuRouteTransition } from '../routes/global-menu-route-transition';
import { useDispatch } from '../../store/hooks';
import { useNotificationListPerformance } from '../../hooks/metamask-notifications/useNotificationListPerformance';
import { NotificationsList, TAB_KEYS } from './notifications-list';
import { NewFeatureTag } from './NewFeatureTag';

const useFeatureAnnouncementsEnabled = () => {
  const dispatch = useDispatch();
  const featureAnnouncementsEnabledInState = useSelector(
    selectIsFeatureAnnouncementsEnabled,
  );
  const [areFeatureAnnouncementsEnabled, setAreFeatureAnnouncementsEnabled] =
    useSafeState(featureAnnouncementsEnabledInState);
  const [
    isFeatureAnnouncementPreferencePending,
    setIsFeatureAnnouncementPreferencePending,
  ] = useSafeState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const preferences = (await dispatch(
          getNotificationPreferences(),
        )) as unknown as NotificationPreferences | null;

        setAreFeatureAnnouncementsEnabled(
          Boolean(preferences?.marketing.inAppNotificationsEnabled),
        );
      } catch {
        setAreFeatureAnnouncementsEnabled(
          Boolean(featureAnnouncementsEnabledInState),
        );
      } finally {
        setIsFeatureAnnouncementPreferencePending(false);
      }
    };

    loadPreferences();
  }, [
    dispatch,
    featureAnnouncementsEnabledInState,
    setAreFeatureAnnouncementsEnabled,
    setIsFeatureAnnouncementPreferencePending,
  ]);

  return {
    areFeatureAnnouncementsEnabled,
    isFeatureAnnouncementPreferencePending,
  };
};

// NOTE - these 2 data sources are combined in our controller.
// FUTURE - we could separate these data sources into separate methods.
const useMetaMaskNotifications = () => {
  const {
    areFeatureAnnouncementsEnabled,
    isFeatureAnnouncementPreferencePending,
  } = useFeatureAnnouncementsEnabled();

  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  const notificationsData = useSelector(getMetamaskNotifications);

  const featureAnnouncementNotifications = useMemo(() => {
    return areFeatureAnnouncementsEnabled
      ? (notificationsData ?? []).filter(
          (n) => n.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        )
      : [];
  }, [areFeatureAnnouncementsEnabled, notificationsData]);

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
    isFeatureAnnouncementPreferencePending,
  };
};

const useCombinedNotifications = () => {
  const {
    featureAnnouncementNotifications,
    walletNotifications,
    snapNotifications,
    isFeatureAnnouncementPreferencePending,
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

  return {
    combinedNotifications,
    isFeatureAnnouncementPreferencePending,
  };
};

export const filterNotifications = (
  activeTab: TAB_KEYS,
  notifications: INotification[],
) => {
  if (activeTab === TAB_KEYS.ALL) {
    return notifications;
  }

  if (activeTab === TAB_KEYS.WALLET) {
    return notifications.filter(
      (notification) =>
        NOTIFICATION_API_TRIGGER_TYPES_SET.has(notification.type) ||
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

export default function Notifications() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const runCloseTransition = useGlobalMenuRouteTransition();
  const t = useI18nContext();
  const dispatch = useDispatch();

  const fromPath = searchParams.get('from') ?? undefined;

  const handleBack = () => {
    if (fromPath === DEFAULT_ROUTE) {
      runCloseTransition(() => navigate(PREVIOUS_ROUTE));
    } else {
      navigate(DEFAULT_ROUTE);
    }
  };

  const {
    isLoading,
    error,
    traceLifecycle = { isPending: false, error: undefined },
  } = useMetamaskNotificationsContext();

  const [activeTab, setActiveTab] = useState<TAB_KEYS>(TAB_KEYS.ALL);
  const { combinedNotifications, isFeatureAnnouncementPreferencePending } =
    useCombinedNotifications();
  const deferredCombinedNotifications = useDeferredValue(combinedNotifications);
  const isDeferredListPending =
    deferredCombinedNotifications !== combinedNotifications;
  const { notificationsUnreadCount } = useUnreadNotificationsCounter();
  const filteredNotifications = useMemo(
    () => filterNotifications(activeTab, deferredCombinedNotifications),
    [activeTab, deferredCombinedNotifications],
  );

  let hasNotifySnaps = false;
  hasNotifySnaps = useSelector(getNotifySnaps).length > 0;
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isFetchingNotifications = useSelector(isFetchingMetamaskNotifications);
  const isUpdatingNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const [isExpirationCleanupPending, setIsExpirationCleanupPending] =
    useSafeState(true);

  useEffect(() => {
    const deleteExpired = async () => {
      try {
        await dispatch(deleteExpiredNotifications());
      } finally {
        setIsExpirationCleanupPending(false);
      }
    };

    deleteExpired();
  }, [dispatch, setIsExpirationCleanupPending]);

  const isListLoading =
    traceLifecycle.isPending ||
    isLoading ||
    isFetchingNotifications ||
    isUpdatingNotifications;

  useNotificationListPerformance({
    enabled: isMetamaskNotificationsEnabled,
    isLoading: isListLoading,
    isPending:
      isListLoading ||
      isFeatureAnnouncementPreferencePending ||
      isExpirationCleanupPending ||
      isDeferredListPending,
    error: traceLifecycle.error ?? error,
    notificationCount: filteredNotifications.length,
  });

  return (
    <Page data-testid="notifications-page">
      {/* Back and Settings Buttons */}
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={handleBack}
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
            activeTab={activeTab}
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
    </Page>
  );
}
