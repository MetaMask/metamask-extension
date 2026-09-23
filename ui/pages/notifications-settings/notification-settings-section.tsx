import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
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
import { useDispatch } from '../../store/hooks';
import {
  putMarketingConsent,
  setDataCollectionForMarketing,
} from '../../store/actions';
import { getDataCollectionForMarketing } from '../../selectors/metametrics';
import { NotificationsSettingsPerAccount } from './notifications-settings-per-account';
import type { NotificationWalletGroup } from './notifications-settings-helpers';
import type { NotificationsSettingsSectionConfig } from './notifications-settings-types';

type SectionType = NotificationsSettingsSectionConfig['type'];

type AccountSettingsProps = {
  data?: Record<string, boolean>;
  initialLoading: boolean;
  error: string | null;
  accountsBeingUpdated: string[];
  update: (addresses: string[]) => Promise<void>;
};

type SectionContentProps = {
  notificationAccountGroups: NotificationWalletGroup[];
  accountSettingsProps: AccountSettingsProps;
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
};

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
  notificationAccountGroups,
  accountSettingsProps,
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

  // Account settings live in the Trigger API, which reports an unreadable
  // config as a failure rather than "every account disabled". Surface that
  // failure instead of showing switches in the wrong position — but only when
  // there is no earlier successful read to fall back on.
  const hasAccountSettings =
    Object.keys(accountSettingsProps.data ?? {}).length > 0;
  const accountSettingsError = hasAccountSettings
    ? null
    : accountSettingsProps.error;

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
      return accountSettingsProps.data?.[address.toLowerCase()] ?? false;
    },
    [accountSettingsProps.data],
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

  const trackWalletActivityAccountsAggregateToggle = useCallback(
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
      try {
        await switchAccountNotifications(accountAddresses, newState);
      } catch {
        // Failed enable/disable already surfaced via accountToggleError; avoid
        // leaving a rejected promise from the onClick handler.
        return;
      }
      await refetchAccountSettings();
      trackWalletActivityAccountsAggregateToggle(newState);
      listNotifications();
    } finally {
      setUpdatingAllAccounts(false);
    }
  }, [
    accountAddresses,
    hasEnabledAccount,
    listNotifications,
    refetchAccountSettings,
    setUpdatingAllAccounts,
    switchAccountNotifications,
    trackWalletActivityAccountsAggregateToggle,
  ]);

  const handleToggleAccountNotifications = useCallback(
    async (address: string, nextValue: boolean) => {
      const lowerAddress = address.toLowerCase();

      // Aggregate events track user-facing intention (optimistic UI), not BE lag.
      // Capture the boundary *before* this click's pending override is applied.
      const optimisticEnabledCount = accountAddresses.filter(
        getAccountEnabledValue,
      ).length;
      let aggregateTransition: boolean | null = null;
      if (nextValue && optimisticEnabledCount === 0) {
        aggregateTransition = true;
      } else if (
        !nextValue &&
        optimisticEnabledCount === 1 &&
        getAccountEnabledValue(address)
      ) {
        aggregateTransition = false;
      }

      const generation =
        (accountToggleGenerationRef.current[lowerAddress] ?? 0) + 1;
      accountToggleGenerationRef.current[lowerAddress] = generation;
      setPendingAccountToggles((current) => ({
        ...current,
        [lowerAddress]: { value: nextValue, generation },
      }));

      const persistWrite = accountToggleWriteChainRef.current.then(async () => {
        try {
          await switchAccountNotifications([address], nextValue);
          await refetchAccountSettings();
          listNotifications();
          if (aggregateTransition !== null) {
            trackWalletActivityAccountsAggregateToggle(aggregateTransition);
          }
        } catch {
          // write failed; chain resolves so subsequent toggles can still run
        }
      });
      accountToggleWriteChainRef.current = persistWrite;

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
      accountAddresses,
      getAccountEnabledValue,
      listNotifications,
      refetchAccountSettings,
      switchAccountNotifications,
      trackWalletActivityAccountsAggregateToggle,
    ],
  );

  if (notificationAccountGroups.length === 0) {
    return null;
  }

  const shouldDisableAccountSwitches =
    accountSettingsProps.initialLoading ||
    updatingAllAccounts ||
    Boolean(accountSettingsError);
  const shouldDisableToggleAllAccounts =
    shouldDisableAccountSwitches ||
    accountSettingsProps.accountsBeingUpdated.length > 0 ||
    Object.keys(pendingAccountToggles).length > 0;

  return (
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
        {accountSettingsError ? (
          <Text color={TextColor.ErrorDefault} variant={TextVariant.BodySm}>
            {t('notificationsSettingsAccountsLoadError')}
          </Text>
        ) : null}
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
  );
};

