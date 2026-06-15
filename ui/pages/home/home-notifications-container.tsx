import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  setWeb3ShimUsageAlertDismissed,
  setAlertEnabledness,
  setOutdatedBrowserWarningLastShown,
  setNewNetworkAdded,
  setActiveNetwork,
  setEditedNetwork,
} from '../../store/actions';
import { getWeb3ShimUsageAlertEnabledness } from '../../ducks/metamask/metamask';
import { isMv3ButOffscreenDocIsMissing } from '../../../shared/lib/mv3.utils';
import { getIsBrowserDeprecated } from '../../helpers/utils/util';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import {
  Web3ShimUsageAlertStates,
  AlertTypes,
} from '../../../shared/constants/alerts';
import { SECOND } from '../../../shared/constants/time';
import { FontWeight, Display } from '../../helpers/constants/design-system';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import ActionableMessage from '../../components/ui/actionable-message/actionable-message';
import HomeNotification from '../../components/app/home-notification';
import MultipleNotifications from '../../components/app/multiple-notifications';
import { SeedPhraseBackupNotificationContainer } from '../../components/app/recovery-phrase-reminder';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Box,
} from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';
import type { MetaMaskReduxState } from '../../store/store';

const AUTO_HIDE_DELAY = 5 * SECOND;

/**
 * Self-contained container for all home-page banner notifications.
 * Reads state from Redux, owns the new-network activation effect, and manages
 * the `canShowBlockageNotification` dismiss flag locally so that Home no
 * longer needs any notification-specific props.
 */
export const HomeNotificationsContainer = memo(function () {
  const t = useI18nContext();
  const dispatch = useDispatch();

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

  const showOutdatedBrowserWarning = useSelector(
    (state: MetaMaskReduxState) =>
      getIsBrowserDeprecated() && getShowOutdatedBrowserWarning(state),
  );

  const shouldShowWeb3ShimUsageNotification = useSelector(
    (state: MetaMaskReduxState) => {
      if (getEnvironmentType() !== ENVIRONMENT_TYPE_POPUP) {
        return false;
      }
      if (!getWeb3ShimUsageAlertEnabledness(state)) {
        return false;
      }
      if (!activeTabHasPermissions(state)) {
        return false;
      }
      const origin = getOriginOfCurrentTab(state);
      return (
        getWeb3ShimUsageStateForOrigin(state, origin) ===
        Web3ShimUsageAlertStates.recorded
      );
    },
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

  const onEditedNetworkAutoHide = useCallback(
    () => clearEditedNetwork(),
    [clearEditedNetwork],
  );

  const onOutdatedBrowserWarningClose = useCallback(() => {
    dispatch(setOutdatedBrowserWarningLastShown(new Date().getTime()));
  }, [dispatch]);

  // When a new network is added, activate it and clear the pending flag.
  const prevNetworkConfigIdRef = useRef(newNetworkAddedConfigurationId);
  useEffect(() => {
    const prev = prevNetworkConfigIdRef.current;
    prevNetworkConfigIdRef.current = newNetworkAddedConfigurationId;
    if (
      newNetworkAddedConfigurationId &&
      prev !== newNetworkAddedConfigurationId
    ) {
      dispatch(setActiveNetwork(newNetworkAddedConfigurationId));
      clearNewNetworkAdded();
    }
  }, [newNetworkAddedConfigurationId, dispatch, clearNewNetworkAdded]);

  const outdatedBrowserDescription = isMv3ButOffscreenDocIsMissing ? (
    <div>
      <Text>{t('outdatedBrowserNotification')}</Text>
      <br />
      <Text fontWeight={FontWeight.Bold} color={TextColor.WarningDefault}>
        {t('noHardwareWalletOrSnapsSupport')}
      </Text>
    </div>
  ) : (
    t('outdatedBrowserNotification')
  );

  const notificationItems = [
    newNetworkAddedName ? (
      <ActionableMessage
        key="new-network-added"
        type="success"
        className="home__new-network-notification"
        message={
          <Box display={Display.InlineFlex}>
            <i className="fa fa-check-circle home__new-network-notification-icon" />
            <Text variant={TextVariant.BodySm} asChild>
              <h6>{t('newNetworkAdded', [newNetworkAddedName])}</h6>
            </Text>
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSize.Sm}
              ariaLabel={t('close')}
              onClick={clearNewNetworkAdded}
              className="home__new-network-notification-close"
            />
          </Box>
        }
      />
    ) : null,
    editedNetwork?.editCompleted ? (
      <ActionableMessage
        key="edited-network"
        type="success"
        className="home__new-tokens-imported-notification"
        autoHideTime={AUTO_HIDE_DELAY}
        onAutoHide={onEditedNetworkAutoHide}
        message={
          <Box display={Display.InlineFlex}>
            <i className="fa fa-check-circle home__new-network-notification-icon" />
            <Text variant={TextVariant.BodySm} asChild>
              <h6>
                {editedNetwork.newNetwork
                  ? t('newNetworkAdded', [editedNetwork.nickname])
                  : t('newNetworkEdited', [editedNetwork.nickname])}
              </h6>
            </Text>
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSize.Sm}
              ariaLabel={t('close')}
              onClick={clearEditedNetwork}
              className="home__new-network-notification-close"
            />
          </Box>
        }
      />
    ) : null,
    <SeedPhraseBackupNotificationContainer key="show-seed-phrase-reminder" />,
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
