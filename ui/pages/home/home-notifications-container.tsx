import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Text, TextVariant, TextColor } from '@metamask/design-system-react';
import {
  activeTabHasPermissions,
  getOriginOfCurrentTab,
  getNewNetworkAdded,
  getEditedNetwork,
  getShowOutdatedBrowserWarning,
  getWeb3ShimUsageStateForOrigin,
} from '../../selectors';
import { getInfuraBlocked } from '../../../shared/lib/selectors/networks';
import {
  getIsPrimarySeedPhraseBackedUp,
  getWeb3ShimUsageAlertEnabledness,
} from '../../ducks/metamask/metamask';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getShouldShowSeedPhraseReminder } from '../../selectors/multi-srp/multi-srp';
import {
  setWeb3ShimUsageAlertDismissed,
  setAlertEnabledness,
  setOutdatedBrowserWarningLastShown,
  setNewNetworkAdded,
  setActiveNetwork,
  setEditedNetwork,
} from '../../store/actions';
import { isMv3ButOffscreenDocIsMissing } from '../../../shared/lib/mv3.utils';
import { getIsBrowserDeprecated } from '../../helpers/utils/util';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import {
  Web3ShimUsageAlertStates,
  AlertTypes,
} from '../../../shared/constants/alerts';
import { SECOND } from '../../../shared/constants/time';
import { FontWeight } from '../../helpers/constants/design-system';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import HomeNotification from '../../components/app/home-notification';
import MultipleNotifications from '../../components/app/multiple-notifications';
import { SeedPhraseBackupNotificationContainer } from '../../components/app/recovery-phrase-reminder';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';
import type { MetaMaskReduxState } from '../../store/store';
import { useAppDispatch } from '../../store/hooks';

const AUTO_HIDE_DELAY = 5 * SECOND;

/** Survives StrictMode remounts within the same extension session. */
const activatedNewNetworkConfigurationIds = new Set<string>();
let lastPendingNetworkConfigurationId = '';

/** @internal */
export function resetActivatedNewNetworkConfigurationIdsForTesting(): void {
  activatedNewNetworkConfigurationIds.clear();
  lastPendingNetworkConfigurationId = '';
}

/**
 * Self-contained container for all home-page banner notifications.
 * Reads state from Redux, owns the new-network activation effect, and manages
 * the `canShowBlockageNotification` dismiss flag locally so that Home no
 * longer needs any notification-specific props.
 */
