import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import Preloader from '../../../components/ui/icon/preloader/preloader-icon.component';
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import { useAccountSettingsProps } from '../../../hooks/metamask-notifications/useSwitchNotifications';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useNotificationPreferences } from '../../../hooks/metamask-notifications/useNotificationPreferences';
import { selectIsMetamaskNotificationsEnabled } from '../../../selectors/metamask-notifications/metamask-notifications';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { NotificationSettingsSection } from '../../notifications-settings/notification-settings-section';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { useNotificationAccountGroups } from '../../notifications-settings/notifications-settings-helpers';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { getNotificationsSettingsSectionConfigs } from '../../notifications-settings/notifications-settings-types';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import type { NotificationsSettingsSectionType } from '../../notifications-settings/notifications-settings-types';

type NotificationSectionSubPageProps = {
  sectionType: NotificationsSettingsSectionType;
};

export const NotificationSectionSubPage = ({
  sectionType,
}: NotificationSectionSubPageProps) => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const {
    preferences,
    hasNotificationPreferences,
    isLoading: isLoadingPreferences,
    updatePreference,
    refetchPreferences,
  } = useNotificationPreferences();

  const section = useMemo(
    () =>
      getNotificationsSettingsSectionConfigs(t).find(
        (config) => config.type === sectionType,
      ),
    [sectionType, t],
  );

  const notificationAccountGroups = useNotificationAccountGroups();
  const accountAddresses = useMemo(
    () =>
      notificationAccountGroups.flatMap((walletGroup) =>
        walletGroup.accounts.map((account) => account.address),
      ),
    [notificationAccountGroups],
  );
  const accountSettingsProps = useAccountSettingsProps(accountAddresses);

  useEffect(() => {
    if (
      !section ||
      !isMetamaskNotificationsEnabled ||
      (!isLoadingPreferences && !hasNotificationPreferences)
    ) {
      navigate(NOTIFICATIONS_SETTINGS_ROUTE, { replace: true });
    }
  }, [
    hasNotificationPreferences,
    isLoadingPreferences,
    isMetamaskNotificationsEnabled,
    navigate,
    section,
  ]);

  // Valid section with notifications enabled, but preferences are still being
  // fetched from authenticated user storage. Show a loading indicator rather
  // than a blank page (the redirect effect above intentionally waits for the
  // fetch to settle before deciding whether to redirect).
  if (
    section &&
    isMetamaskNotificationsEnabled &&
    isLoadingPreferences &&
    !preferences
  ) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        className="h-full min-h-0"
        data-testid="notifications-section-loading"
      >
        <Preloader size={36} />
      </Box>
    );
  }

  if (
    !section ||
    !isMetamaskNotificationsEnabled ||
    !hasNotificationPreferences ||
    !preferences
  ) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      className="h-full min-h-0"
      paddingTop={3}
      paddingHorizontal={4}
      gap={6}
    >
      <NotificationSettingsSection
        section={section}
        preferences={preferences}
        notificationAccountGroups={notificationAccountGroups}
        accountSettingsProps={accountSettingsProps}
        updatePreference={updatePreference}
        refetchNotificationPreferences={refetchPreferences}
      />
    </Box>
  );
};
