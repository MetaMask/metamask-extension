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
  NotificationPreferenceSection,
} from '../../hooks/metamask-notifications/useNotificationPreferences';
import { useSwitchAccountNotificationsChange } from '../../hooks/metamask-notifications/useSwitchNotifications';
import { useAnalytics } from '../../hooks/useAnalytics';
import { NotificationsSettingsPerAccount } from './notifications-settings-per-account';
import type { NotificationWalletGroup } from './notifications-settings-helpers';
import {
  isChannelEnabledForAusKeys,
  type NotificationsSettingsSectionConfig,
} from './notifications-settings-types';

type WalletActivityAccount =
  NotificationPreferences['walletActivity']['accounts'][number];

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
    ausKey: NotificationPreferenceSection,
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
    setUpdatingAllAccounts,
    switchAccountNotifications,
  ]);

  const handleToggleAccountNotifications = useCallback(
    async (address: string, nextValue: boolean) => {
      const lowerAddress = address.toLowerCase();
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
      listNotifications,
      refetchAccountSettings,
      refetchNotificationPreferences,
      switchAccountNotifications,
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

// Which extra widget (if any) a section mounts is keyed off the presence of
// a specific AUS key in `ausKeys` - the accounts list is intrinsically tied
// to the `walletActivity` preference (it edits `accounts` on that exact
// preference object), not to whatever free-form category id the BE groups
// it under.
function getSectionContent(
  ausKeys: string[],
): React.FC<SectionContentProps> | null {
  if (ausKeys.includes('walletActivity')) {
    return WalletActivitySectionContent;
  }
  if (ausKeys.includes('marketing')) {
    return MarketingSectionContent;
  }
  return null;
}

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

  // Only write to AUS keys this client's NotificationPreferences shape
  // actually recognizes, in case the BE adds one before the client does.
  const targetAusKeys = useMemo(
    () =>
      section.ausKeys.filter(
        (ausKey): ausKey is NotificationPreferenceSection =>
          ausKey in preferences,
      ),
    [preferences, section.ausKeys],
  );
  const SectionContent = getSectionContent(section.ausKeys);

  const handleTogglePreference = useCallback(
    async (key: NotificationPreferenceChannelKey) => {
      setPreferenceError(null);
      const oldValue = isChannelEnabledForAusKeys(
        preferences,
        section.ausKeys,
        key,
      );
      const newValue = !oldValue;
      try {
        // A category can back multiple AUS preferences - toggling it means
        // writing the same value to all of them at once.
        await Promise.all(
          targetAusKeys.map((ausKey) =>
            updatePreference(ausKey, key, newValue),
          ),
        );
        trackEvent(
          createEventBuilder(MetaMetricsEventName.NotificationsSettingsUpdated)
            .addCategory(MetaMetricsEventCategory.NotificationSettings)
            .addProperties({
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              settings_type: `${section.categoryId}_${key}`,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              old_value: oldValue,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              new_value: newValue,
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
      preferences,
      section.ausKeys,
      section.categoryId,
      setPreferenceError,
      t,
      targetAusKeys,
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
      data-testid={`notifications-settings-section-content-${section.categoryId}`}
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Stretch}
        gap={4}
      >
        <NotificationsSettingsBox
          value={isChannelEnabledForAusKeys(
            preferences,
            section.ausKeys,
            'pushNotificationsEnabled',
          )}
          onToggle={() => handleTogglePreference('pushNotificationsEnabled')}
          error={preferenceError}
          dataTestId={`${section.categoryId}-push-notifications`}
        >
          <NotificationsSettingsType
            title={t('notificationsSettingsPushNotifications')}
          />
        </NotificationsSettingsBox>
        <NotificationsSettingsBox
          value={isChannelEnabledForAusKeys(
            preferences,
            section.ausKeys,
            'inAppNotificationsEnabled',
          )}
          onToggle={() => handleTogglePreference('inAppNotificationsEnabled')}
          error={preferenceError}
          dataTestId={`${section.categoryId}-in-app-notifications`}
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