export const HomeNotificationsContainer = memo(function () {
  const t = useI18nContext();
  const dispatch = useAppDispatch();

  const [canShowBlockageNotification, setCanShowBlockageNotification] =
    useState(true);

  const newNetworkAddedName = useSelector(getNewNetworkAdded);
  const newNetworkAddedConfigurationId = useSelector(
    (state: MetaMaskReduxState) =>
      state.appState.newNetworkAddedConfigurationId,
  );
  const editedNetwork = useSelector(getEditedNetwork);
  const infuraBlocked = useSelector(getInfuraBlocked);
  const originOfCurrentTab = useSelector(getOriginOfCurrentTab);

  // Computed once: these values do not depend on Redux state.
  const isBrowserDeprecated = useMemo(() => getIsBrowserDeprecated(), []);
  const isPopupEnvironment = useMemo(
    () => getEnvironmentType() === ENVIRONMENT_TYPE_POPUP,
    [],
  );

  const showOutdatedBrowserWarningRaw = useSelector(
    getShowOutdatedBrowserWarning,
  );
  const showOutdatedBrowserWarning =
    isBrowserDeprecated && showOutdatedBrowserWarningRaw;

  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const seedPhraseReminderSelector = useMemo(
    () => (state: MetaMaskReduxState) =>
      selectedAccount
        ? getShouldShowSeedPhraseReminder(state, selectedAccount)
        : false,
    [selectedAccount],
  );
  const shouldShowSeedPhraseReminder = useSelector(seedPhraseReminderSelector);

  const web3ShimUsageAlertEnabled = useSelector(
    getWeb3ShimUsageAlertEnabledness,
  );
  const hasActiveTabPermissions = useSelector(activeTabHasPermissions);
  const web3ShimUsageStateForOrigin = useSelector((state: MetaMaskReduxState) =>
    originOfCurrentTab
      ? getWeb3ShimUsageStateForOrigin(state, originOfCurrentTab)
      : undefined,
  );
  const shouldShowWeb3ShimUsageNotification = useMemo(
    () =>
      isPopupEnvironment &&
      web3ShimUsageAlertEnabled &&
      hasActiveTabPermissions &&
      web3ShimUsageStateForOrigin === Web3ShimUsageAlertStates.recorded,
    [
      isPopupEnvironment,
      web3ShimUsageAlertEnabled,
      hasActiveTabPermissions,
      web3ShimUsageStateForOrigin,
    ],
  );

  const clearNewNetworkAdded = useCallback(
    () =>
      dispatch(
        setNewNetworkAdded(
          {} as { networkConfigurationId: string; nickname: string },
        ),
      ),
    [dispatch],
  );

  const clearEditedNetwork = useCallback(
    () => dispatch(setEditedNetwork()),
    [dispatch],
  );

  // Auto-dismiss the "edited network" banner after AUTO_HIDE_DELAY.
  const editedNetworkVisible = Boolean(editedNetwork?.editCompleted);
  useEffect(() => {
    if (!editedNetworkVisible) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      clearEditedNetwork();
    }, AUTO_HIDE_DELAY);
    return () => clearTimeout(timeout);
  }, [editedNetworkVisible, clearEditedNetwork]);

  const onOutdatedBrowserWarningClose = useCallback(() => {
    dispatch(setOutdatedBrowserWarningLastShown(new Date().getTime()));
  }, [dispatch]);

  // When a new network is added, activate it and clear the pending flag.
  useEffect(() => {
    if (!newNetworkAddedConfigurationId) {
      if (lastPendingNetworkConfigurationId) {
        activatedNewNetworkConfigurationIds.delete(
          lastPendingNetworkConfigurationId,
        );
        lastPendingNetworkConfigurationId = '';
      }
      return;
    }

    const configurationId = newNetworkAddedConfigurationId;
    lastPendingNetworkConfigurationId = configurationId;
    clearNewNetworkAdded();

    if (activatedNewNetworkConfigurationIds.has(configurationId)) {
      return;
    }

    activatedNewNetworkConfigurationIds.add(configurationId);
    dispatch(setActiveNetwork(configurationId));
  }, [newNetworkAddedConfigurationId, dispatch, clearNewNetworkAdded]);

  const outdatedBrowserDescription = useMemo(
    () =>
      // isMv3ButOffscreenDocIsMissing is a build-time constant — no need in deps
      isMv3ButOffscreenDocIsMissing ? (
        <div>
          <Text>{t('outdatedBrowserNotification')}</Text>
          <br />
          <Text fontWeight={FontWeight.Bold} color={TextColor.WarningDefault}>
            {t('noHardwareWalletOrSnapsSupport')}
          </Text>
        </div>
      ) : (
        t('outdatedBrowserNotification')
      ),
    [t],
  );

  const notificationItems = [
    newNetworkAddedName ? (
      <BannerAlert
        key="new-network-added"
        severity={BannerAlertSeverity.Success}
        className="home__new-network-notification"
        onClose={clearNewNetworkAdded}
      >
        <Text variant={TextVariant.BodySm} asChild>
          <h6>{t('newNetworkAdded', [newNetworkAddedName])}</h6>
        </Text>
      </BannerAlert>
    ) : null,
    editedNetwork?.editCompleted ? (
      <BannerAlert
        key="edited-network"
        severity={BannerAlertSeverity.Success}
        className="home__new-tokens-imported-notification"
        onClose={clearEditedNetwork}
      >
        <Text variant={TextVariant.BodySm} asChild>
          <h6>
            {editedNetwork.newNetwork
              ? t('newNetworkAdded', [editedNetwork.nickname])
              : t('newNetworkEdited', [editedNetwork.nickname])}
          </h6>
        </Text>
      </BannerAlert>
    ) : null,
    !isPrimarySeedPhraseBackedUp && shouldShowSeedPhraseReminder ? (
      <SeedPhraseBackupNotificationContainer key="show-seed-phrase-reminder" />
    ) : null,
    shouldShowWeb3ShimUsageNotification ? (
      <HomeNotification
        key="show-web3-shim"
        descriptionText={t('web3ShimUsageNotification', [
          <span
            key="web3ShimUsageNotificationLink"
            className="home-notification__text-link"
            onClick={() =>
              global.platform.openTab({ url: ZENDESK_URLS.LEGACY_WEB3 })
            }
          >
            {t('here')}
          </span>,
        ])}
        ignoreText={t('dismiss')}
        onIgnore={(disable: boolean) => {
          setWeb3ShimUsageAlertDismissed(originOfCurrentTab ?? '');
          if (disable) {
            setAlertEnabledness(AlertTypes.web3ShimUsage, false);
          }
        }}
        checkboxText={t('dontShowThisAgain')}
        checkboxTooltipText={t('canToggleInSettings')}
      />
    ) : null,
    infuraBlocked && canShowBlockageNotification ? (
      <HomeNotification
        key="infura-blocked"
        descriptionText={t('infuraBlockedNotification', [
          <span
            key="infuraBlockedNotificationLink"
            className="home-notification__text-link"
            onClick={() =>
              global.platform.openTab({ url: ZENDESK_URLS.INFURA_BLOCKAGE })
            }
          >
            {t('here')}
          </span>,
        ])}
        ignoreText={t('dismiss')}
        onIgnore={() => setCanShowBlockageNotification(false)}
      />
    ) : null,
    showOutdatedBrowserWarning ? (
      <HomeNotification
        key="outdated-browser-notification"
        descriptionText={outdatedBrowserDescription}
        acceptText={t('gotIt')}
        onAccept={onOutdatedBrowserWarningClose}
      />
    ) : null,
  ].filter(Boolean);

  if (!notificationItems.length) {
    return null;
  }

  return <MultipleNotifications>{notificationItems}</MultipleNotifications>;
});
