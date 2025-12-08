import React, { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useDispatch, useSelector } from 'react-redux';
import browser from 'webextension-polyfill';
import {
  useUnreadNotificationsCounter,
  useReadNotificationsCounter,
} from '../../../hooks/metamask-notifications/useCounter';
import { NotificationsTagCounter } from '../notifications-tag-counter';
import { NewFeatureTag } from '../../../pages/notifications/NewFeatureTag';
import {
  SETTINGS_ROUTE,
  DEFAULT_ROUTE,
  NOTIFICATIONS_ROUTE,
  SNAPS_ROUTE,
  PERMISSIONS,
  GATOR_PERMISSIONS,
} from '../../../helpers/constants/routes';
import {
  lockMetamask,
  setShowSupportDataConsentModal,
  showConfirmTurnOnMetamaskNotifications,
  toggleNetworkMenu,
  setUseSidePanelAsDefault,
} from '../../../store/actions';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../shared/modules/environment';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useSidePanelEnabled } from '../../../hooks/useSidePanelEnabled';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsMetamaskNotificationsFeatureSeen,
} from '../../../selectors/metamask-notifications/metamask-notifications';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import {
  Box,
  IconName,
  Popover,
  PopoverPosition,
  Tag,
} from '../../component-library';

import { MenuItem } from '../../ui/menu';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  PLATFORM_FIREFOX,
} from '../../../../shared/constants/app';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';
///: BEGIN:ONLY_INCLUDE_IF(build-beta,build-flask)
import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
///: END:ONLY_INCLUDE_IF

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import {
  getSelectedInternalAccount,
  getUnapprovedTransactions,
  getAnySnapUpdateAvailable,
  getThirdPartyNotifySnaps,
  getUseExternalServices,
  getPreferences,
} from '../../../selectors';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AccountDetailsMenuItem,
  DiscoverMenuItem,
  ViewExplorerMenuItem,
} from '../menu-items';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors/multichain-accounts/feature-flags';
import { useUserSubscriptions } from '../../../hooks/subscription/useSubscription';
import {
  getIsShieldSubscriptionActive,
  getIsShieldSubscriptionPaused,
  getShieldSubscription,
  getSubscriptionPaymentData,
} from '../../../../shared/lib/shield';
import { selectRewardsEnabled } from '../../../ducks/rewards/selectors';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';

const METRICS_LOCATION = 'Global Menu';

type GlobalMenuProps = {
  closeMenu: () => void;
  anchorElement: HTMLElement | null;
  isOpen: boolean;
};

