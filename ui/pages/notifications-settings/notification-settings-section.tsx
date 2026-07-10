import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { useAnalytics } from '../../hooks/useAnalytics';
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
  agenticCli: 'agentic_cli',
};

type PendingAccountToggle = {
  value: boolean;
  generation: number;
};

const WalletActivitySectionContent = ({
  preferences,
  notificationAccountGroups,
  accountSettingsProps,
  refetchNotificationPreferences,
}: SectionContentProps) => {
  const t = useI18nContext();
  const { listNotifications } = useMetamaskNotificationsContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { onChange: switchAccountNotifications, error: accountToggleError } =
    useSwitchAccountNotificationsChange();
  const [updatingAllAccounts, setUpdatingAllAccounts] = useSafeState(false);
  const [pendingAccountToggles, setPendingAccountToggles] = useState<
    Record<string, PendingAccountToggle>
  >({});
  const accountToggleGenerationRef = useRef<Record<string, number>>({});
  const accountToggleWriteChainRef = useRef<Promise<void>>(Promise.resolve());

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

  const getAccountEnabledValue = useCallback(
    (address: string) => {
      const lowerAddress = address.toLowerCase();
      return (
        pendingAccountToggles[lowerAddress]?.value ?? isAccountEnabled(address)
      );
    },
    [isAccountEnabled, pendingAccountToggles],
  );

  const hasEnabledAccount = useMemo(
    () => accountAddresses.some(getAccountEnabledValue),
    [accountAddresses, getAccountEnabledValue],
  );

  const trackWalletActivityAggregateToggle = useCallback(
    (enabled: boolean) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NotificationsSettingsUpdated)
          .addCategory(MetaMetricsEventCategory.NotificationSettings)
          .addProperties({
            /* eslint-disable @typescript-eslint/naming-convention */
            settings_type: 'wallet_activity',
            notification_channel: 'all',
            enabled,
            /* eslint-enable @typescript-eslint/naming-convention */
          })
          .build(),
      );
    },
    [createEventBuilder, trackEvent],
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

  const handleToggleAccountNotifications = useCallback(
    async (address: string, nextValue: boolean) => {
      const lowerAddress = address.toLowerCase();
      const enabledCountBefore = accountAddresses.filter(
        getAccountEnabledValue,
      ).length;
      const wasEnabled = isAccountEnabled(address);
      const generation =
        (accountToggleGenerationRef.current[lowerAddress] ?? 0) + 1;
      accountToggleGenerationRef.current[lowerAddress] = generation;
      setPendingAccountToggles((current) => ({
        ...current,
        [lowerAddress]: { value: nextValue, generation },
      }));

      const persistWrite = accountToggleWriteChainRef.current.then(async () => {
        await switchAccountNotifications([address], nextValue);
        await refetchAccountSettings();
        await refetchNotificationPreferences();
        listNotifications();
      });
      accountToggleWriteChainRef.current = persistWrite.catch(() => undefined);

      try {
        await persistWrite;

        if (nextValue && enabledCountBefore === 0) {
          trackWalletActivityAggregateToggle(true);
        } else if (!nextValue && enabledCountBefore === 1 && wasEnabled) {
          trackWalletActivityAggregateToggle(false);
        }
      } finally {
        setPendingAccountToggles((current) => {
          if (current[lowerAddress]?.generation !== generation) {
            return current;
          }

          const next = { ...current };
          delete next[lowerAddress];
          return next;
        });
      }
    },
    [
      accountAddresses,
      isAccountEnabled,
      listNotifications,
      refetchAccountSettings,
      refetchNotificationPreferences,
      switchAccountNotifications,
      trackWalletActivityAggregateToggle,
    ],
  );

  if (notificationAccountGroups.length === 0) {
    return null;
  }

  const shouldDisableAccountSwitches =
    accountSettingsProps.initialLoading || updatingAllAccounts;
  const shouldDisableToggleAllAccounts =
    shouldDisableAccountSwitches ||
    accountSettingsProps.accountsBeingUpdated.length > 0 ||
    Object.keys(pendingAccountToggles).length > 0;

  return (
    <>
      <Box className="w-full h-px border-t border-muted" />
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Stretch}
        gap={4}
        data-testid="notifications-settings-per-account"
      >
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Stretch}
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
              disabled={shouldDisableToggleAllAccounts}
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
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Regular}
            color={TextColor.TextAlternative}
          >
            {t('notificationsSettingsSelectAccountsDescription')}
          </Text>
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
                  isLoading={
                    Boolean(
                      pendingAccountToggles[account.address.toLowerCase()],
                    ) ||
                    accountSettingsProps.accountsBeingUpdated.includes(
                      account.address,
                    )
                  }
                  isEnabled={getAccountEnabledValue(account.address)}
                  onToggle={(nextValue: boolean) =>
                    handleToggleAccountNotifications(account.address, nextValue)
                  }
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
  const { trackEvent, createEventBuilder } = useAnalytics();
  const [preferenceError, setPreferenceError] = useSafeState<string | null>(
    null,
  );

  // TODO: type casting until agentic cli preferences are not optional (next release)
  const sectionPreferences =
    section.type === 'agenticCli'
      ? (preferences[section.type] as NonNullable<
          (typeof preferences)['agenticCli']
        >)
      : preferences[section.type];
  const SectionContent = SECTION_CONTENT_BY_TYPE[section.type];

  const handleTogglePreference = useCallback(
    async (key: NotificationPreferenceChannelKey) => {
      setPreferenceError(null);
      const oldValue = Boolean(sectionPreferences[key]);
      const newValue = !oldValue;
      try {
        await updatePreference(section.type, key, newValue);
        trackEvent(
          createEventBuilder(MetaMetricsEventName.NotificationsSettingsUpdated)
            .addCategory(MetaMetricsEventCategory.NotificationSettings)
            .addProperties({
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              /* eslint-disable @typescript-eslint/naming-convention */
              settings_type: SETTINGS_TYPE_BY_SECTION[section.type],
              notification_channel:
                key === 'pushNotificationsEnabled' ? 'push' : 'in_app',
              enabled: newValue,
              /* eslint-enable @typescript-eslint/naming-convention */
            })
            .build(),
        );
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
      createEventBuilder,
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
