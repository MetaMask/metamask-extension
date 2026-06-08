import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  NotificationsSettingsBox,
  NotificationsSettingsType,
} from '../../components/multichain';
import { useSafeState } from '../../hooks/metamask-notifications/useNotifications';
import type {
  NotificationStoragePreferenceChannelKey,
  NotificationStoragePreferences,
} from '../../hooks/metamask-notifications/useNotificationStoragePreferences';
import { useSwitchAccountNotificationsChange } from '../../hooks/metamask-notifications/useSwitchNotifications';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { NotificationsSettingsPerAccount } from './notifications-settings-per-account';
import type { NotificationWalletGroup } from './notifications-settings-helpers';
import type { NotificationsSettingsSectionConfig } from './notifications-settings-types';

type AccountSettingsProps = {
  data?: Record<string, boolean>;
  initialLoading: boolean;
  accountsBeingUpdated: string[];
  update: (addresses: string[]) => Promise<void>;
};

type NotificationSettingsSectionProps = {
  section: NotificationsSettingsSectionConfig;
  preferences: NotificationStoragePreferences;
  notificationAccountGroups: NotificationWalletGroup[];
  accountSettingsProps: AccountSettingsProps;
  updatePreference: (
    type: NotificationsSettingsSectionConfig['type'],
    key: NotificationStoragePreferenceChannelKey,
    value: boolean,
  ) => Promise<void>;
  refetchNotificationPreferences: () => Promise<unknown>;
};

const getWalletActivityAccountsByAddress = (
  preferences: NotificationStoragePreferences,
) =>
  new Map(
    preferences.walletActivity.accounts.map((account) => [
      account.address.toLowerCase(),
      account,
    ]),
  );