export const GlobalMenu = ({
  closeMenu,
  anchorElement,
  isOpen,
}: GlobalMenuProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { captureCommonExistingShieldSubscriptionEvents } =
    useSubscriptionMetrics();
  const basicFunctionality = useSelector(getUseExternalServices);
  const rewardsEnabled = useSelector(selectRewardsEnabled);

  const navigate = useNavigate();

  const { notificationsUnreadCount } = useUnreadNotificationsCounter();
  const { notificationsReadCount } = useReadNotificationsCounter();

  const { subscriptions } = useUserSubscriptions();
  const isActiveShieldSubscription =
    getIsShieldSubscriptionActive(subscriptions);
  const isPausedShieldSubscription =
    getIsShieldSubscriptionPaused(subscriptions);

  const account = useSelector(getSelectedInternalAccount);

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const unapprovedTransactions = useSelector(getUnapprovedTransactions);

  const isMetamaskNotificationFeatureSeen = useSelector(
    selectIsMetamaskNotificationsFeatureSeen,
  );

  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const hasUnapprovedTransactions =
    Object.keys(unapprovedTransactions).length > 0;

  /**
   * This condition is used to control whether the client shows the "turn on notifications"
   * modal. This allowed third party users with existing notifications to view their snap
   * notifications without turning on wallet notifications
   *
   * It excludes users with preinstalled notify snaps (e.g. the institutional snap)
   * which have the notify permission, so as to retain the existing workflow
   */

  let hasThirdPartyNotifySnaps = false;
  const snapsUpdatesAvailable = useSelector(getAnySnapUpdateAvailable);
  hasThirdPartyNotifySnaps = useSelector(getThirdPartyNotifySnaps).length > 0;

  // Check if side panel is currently the default (vs popup)
  const preferences = useSelector(getPreferences);
  const isSidePanelDefault = preferences?.useSidePanelAsDefault ?? false;

  // Check if sidepanel feature is enabled
  const isSidePanelEnabled = useSidePanelEnabled();

  const showPriorityTag = useMemo(
    () =>
      (isActiveShieldSubscription || isPausedShieldSubscription) &&
      basicFunctionality,
    [
      isActiveShieldSubscription,
      isPausedShieldSubscription,
      basicFunctionality,
    ],
  );

  /**
   * Toggles between side panel and popup as the default extension behavior
   */
  const toggleDefaultView = async () => {
    // Only allow sidepanel functionality if the feature flag is enabled
    if (!isSidePanelEnabled) {
      return;
    }

    try {
      const newValue = !isSidePanelDefault;
      await dispatch(setUseSidePanelAsDefault(newValue));

      // If switching from sidepanel to popup view, close the current sidepanel
      if (
        isSidePanelDefault &&
        getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL
      ) {
        // Close only the sidepanel, not the entire browser window
        window.close();
      }
      // If switching from popup to sidepanel view, open the sidepanel
      else if (
        !isSidePanelDefault &&
        getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
      ) {
        try {
          const browserWithSidePanel = browser as typeof browser & {
            sidePanel?: {
              open: (options: { windowId: number }) => Promise<void>;
            };
          };
          if (browserWithSidePanel?.sidePanel?.open) {
            const tabs = await browser.tabs.query({
              active: true,
              currentWindow: true,
            });
            if (tabs && tabs.length > 0 && tabs[0].windowId) {
              await browserWithSidePanel.sidePanel.open({
                windowId: tabs[0].windowId,
              });
              // Close the popup after successfully opening the sidepanel
              window.close();
            }
          }
        } catch (error) {
          console.error('Error opening side panel:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling default view:', error);
    }
  };

  let supportText = t('support');
  let supportLink = SUPPORT_LINK || '';
  ///: BEGIN:ONLY_INCLUDE_IF(build-beta,build-flask)
  supportText = t('needHelpSubmitTicket');
  supportLink = SUPPORT_REQUEST_LINK || '';
  ///: END:ONLY_INCLUDE_IF

  // Accessibility improvement for popover
  const lastItemRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const lastItem = lastItemRef.current as HTMLElement;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.shiftKey) {
        event.preventDefault();
        closeMenu();
      }
    };

    if (lastItem) {
      lastItem.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (lastItem) {
        lastItem.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [closeMenu]);

  const handleNotificationsClick = () => {
    const shouldShowEnableModal =
      !hasThirdPartyNotifySnaps && !isMetamaskNotificationsEnabled;

    if (shouldShowEnableModal) {
      trackEvent({
        category: MetaMetricsEventCategory.NotificationsActivationFlow,
        event: MetaMetricsEventName.NotificationsActivated,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          action_type: 'started',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_profile_syncing_enabled: isBackupAndSyncEnabled,
        },
      });
      dispatch(showConfirmTurnOnMetamaskNotifications());

      closeMenu();
      return;
    }

    // Otherwise we can navigate to the notifications page
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationsMenuOpened,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        unread_count: notificationsUnreadCount,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        read_count: notificationsReadCount,
      },
    });
    navigate(NOTIFICATIONS_ROUTE);
    closeMenu();
  };

  const handleSupportMenuClick = () => {
    dispatch(setShowSupportDataConsentModal(true));
    trackEvent(
      {
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: supportLink,
          location: METRICS_LOCATION,
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
    if (showPriorityTag) {
      // track priority support clicked event
      const shieldSubscription = getShieldSubscription(subscriptions);
      const { cryptoPaymentChain, cryptoPaymentCurrency } =
        getSubscriptionPaymentData(shieldSubscription);
      if (shieldSubscription) {
        captureCommonExistingShieldSubscriptionEvents(
          {
            subscriptionStatus: shieldSubscription.status,
            paymentType: shieldSubscription.paymentMethod.type,
            billingInterval: shieldSubscription.interval,
            cryptoPaymentChain,
            cryptoPaymentCurrency,
          },
          MetaMetricsEventName.ShieldPrioritySupportClicked,
        );
      }
    }
    closeMenu();
  };

  return (
    <Popover
      data-testid="global-menu"
      referenceElement={anchorElement}
      isOpen={isOpen}
      padding={0}
      onClickOutside={closeMenu}
      onPressEscKey={closeMenu}
      style={{
        minWidth: 225,
        maxHeight: 'calc(100vh - var(--header-height))',
      }}
      offset={[0, 8]}
      position={PopoverPosition.BottomEnd}
      className="overflow-y-auto"
    >
      {basicFunctionality && (
        <>
          <MenuItem
            iconName={IconName.Notification}
            onClick={() => handleNotificationsClick()}
            data-testid="notifications-menu-item"
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
            >
              {t('notifications')}
              {notificationsUnreadCount === 0 &&
                !isMetamaskNotificationFeatureSeen && <NewFeatureTag />}
              <NotificationsTagCounter />
            </Box>
          </MenuItem>
          <Box
            borderColor={BorderColor.borderMuted}
            width={BlockSize.Full}
            style={{ height: '1px', borderBottomWidth: 0 }}
          ></Box>
        </>
      )}
      {rewardsEnabled && (
        <DiscoverMenuItem
          metricsLocation={METRICS_LOCATION}
          closeMenu={closeMenu}
        />
      )}

      {(getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ||
        getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL) && (
        <MenuItem
          iconName={IconName.Export}
          onClick={() => {
            global?.platform?.openExtensionInBrowser?.();
            trackEvent({
              event: MetaMetricsEventName.AppWindowExpanded,
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                location: METRICS_LOCATION,
              },
            });
            closeMenu();
          }}
          data-testid="global-menu-expand-view"
        >
          {t('openFullScreen')}
        </MenuItem>
      )}
      {account &&
        getEnvironmentType() !== ENVIRONMENT_TYPE_POPUP &&
        getEnvironmentType() !== ENVIRONMENT_TYPE_SIDEPANEL && (
          <>
            <AccountDetailsMenuItem
              metricsLocation={METRICS_LOCATION}
              closeMenu={closeMenu}
              address={account.address}
            />
            {isMultichainAccountsState2Enabled ? null : (
              <ViewExplorerMenuItem
                metricsLocation={METRICS_LOCATION}
                closeMenu={closeMenu}
                account={account}
              />
            )}
          </>
        )}
      <Box
        borderColor={BorderColor.borderMuted}
        width={BlockSize.Full}
        style={{ height: '1px', borderBottomWidth: 0 }}
      ></Box>
      {/* Toggle between popup and sidepanel - only for Chrome when sidepanel is enabled */}
      {getBrowserName() !== PLATFORM_FIREFOX &&
        isSidePanelEnabled &&
        (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ||
          getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL) && (
          <MenuItem
            iconName={isSidePanelDefault ? IconName.Popup : IconName.Sidepanel}
            onClick={async () => {
              await toggleDefaultView();
              trackEvent({
                event: MetaMetricsEventName.ViewportSwitched,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  location: METRICS_LOCATION,
                  to: isSidePanelDefault
                    ? ENVIRONMENT_TYPE_POPUP
                    : ENVIRONMENT_TYPE_SIDEPANEL,
                },
              });
              closeMenu();
            }}
            data-testid="global-menu-toggle-view"
          >
            {isSidePanelDefault ? t('switchToPopup') : t('switchToSidePanel')}
          </MenuItem>
        )}
      <MenuItem
        to={
          isGatorPermissionsRevocationFeatureEnabled()
            ? GATOR_PERMISSIONS
            : PERMISSIONS
        }
        iconName={IconName.SecurityTick}
        onClick={() => {
          trackEvent({
            event: MetaMetricsEventName.NavPermissionsOpened,
            category: MetaMetricsEventCategory.Navigation,
            properties: {
              location: METRICS_LOCATION,
            },
          });
          closeMenu();
        }}
        data-testid="global-menu-connected-sites"
        disabled={hasUnapprovedTransactions}
      >
        {t('allPermissions')}
      </MenuItem>
      <MenuItem
        data-testid="global-menu-networks"
        iconName={IconName.Hierarchy}
        onClick={() => {
          dispatch(toggleNetworkMenu());
          closeMenu();
        }}
      >
        {t('networks')}
      </MenuItem>
      <MenuItem
        to={SNAPS_ROUTE}
        iconName={IconName.Snaps}
        onClick={closeMenu}
        showInfoDot={snapsUpdatesAvailable}
      >
        {t('snaps')}
      </MenuItem>
      <MenuItem
        iconName={IconName.MessageQuestion}
        onClick={handleSupportMenuClick}
        data-testid="global-menu-support"
      >
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
        >
          {supportText}
          {showPriorityTag && (
            <Tag
              label={t('priority')}
              labelProps={{
                variant: TextVariant.bodySmMedium,
                color: TextColor.successDefault,
              }}
              startIconName={IconName.Sparkle}
              startIconProps={{
                color: IconColor.successDefault,
              }}
              borderStyle={BorderStyle.none}
              borderRadius={BorderRadius.LG}
              backgroundColor={BackgroundColor.successMuted}
            />
          )}
        </Box>
      </MenuItem>
      <MenuItem
        to={SETTINGS_ROUTE}
        iconName={IconName.Setting}
        disabled={hasUnapprovedTransactions}
        onClick={() => {
          trackEvent({
            category: MetaMetricsEventCategory.Navigation,
            event: MetaMetricsEventName.NavSettingsOpened,
            properties: {
              location: METRICS_LOCATION,
            },
          });
          closeMenu();
        }}
        data-testid="global-menu-settings"
      >
        {t('settings')}
      </MenuItem>
      <MenuItem
        to={DEFAULT_ROUTE}
        ref={lastItemRef} // ref for last item in GlobalMenu
        iconName={IconName.Lock}
        onClick={() => {
          dispatch(lockMetamask(t('lockMetaMaskLoadingMessage')));
          trackEvent({
            category: MetaMetricsEventCategory.Navigation,
            event: MetaMetricsEventName.AppLocked,
            properties: {
              location: METRICS_LOCATION,
            },
          });
          closeMenu();
        }}
        data-testid="global-menu-lock"
      >
        {t('lockMetaMask')}
      </MenuItem>
    </Popover>
  );
};
