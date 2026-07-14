import React, { useMemo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from '../../components/component-library';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
} from '../../helpers/constants/routes';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import { useUnreadNotificationsCounter } from '../../hooks/metamask-notifications/useCounter';
import { useSafeState } from '../../hooks/metamask-notifications/useNotifications';
import {
  selectIsMetamaskNotificationsEnabled,
  getMetamaskNotifications,
} from '../../selectors/metamask-notifications/metamask-notifications';
import {
  deleteExpiredNotifications,
  getNotificationPreferences,
} from '../../store/actions';
import { useGlobalMenuRouteTransition } from '../routes/global-menu-route-transition';
import { ALL_NOTIFICATIONS_CATEGORY_ID } from './notification-categories-types';
import { NotificationsList, TAB_KEYS } from './notifications-list';
import { NotificationsCategory } from './notifications-category';
import { getNotificationCategoryId } from './get-notification-category-id';

const useFeatureAnnouncementsEnabled = () => {
  const dispatch = useDispatch();
  const [areFeatureAnnouncementsEnabled, setAreFeatureAnnouncementsEnabled] =
    useSafeState(false);

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
        setAreFeatureAnnouncementsEnabled(false);
      }
    };

    loadPreferences();
  }, [dispatch, setAreFeatureAnnouncementsEnabled]);

  return areFeatureAnnouncementsEnabled;
};

// NOTE - these 2 data sources are combined in our controller.
// FUTURE - we could separate these data sources into separate methods.
const useMetaMaskNotifications = () => {
  const areFeatureAnnouncementsEnabled = useFeatureAnnouncementsEnabled();

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

export const filterNotificationsByCategory = (
  category: string,
  notifications: INotification[],
) => {
  if (category === ALL_NOTIFICATIONS_CATEGORY_ID) {
    return notifications;
  }

  return notifications.filter(
    (notification) => getNotificationCategoryId(notification) === category,
  );
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

  const { isLoading, error } = useMetamaskNotificationsContext();

  const activeTab = TAB_KEYS.ALL;
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ALL_NOTIFICATIONS_CATEGORY_ID,
  );
  const combinedNotifications = useCombinedNotifications();
  const { notificationsUnreadCount } = useUnreadNotificationsCounter();
  const filteredNotifications = useMemo(
    () =>
      filterNotificationsByCategory(
        selectedCategory,
        filterNotifications(activeTab, combinedNotifications),
      ),
    [activeTab, selectedCategory, combinedNotifications],
  );

  useEffect(() => {
    dispatch(deleteExpiredNotifications());
  }, [dispatch]);

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
        <NotificationsCategory onSelect={setSelectedCategory} />

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