const MarketingSectionContent = () => {
  const t = useI18nContext();

  return (
    <Box className="mt-auto pb-4">
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

type MarketingConsentSheetProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onOptIn: () => Promise<void>;
};

const MarketingConsentSheet = ({
  isOpen,
  isSubmitting,
  onClose,
  onOptIn,
}: MarketingConsentSheetProps) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      data-testid="marketing-consent-sheet"
    >
      <ModalOverlay />
      <ModalContent
        size={ModalContentSize.Sm}
        className="flex items-end justify-center p-0"
        modalDialogProps={{
          padding: 0,
          style: {
            width: '100%',
            maxWidth: '100%',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        }}
      >
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ 'data-testid': 'marketing-consent-sheet-close' }}
        >
          <Text variant={TextVariant.HeadingSm}>
            {t('notificationsSettingsMarketingConsentSheetTitle')}
          </Text>
        </ModalHeader>
        <ModalBody className="px-4 pb-4">
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text color={TextColor.TextAlternative}>
              {t('notificationsSettingsMarketingConsentSheetDescription')}
            </Text>
            <Box flexDirection={BoxFlexDirection.Column} gap={2}>
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={onClose}
                isDisabled={isSubmitting}
                data-testid="marketing-consent-sheet-cancel"
              >
                {t('cancel')}
              </Button>
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={() => {
                  onOptIn().catch(() => undefined);
                }}
                isDisabled={isSubmitting}
                data-testid="marketing-consent-sheet-opt-in"
              >
                {t('notificationsSettingsMarketingConsentSheetOptIn')}
              </Button>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
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
}: NotificationSettingsSectionProps) {
  const t = useI18nContext();
  const { listNotifications } = useMetamaskNotificationsContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const dispatch = useDispatch();
  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const [preferenceError, setPreferenceError] = useSafeState<string | null>(
    null,
  );
  const [pendingMarketingChannel, setPendingMarketingChannel] =
    useState<NotificationPreferenceChannelKey | null>(null);
  const [isMarketingConsentSubmitting, setIsMarketingConsentSubmitting] =
    useState(false);

  // TODO: type casting until agentic cli preferences are not optional (next release)
  const sectionPreferences =
    section.type === 'agenticCli'
      ? (preferences[section.type] as NonNullable<
          (typeof preferences)['agenticCli']
        >)
      : preferences[section.type];
  const SectionContent = SECTION_CONTENT_BY_TYPE[section.type];
  const showChannelToggles = section.type !== 'walletActivity';
  const isMarketingConsentRequired =
    section.type === 'marketing' &&
    dataCollectionForMarketing === false &&
    !sectionPreferences.pushNotificationsEnabled &&
    !sectionPreferences.inAppNotificationsEnabled;

  const handleTogglePreference = useCallback(
    async (key: NotificationPreferenceChannelKey) => {
      setPreferenceError(null);
      const oldValue = Boolean(sectionPreferences[key]);
      const newValue = !oldValue;

      if (isMarketingConsentRequired && newValue) {
        setPendingMarketingChannel(key);
        return;
      }

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
      isMarketingConsentRequired,
      listNotifications,
      section.type,
      sectionPreferences,
      setPreferenceError,
      t,
      trackEvent,
      updatePreference,
    ],
  );

  const handleMarketingConsentOptIn = useCallback(async () => {
    if (!pendingMarketingChannel || !isMarketingConsentRequired) {
      return;
    }

    setIsMarketingConsentSubmitting(true);
    setPreferenceError(null);
    try {
      await dispatch(setDataCollectionForMarketing(true));
      await dispatch(putMarketingConsent(true));
      await updatePreference('marketing', pendingMarketingChannel, true);
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NotificationsSettingsUpdated)
          .addCategory(MetaMetricsEventCategory.NotificationSettings)
          .addProperties({
            /* eslint-disable @typescript-eslint/naming-convention */
            settings_type: SETTINGS_TYPE_BY_SECTION.marketing,
            notification_channel:
              pendingMarketingChannel === 'pushNotificationsEnabled'
                ? 'push'
                : 'in_app',
            enabled: true,
            /* eslint-enable @typescript-eslint/naming-convention */
          })
          .build(),
      );
      setPendingMarketingChannel(null);
      listNotifications();
    } catch (error) {
      setPreferenceError(
        error instanceof Error
          ? error.message
          : t('notificationsSettingsBoxError'),
      );
    } finally {
      setIsMarketingConsentSubmitting(false);
    }
  }, [
    createEventBuilder,
    dispatch,
    isMarketingConsentRequired,
    listNotifications,
    pendingMarketingChannel,
    setPreferenceError,
    t,
    trackEvent,
    updatePreference,
  ]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      className="min-h-0 flex-1"
      gap={6}
      data-testid={`notifications-settings-section-content-${section.type}`}
    >
      {showChannelToggles ? (
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
      ) : null}

      {SectionContent && (
        <SectionContent
          notificationAccountGroups={notificationAccountGroups}
          accountSettingsProps={accountSettingsProps}
        />
      )}
      <MarketingConsentSheet
        isOpen={pendingMarketingChannel !== null}
        isSubmitting={isMarketingConsentSubmitting}
        onClose={() => setPendingMarketingChannel(null)}
        onOptIn={handleMarketingConsentOptIn}
      />
    </Box>
  );
}
