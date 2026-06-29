import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../helpers/constants/routes';
import { useNotificationPreferences } from '../../hooks/metamask-notifications/useNotificationPreferences';
import { NotificationsSettingsAllowNotifications } from './notifications-settings-allow-notifications';
import { NotificationsSettingsTypes } from './notifications-settings-types';
import { useNotificationAccountGroups } from './notifications-settings-helpers';
import { getNotificationsSettingsSectionRoute } from './notifications-settings-routes';
import type { NotificationsSettingsSectionConfig } from './notifications-settings-types';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NotificationsSettingsContent() {
  const navigate = useNavigate();
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const [loadingAllowNotifications, setLoadingAllowNotifications] =
    useSafeState<boolean>(isUpdatingMetamaskNotifications);
  const { preferences, hasNotificationPreferences, refetchPreferences } =
    useNotificationPreferences();

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

  const navigateToSection = (section: NotificationsSettingsSectionConfig) => {
    if (!hasNotificationPreferences) {
      navigate(NOTIFICATIONS_SETTINGS_ROUTE);
      return;
    }

    navigate(getNotificationsSettingsSectionRoute(section.type));
  };

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
        <NotificationsSettingsTypes
          preferences={preferences}
          onSelectSection={navigateToSection}
        />
      )}
    </Box>
  );
}

export default NotificationsSettingsContent;
