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
  NotificationPreferenceChannelKey,
  NotificationPreferences,
} from '../../hooks/metamask-notifications/useNotificationPreferences';
import { useSwitchAccountNotificationsChange } from '../../hooks/metamask-notifications/useSwitchNotifications';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { NotificationsSettingsPerAccount } from './notifications-settings-per-account';
import type { NotificationWalletGroup } from './notifications-settings-helpers';
import type { NotificationsSettingsSectionConfig } from './notifications-settings-types';

type WalletActivityAccount =
  NotificationPreferences['walletActivity']['accounts'][number];
type SectionType = NotificationsSettingsSectionConfig['type'];

type AccountSettingsProps = {
  data?: Record<string, boolean>;
  initialLoading: boolean;
  accountsBeingUpdated: string[];
  update: (addresses: string[]) => Promise<void>;
};

type SectionContentProps = {
  preferences: NotificationPreferences;
  notificationAccountGroups: NotificationWalletGroup[];
  accountSettingsProps: AccountSettingsProps;
  refetchNotificationPreferences: () => Promise<unknown>;
};

type NotificationSettingsSectionProps = {
  section: NotificationsSettingsSectionConfig;
  preferences: NotificationPreferences;
  notificationAccountGroups: NotificationWalletGroup[];
  accountSettingsProps: AccountSettingsProps;
  updatePreference: (
    type: NotificationsSettingsSectionConfig['type'],
    key: NotificationPreferenceChannelKey,
    value: boolean,
  ) => Promise<void>;
  refetchNotificationPreferences: () => Promise<unknown>;
};

const getWalletActivityAccountsByAddress = (
  preferences: NotificationPreferences,
): Map<string, WalletActivityAccount> =>
  new Map(
    preferences.walletActivity.accounts.map(
      (account: WalletActivityAccount) => [
        account.address.toLowerCase(),
        account,
      ],
    ),
  );

const SETTINGS_TYPE_BY_SECTION: Record<SectionType, string> = {
  walletActivity: 'wallet_activity',
  perps: 'perps',
  marketing: 'marketing',
};

const WalletActivitySectionContent = ({
  preferences,
  notificationAccountGroups,
  accountSettingsProps,
  refetchNotificationPreferences,
}: SectionContentProps) => {
  const t = useI18nContext();
  const { listNotifications } = useMetamaskNotificationsContext();
  const { trackEvent } = React.useContext(MetaMetricsContext);
  const { onChange: switchAccountNotifications, error: accountToggleError } =
    useSwitchAccountNotificationsChange();
  const [updatingAllAccounts, setUpdatingAllAccounts] = useSafeState(false);

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

  const trackWalletActivityAggregateToggle = useCallback(
    (enabled: boolean) => {
      trackEvent({
        category: MetaMetricsEventCategory.NotificationSettings,
        event: MetaMetricsEventName.NotificationsSettingsUpdated,
        properties: {
          /* eslint-disable @typescript-eslint/naming-convention */
          settings_type: 'wallet_activity',
          notification_channel: 'all',
          enabled,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      });
    },
    [trackEvent],
  );

  const handleAccountActivityToggle = useCallback(
    (newState: boolean) => {
      const enabledCount = accountAddresses.filter(isAccountEnabled).length;
      const flippedOn = newState && enabledCount === 0;
      const flippedOff = !newState && enabledCount === 1;

      if (flippedOn || flippedOff) {
        trackWalletActivityAggregateToggle(newState);
      }
    },
    [accountAddresses, isAccountEnabled, trackWalletActivityAggregateToggle],
  );

  const toggleAllAccounts = useCallback(async () => {
    if (accountAddresses.length === 0) {
      return;
    }

    setUpdatingAllAccounts(true);
    try {
      const newState = !hasEnabledAccount;
      await switchAccountNotifications(accountAddresses, newState);
      await refetchAccountSettings();
      await refetchNotificationPreferences();
      trackWalletActivityAggregateToggle(newState);
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
    setUpdatingAllAccounts,
    switchAccountNotifications,
    trackWalletActivityAggregateToggle,
  ]);

  if (notificationAccountGroups.length === 0) {
    return null;
  }

  const shouldDisableAccountSwitches =
    accountSettingsProps.initialLoading || updatingAllAccounts;

  return (
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
                  onToggle={handleAccountActivityToggle}
                />
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
};

const MarketingSectionContent = () => {
  const t = useI18nContext();

  return (
    <Box className="mt-auto">
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Regular}
        textAlign={TextAlign.Center}
        color={TextColor.TextAlternative}
      >
        {t('notificationsSettingsMarketingConsent')}
      </Text>
    </Box>
  );
};

const SECTION_CONTENT_BY_TYPE: Partial<
  Record<
    NotificationsSettingsSectionConfig['type'],
    React.FC<SectionContentProps>
  >
> = {
  walletActivity: WalletActivitySectionContent,
  marketing: MarketingSectionContent,
};

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
  const [preferenceError, setPreferenceError] = useSafeState<string | null>(
    null,
  );

  const sectionPreferences = preferences[section.type];
  const SectionContent = SECTION_CONTENT_BY_TYPE[section.type];

  const handleTogglePreference = useCallback(
    async (key: NotificationPreferenceChannelKey) => {
      setPreferenceError(null);
      const oldValue = Boolean(sectionPreferences[key]);
      const newValue = !oldValue;
      trackEvent({
        category: MetaMetricsEventCategory.NotificationSettings,
        event: MetaMetricsEventName.NotificationsSettingsUpdated,
        properties: {
          /* eslint-disable @typescript-eslint/naming-convention */
          settings_type: SETTINGS_TYPE_BY_SECTION[section.type],
          notification_channel:
            key === 'pushNotificationsEnabled' ? 'push' : 'in_app',
          enabled: newValue,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      });
      try {
        await updatePreference(section.type, key, newValue);
        listNotifications();
      } catch (error) {
        setPreferenceError(
          error instanceof Error
            ? error.message
            : t('notificationsSettingsBoxError'),
        );
      }
    },
    [
      listNotifications,
      section.type,
      sectionPreferences,
      setPreferenceError,
      t,
      trackEvent,
      updatePreference,
    ],
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      className="min-h-0 flex-1"
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
          error={preferenceError}
          dataTestId={`${section.type}-in-app-notifications`}
        >
          <NotificationsSettingsType
            title={t('notificationsSettingsInAppNotifications')}
          />
        </NotificationsSettingsBox>
      </Box>

      {SectionContent && (
        <SectionContent
          preferences={preferences}
          notificationAccountGroups={notificationAccountGroups}
          accountSettingsProps={accountSettingsProps}
          refetchNotificationPreferences={refetchNotificationPreferences}
        />
      )}
    </Box>
  );
}
