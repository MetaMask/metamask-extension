import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import {
  selectIsMetamaskNotificationsEnabled,
  getIsUpdatingMetamaskNotifications,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { useAccountSettingsProps } from '../../hooks/metamask-notifications/useSwitchNotifications';
import { useSafeState } from '../../hooks/metamask-notifications/useNotifications';
import { useNotificationPreferences } from '../../hooks/metamask-notifications/useNotificationPreferences';
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../helpers/constants/routes';
import { getIsPerpsIncludedInBuild } from '../../../shared/lib/environment';
import { NotificationsSettingsAllowNotifications } from './notifications-settings-allow-notifications';
import { NotificationsSettingsTypes } from './notifications-settings-types';
import { useNotificationAccountGroups } from './notifications-settings-helpers';
import { getNotificationsSettingsSectionTypeFromPath } from './notifications-settings-routes';

export function NotificationsSettingsContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingSectionRoute = `${NOTIFICATIONS_SETTINGS_ROUTE}/${searchParams.get('section') ?? ''}`;
  const pendingSectionType =
    getNotificationsSettingsSectionTypeFromPath(pendingSectionRoute);
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const [loadingAllowNotifications, setLoadingAllowNotifications] =
    useSafeState<boolean>(isUpdatingMetamaskNotifications);
  const {
    preferences,
    refetchPreferences,
    isLoading: isLoadingPreferences,
    error: preferencesError,
  } = useNotificationPreferences();

  useEffect(() => {
    if (
      pendingSectionType &&
      (pendingSectionType !== 'perps' || getIsPerpsIncludedInBuild()) &&
      isMetamaskNotificationsEnabled &&
      !isUpdatingMetamaskNotifications &&
      !loadingAllowNotifications &&
      !isLoadingPreferences &&
      !preferencesError &&
      preferences?.[pendingSectionType]
    ) {
      // Consume the pending intent so returning to the main page does not resume it again.
      navigate(pendingSectionRoute, { replace: true });
    }
  }, [
    pendingSectionType,
    pendingSectionRoute,
    isMetamaskNotificationsEnabled,
    isUpdatingMetamaskNotifications,
    loadingAllowNotifications,
    isLoadingPreferences,
    preferencesError,
    preferences,
    navigate,
  ]);

  const notificationAccountGroups = useNotificationAccountGroups();
  const accountAddresses = useMemo(
    () =>
      notificationAccountGroups.flatMap((walletGroup) =>
        walletGroup.accounts.map((account) => account.address),
      ),
    [notificationAccountGroups],
  );
  const accountSettingsProps = useAccountSettingsProps(accountAddresses);
  const updatingAccounts = accountSettingsProps.accountsBeingUpdated.length > 0;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      paddingTop={3}
      paddingHorizontal={4}
      gap={6}
    >
      <NotificationsSettingsAllowNotifications
        loading={loadingAllowNotifications}
        setLoading={setLoadingAllowNotifications}
        dataTestId="notifications-settings-allow"
        disabled={updatingAccounts}
        refetchPreferences={refetchPreferences}
      />
      {isMetamaskNotificationsEnabled && (
        <NotificationsSettingsTypes preferences={preferences} />
      )}
    </Box>
  );
}

export default NotificationsSettingsContent;