export function NotificationSettingsSection({
  section,
  preferences,
  notificationAccountGroups,
  accountSettingsProps,
  updatePreference,
  refetchNotificationPreferences,
}: NotificationSettingsSectionProps) {
  const t = useI18nContext();
  const { listNotifications } = useMetamaskNotificationsContext();
  const { trackEvent } = React.useContext(MetaMetricsContext);
  const { onChange: switchAccountNotifications, error: accountToggleError } =
    useSwitchAccountNotificationsChange();
  const [updatingPreference, setUpdatingPreference] =
    useSafeState<NotificationStoragePreferenceChannelKey | null>(null);
  const [updatingAllAccounts, setUpdatingAllAccounts] = useSafeState(false);
  const [preferenceError, setPreferenceError] = useSafeState<string | null>(
    null,
  );

  const sectionPreferences = preferences[section.type];
  const walletAccountsByAddress = useMemo(
    () => getWalletActivityAccountsByAddress(preferences),
    [preferences],
  );

  const accountAddresses = useMemo(
    () =>
      notificationAccountGroups.flatMap((walletGroup) =>
        walletGroup.accounts.map((account) => account.address),
      ),
    [notificationAccountGroups],
  );

  const refetchAccountSettings = useCallback(async () => {
    await accountSettingsProps.update(accountAddresses);
  }, [accountAddresses, accountSettingsProps]);

  const isAccountEnabled = useCallback(
    (address: string) => {
      const lowerAddress = address.toLowerCase();
      return (
        accountSettingsProps.data?.[lowerAddress] ??
        walletAccountsByAddress.get(lowerAddress)?.enabled ??
        false
      );
    },
    [accountSettingsProps.data, walletAccountsByAddress],
  );

  const hasEnabledAccount = useMemo(
    () => accountAddresses.some(isAccountEnabled),
    [accountAddresses, isAccountEnabled],
  );

  const handleTogglePreference = useCallback(
    async (key: NotificationStoragePreferenceChannelKey) => {
      setPreferenceError(null);
      setUpdatingPreference(key);
      const oldValue = Boolean(sectionPreferences[key]);
      const newValue = !oldValue;
      try {
        await updatePreference(section.type, key, newValue);
        trackEvent({
          category: MetaMetricsEventCategory.NotificationSettings,
          event: MetaMetricsEventName.NotificationsSettingsUpdated,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            settings_type: `${section.type}_${key}`,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            old_value: oldValue,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_value: newValue,
          },
        });
        listNotifications();
      } catch (error) {
        setPreferenceError(
          error instanceof Error
            ? error.message
            : t('notificationsSettingsBoxError'),
        );
      } finally {
        setUpdatingPreference(null);
      }
    },
    [
      listNotifications,
      section.type,
      sectionPreferences,
      t,
      trackEvent,
      updatePreference,
    ],
  );

  const toggleAllAccounts = useCallback(async () => {
    if (accountAddresses.length === 0) {
      return;
    }

    setUpdatingAllAccounts(true);
    try {
      await switchAccountNotifications(accountAddresses, !hasEnabledAccount);
      await refetchAccountSettings();
      await refetchNotificationPreferences();
      listNotifications();
    } finally {
      setUpdatingAllAccounts(false);
    }
  }, [
    accountAddresses,
    hasEnabledAccount,
    listNotifications,
    refetchAccountSettings,
    refetchNotificationPreferences,
    switchAccountNotifications,
  ]);

  const shouldShowWalletAccounts = section.type === 'walletActivity';
  const shouldDisableAccountSwitches =
    accountSettingsProps.initialLoading || updatingAllAccounts;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      gap={6}
      data-testid={`notifications-settings-section-content-${section.type}`}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
      >
        <Text
          variant={TextVariant.HeadingSm}
          fontWeight={FontWeight.Bold}
          color={TextColor.TextDefault}
        >
          {section.title}
        </Text>
      </Box>
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Regular}
        color={TextColor.TextAlternative}
      >
        {section.description}
      </Text>

      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Stretch}
        gap={4}
      >
        <NotificationsSettingsBox
          value={sectionPreferences.pushNotificationsEnabled}
          onToggle={() => handleTogglePreference('pushNotificationsEnabled')}
          loading={updatingPreference === 'pushNotificationsEnabled'}
          disabled={Boolean(updatingPreference)}
          error={preferenceError}
          dataTestId={`${section.type}-push-notifications`}
        >
          <NotificationsSettingsType
            title={t('notificationsSettingsPushNotifications')}
          />
        </NotificationsSettingsBox>
        <NotificationsSettingsBox
          value={sectionPreferences.inAppNotificationsEnabled}
          onToggle={() => handleTogglePreference('inAppNotificationsEnabled')}
          loading={updatingPreference === 'inAppNotificationsEnabled'}
          disabled={Boolean(updatingPreference)}
          error={preferenceError}
          dataTestId={`${section.type}-in-app-notifications`}
        >
          <NotificationsSettingsType
            title={t('notificationsSettingsInAppNotifications')}
          />
        </NotificationsSettingsBox>
      </Box>

      {shouldShowWalletAccounts && notificationAccountGroups.length > 0 && (
        <>
          <Box className="w-full h-px border-t border-muted" />
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Stretch}
            gap={4}
            data-testid="notifications-settings-per-account"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
              gap={4}
            >
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
              >
                {t('notificationsSettingsSelectAccounts')}
              </Text>
              <button
                className="border-0 bg-transparent p-0 text-primary-default cursor-pointer"
                data-testid="notifications-settings-toggle-all-accounts"
                disabled={shouldDisableAccountSwitches}
                onClick={toggleAllAccounts}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.PrimaryDefault}
                >
                  {hasEnabledAccount
                    ? t('notificationsSettingsDeselectAll')
                    : t('selectAll')}
                </Text>
              </button>
            </Box>
            {accountToggleError && (
              <Text color={TextColor.ErrorDefault}>
                {t('notificationsSettingsBoxError')}
              </Text>
            )}
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Stretch}
              gap={4}
            >
              {notificationAccountGroups.map((walletGroup) => (
                <Box
                  key={walletGroup.walletId}
                  flexDirection={BoxFlexDirection.Column}
                  alignItems={BoxAlignItems.Stretch}
                  gap={2}
                >
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    color={TextColor.TextAlternative}
                  >
                    {walletGroup.walletName}
                  </Text>
                  {walletGroup.accounts.map((account) => (
                    <NotificationsSettingsPerAccount
                      key={account.id}
                      address={account.address}
                      name={account.name}
                      disabledSwitch={shouldDisableAccountSwitches}
                      isLoading={accountSettingsProps.accountsBeingUpdated.includes(
                        account.address,
                      )}
                      isEnabled={isAccountEnabled(account.address)}
                      refetchAccountSettings={refetchAccountSettings}
                      refetchNotificationPreferences={
                        refetchNotificationPreferences
                      }
                    />
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}

      {section.type === 'marketing' && (
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Regular}
          textAlign={TextAlign.Center}
          color={TextColor.TextAlternative}
        >
          {t('notificationsSettingsMarketingConsent')}
        </Text>
      )}
    </Box>
  );
}
