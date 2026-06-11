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
import { getAccountGroupWithInternalAccounts } from '../../selectors/multichain-accounts/account-tree';
import { useAccountSettingsProps } from '../../hooks/metamask-notifications/useSwitchNotifications';
import { useSafeState } from '../../hooks/metamask-notifications/useNotifications';
import { useI18nContext } from '../../hooks/useI18nContext';
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../helpers/constants/routes';
import { useNotificationPreferences } from '../../hooks/metamask-notifications/useNotificationPreferences';
import { NotificationsSettingsAllowNotifications } from './notifications-settings-allow-notifications';
import {
  getNotificationsSettingsSectionConfigs,
  NotificationsSettingsTypes,
  type NotificationsSettingsSectionType,
} from './notifications-settings-types';
import { getNotificationWalletGroups } from './notifications-settings-helpers';
import { NotificationSettingsSection } from './notification-settings-section';

function useNotificationAccountGroups() {
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  return useMemo(
    () => getNotificationWalletGroups(accountGroups),
    [accountGroups],
  );
}

const isNotificationsSettingsSectionType = (
  section: string | null,
): section is NotificationsSettingsSectionType =>
  section === 'walletActivity' ||
  section === 'perps' ||
  section === 'marketing';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NotificationsSettingsContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = useI18nContext();
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
    hasNotificationPreferences,
    isLoading: isLoadingPreferences,
    updatePreference,
    refetchPreferences,
  } = useNotificationPreferences();

  const sectionConfigs = useMemo(
    () => getNotificationsSettingsSectionConfigs(t),
    [t],
  );
  const selectedSectionType = searchParams.get('section');
  const selectedSection = sectionConfigs.find(
    (section) =>
      isNotificationsSettingsSectionType(selectedSectionType) &&
      section.type === selectedSectionType,
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
  const updatingAccounts = accountSettingsProps.accountsBeingUpdated.length > 0;

  useEffect(() => {
    if (
      selectedSectionType &&
      (!isMetamaskNotificationsEnabled ||
        (!isLoadingPreferences && !hasNotificationPreferences))
    ) {
      navigate(NOTIFICATIONS_SETTINGS_ROUTE, { replace: true });
    }
  }, [
    hasNotificationPreferences,
    isLoadingPreferences,
    isMetamaskNotificationsEnabled,
    navigate,
    selectedSectionType,
  ]);

  const navigateToSection = (section: NonNullable<typeof selectedSection>) => {
    if (!hasNotificationPreferences) {
      navigate(NOTIFICATIONS_SETTINGS_ROUTE);
      return;
    }

    navigate(`${NOTIFICATIONS_SETTINGS_ROUTE}?section=${section.type}`);
  };

  if (
    selectedSection &&
    isMetamaskNotificationsEnabled &&
    hasNotificationPreferences &&
    preferences
  ) {
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
          section={selectedSection}
          preferences={preferences}
          notificationAccountGroups={notificationAccountGroups}
          accountSettingsProps={accountSettingsProps}
          updatePreference={updatePreference}
          refetchNotificationPreferences={refetchPreferences}
        />
      </Box>
    );
  }

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
      />
      {isMetamaskNotificationsEnabled && (
        <>
          <Box className="w-full h-px border-t border-muted" />
          <NotificationsSettingsTypes
            preferences={preferences}
            onSelectSection={navigateToSection}
          />
        </>
      )}
    </Box>
  );
}

export default NotificationsSettingsContent;
