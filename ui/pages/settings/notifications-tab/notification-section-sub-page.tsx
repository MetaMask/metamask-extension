import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  FontWeight,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import Preloader from '../../../components/ui/icon/preloader/preloader-icon.component';
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import { useAccountSettingsProps } from '../../../hooks/metamask-notifications/useSwitchNotifications';
import { useNotificationPreferences } from '../../../hooks/metamask-notifications/useNotificationPreferences';
import { useNotificationCategories } from '../../../hooks/metamask-notifications/useNotificationCategories';
import { selectIsMetamaskNotificationsEnabled } from '../../../selectors/metamask-notifications/metamask-notifications';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { NotificationSettingsSection } from '../../notifications-settings/notification-settings-section';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { useNotificationAccountGroups } from '../../notifications-settings/notifications-settings-helpers';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { getNotificationsSettingsSectionConfigs } from '../../notifications-settings/notifications-settings-types';

export const NotificationSectionSubPage = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
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

  const { categories, isLoading: isLoadingCategories } =
    useNotificationCategories();

  const section = useMemo(
    () =>
      getNotificationsSettingsSectionConfigs(categories).find(
        (config) => config.categoryId === categoryId,
      ),
    [categories, categoryId],
  );

  // Every section is sourced from the BE category catalog - without this, a
  // direct navigation to e.g. the wallet-activity sub-page would find no
  // matching `section` before the categories query resolves and incorrectly
  // redirect away as if the section didn't exist.
  const isLoadingSectionData = isLoadingCategories && !section;

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
    if (isLoadingSectionData) {
      return;
    }
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
    isLoadingSectionData,
    isMetamaskNotificationsEnabled,
    navigate,
    section,
  ]);

  // Valid section with notifications enabled, but preferences (or the BE
  // category catalog backing this section) are still being fetched. Show a
  // loading indicator rather than a blank page (the redirect effect above
  // intentionally waits for both fetches to settle before deciding whether
  // to redirect).
  if (
    isLoadingSectionData ||
    (section &&
      isMetamaskNotificationsEnabled &&
      isLoadingPreferences &&
      !preferences)
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
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Stretch}
        gap={1}
      >
        <Text variant={TextVariant.HeadingSm}>{section.title}</Text>
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Regular}
          color={TextColor.TextAlternative}
        >
          {section.description}
        </Text>
      </Box>
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

export default NotificationSectionSubPage;
