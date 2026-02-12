import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import browser from 'webextension-polyfill';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  IconColor,
  IconName,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  useReadNotificationsCounter,
  useUnreadNotificationsCounter,
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
import { useBrowserSupportsSidePanel } from '../../../hooks/useBrowserSupportsSidePanel';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsMetamaskNotificationsFeatureSeen,
} from '../../../selectors/metamask-notifications/metamask-notifications';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import { Tag } from '../../component-library';
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
  getUnapprovedTransactions,
  getAnySnapUpdateAvailable,
  getThirdPartyNotifySnaps,
  getUseExternalServices,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getDataCollectionForMarketing,
} from '../../../selectors';
import { useUserSubscriptions } from '../../../hooks/subscription/useSubscription';
import {
  getIsShieldSubscriptionActive,
  getIsShieldSubscriptionPaused,
  getShieldSubscription,
  getSubscriptionPaymentData,
} from '../../../../shared/lib/shield';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import type { GlobalMenuSection } from '../global-menu/global-menu-list.types';

const METRICS_LOCATION = 'Global Menu';

/**
 * Hook that returns menu sections with the same data and behavior as GlobalMenu.
 * Use with GlobalMenuList inside GlobalMenuDrawer to render the menu in a drawer.
 *
 * @param onClose - Callback to close the drawer/menu when an action is taken
 */
export function useGlobalMenuSections(
  onClose: () => void,
): GlobalMenuSection[] {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { captureCommonExistingShieldSubscriptionEvents } =
    useSubscriptionMetrics();
  const navigate = useNavigate();

  const basicFunctionality = useSelector(getUseExternalServices);
  const { notificationsUnreadCount } = useUnreadNotificationsCounter();
  const { notificationsReadCount } = useReadNotificationsCounter();
  const isMetamaskNotificationFeatureSeen = useSelector(
    selectIsMetamaskNotificationsFeatureSeen,
  );
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const unapprovedTransactions = useSelector(getUnapprovedTransactions);
  const hasUnapprovedTransactions =
    Object.keys(unapprovedTransactions).length > 0;
  let hasThirdPartyNotifySnaps = false;
  const snapsUpdatesAvailable = useSelector(getAnySnapUpdateAvailable);
  hasThirdPartyNotifySnaps = useSelector(getThirdPartyNotifySnaps).length > 0;

  const isSidePanelEnabled = useSidePanelEnabled();
  const browserSupportsSidePanel = useBrowserSupportsSidePanel();
  const currentEnvironment = getEnvironmentType();
  const isSidepanel = currentEnvironment === ENVIRONMENT_TYPE_SIDEPANEL;
  const isPopup = currentEnvironment === ENVIRONMENT_TYPE_POPUP;

  const { subscriptions } = useUserSubscriptions();
  const isActiveShieldSubscription =
    getIsShieldSubscriptionActive(subscriptions);
  const isPausedShieldSubscription =
    getIsShieldSubscriptionPaused(subscriptions);
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

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  let supportText = t('support');
  let supportLink = SUPPORT_LINK || '';
  ///: BEGIN:ONLY_INCLUDE_IF(build-beta,build-flask)
  supportText = t('needHelpSubmitTicket');
  supportLink = SUPPORT_REQUEST_LINK || '';
  ///: END:ONLY_INCLUDE_IF

  const handleNotificationsClick = useCallback(() => {
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
      onClose();
      return;
    }

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
    onClose();
  }, [
    hasThirdPartyNotifySnaps,
    isMetamaskNotificationsEnabled,
    trackEvent,
    isBackupAndSyncEnabled,
    dispatch,
    onClose,
    navigate,
    notificationsUnreadCount,
    notificationsReadCount,
  ]);

  const handleSupportMenuClick = useCallback(() => {
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
    onClose();
  }, [
    dispatch,
    trackEvent,
    supportLink,
    showPriorityTag,
    subscriptions,
    captureCommonExistingShieldSubscriptionEvents,
    onClose,
  ]);

  const toggleDefaultView = useCallback(async () => {
    if (!isSidePanelEnabled) {
      return;
    }

    try {
      if (isSidepanel) {
        await dispatch(setUseSidePanelAsDefault(false));
        window.close();
        return;
      }

      if (isPopup) {
        const browserWithSidePanel = browser as typeof browser & {
          sidePanel?: {
            open: (options: { windowId: number }) => Promise<void>;
          };
        };

        if (!browserWithSidePanel?.sidePanel?.open) {
          return;
        }

        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (tabs && tabs.length > 0 && tabs[0].windowId) {
          await browserWithSidePanel.sidePanel.open({
            windowId: tabs[0].windowId,
          });
          await new Promise((resolve) => setTimeout(resolve, 500));

          const contexts = await chrome.runtime.getContexts({
            contextTypes: ['SIDE_PANEL' as chrome.runtime.ContextType],
          });

          if (!contexts || contexts.length === 0) {
            return;
          }

          await dispatch(setUseSidePanelAsDefault(true));
          window.close();
        }
      }
    } catch (error) {
      console.error('Error toggling default view:', error);
    }
  }, [isSidePanelEnabled, isSidepanel, isPopup, dispatch]);

  return useMemo(() => {
    const section1: GlobalMenuSection = {
      id: 'global-menu-section-1',
      items: [],
    };

    if (basicFunctionality) {
      section1.items.push({
        id: 'notifications-menu-item',
        iconName: IconName.Notification,
        label: (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
          >
            {t('notifications')}
            {notificationsUnreadCount === 0 &&
              !isMetamaskNotificationFeatureSeen && <NewFeatureTag />}
            <NotificationsTagCounter />
          </Box>
        ),
        onClick: handleNotificationsClick,
      });
    }

    const section2: GlobalMenuSection = {
      id: 'global-menu-section-2',
      items: [],
    };

    section2.items.push({
      id: 'discover',
      iconName: IconName.Export,
      label: t('discover'),
      onClick: () => {
        const url = getPortfolioUrl(
          'explore/tokens',
          'ext_portfolio_button',
          metaMetricsId,
          isMetaMetricsEnabled,
          isMarketingEnabled,
        );
        global.platform.openTab({ url });
        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.PortfolioLinkClicked,
          properties: { location: METRICS_LOCATION, text: 'Portfolio' },
        });
        onClose();
      },
    });

    if (isPopup || isSidepanel) {
      section2.items.push({
        id: 'global-menu-expand-view',
        iconName: IconName.Expand,
        label: t('openFullScreen'),
        onClick: () => {
          global?.platform?.openExtensionInBrowser?.();
          trackEvent({
            event: MetaMetricsEventName.AppWindowExpanded,
            category: MetaMetricsEventCategory.Navigation,
            properties: { location: METRICS_LOCATION },
          });
          onClose();
        },
      });
    }

    if (
      getBrowserName() !== PLATFORM_FIREFOX &&
      browserSupportsSidePanel === true &&
      isSidePanelEnabled &&
      (isPopup || isSidepanel)
    ) {
      section2.items.push({
        id: 'global-menu-toggle-view',
        // TODO: Add back the correct icon name when the design system is updated
        // iconName: isSidepanel ? IconName.PopUp : IconName.SidePanel,
        iconName: IconName.Expand,
        label: isSidepanel ? t('switchToPopup') : t('switchToSidePanel'),
        onClick: async () => {
          await toggleDefaultView();
          trackEvent({
            event: MetaMetricsEventName.ViewportSwitched,
            category: MetaMetricsEventCategory.Navigation,
            properties: {
              location: METRICS_LOCATION,
              to: isSidepanel
                ? ENVIRONMENT_TYPE_POPUP
                : ENVIRONMENT_TYPE_SIDEPANEL,
            },
          });
          onClose();
        },
      });
    }

    const section2Manage: GlobalMenuSection = {
      id: 'global-menu-section-manage',
      title: t('manage'),
      items: [
        {
          id: 'global-menu-connected-sites',
          iconName: IconName.SecurityTick,
          label: t('allPermissions'),
          to: isGatorPermissionsRevocationFeatureEnabled()
            ? GATOR_PERMISSIONS
            : PERMISSIONS,
          onClick: () => {
            trackEvent({
              event: MetaMetricsEventName.NavPermissionsOpened,
              category: MetaMetricsEventCategory.Navigation,
              properties: { location: METRICS_LOCATION },
            });
            onClose();
          },
          disabled: hasUnapprovedTransactions,
        },
        {
          id: 'global-menu-networks',
          iconName: IconName.Hierarchy,
          label: t('networks'),
          onClick: () => {
            dispatch(toggleNetworkMenu());
            onClose();
          },
        },
        {
          id: 'global-menu-snaps',
          iconName: IconName.Snaps,
          label: t('snaps'),
          to: SNAPS_ROUTE,
          onClick: onClose,
          showInfoDot: snapsUpdatesAvailable,
        },
      ],
    };

    const section3HelpAndSettings: GlobalMenuSection = {
      id: 'global-menu-section-help-settings',
      title: t('helpAndSettings'),
      items: [
        {
          id: 'global-menu-settings',
          iconName: IconName.Setting,
          label: t('settings'),
          to: SETTINGS_ROUTE,
          onClick: () => {
            trackEvent({
              category: MetaMetricsEventCategory.Navigation,
              event: MetaMetricsEventName.NavSettingsOpened,
              properties: { location: METRICS_LOCATION },
            });
            onClose();
          },
          disabled: hasUnapprovedTransactions,
        },
        {
          id: 'global-menu-support',
          iconName: IconName.MessageQuestion,
          label: (
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Between}
            >
              {supportText}
              {showPriorityTag && (
                <Tag
                  label={t('priority')}
                  textVariant={TextVariant.BodySm}
                  className="rounded-lg border-0 bg-success-muted"
                  labelProps={{
                    className: 'text-success-default',
                  }}
                  iconName={IconName.Sparkle}
                  startIconProps={{
                    className: 'text-success-default',
                  }}
                />
              )}
            </Box>
          ),
          onClick: handleSupportMenuClick,
        },
      ],
    };

    const section4LogOut: GlobalMenuSection = {
      id: 'global-menu-section-log-out',
      items: [
        {
          id: 'global-menu-lock',
          iconName: IconName.Lock,
          iconColor: IconColor.ErrorDefault,
          textColor: TextColor.ErrorDefault,
          label: t('logOut'),
          onClick: () => {
            navigate(DEFAULT_ROUTE);
            dispatch(lockMetamask(t('lockMetaMaskLoadingMessage')));
            trackEvent({
              category: MetaMetricsEventCategory.Navigation,
              event: MetaMetricsEventName.AppLocked,
              properties: { location: METRICS_LOCATION },
            });
            onClose();
          },
        },
      ],
    };

    const sections: GlobalMenuSection[] = [];
    if (section1.items.length > 0) {
      sections.push(section1);
    }
    if (section2.items.length > 0) {
      sections.push(section2);
    }
    sections.push(section2Manage);
    sections.push(section3HelpAndSettings);
    sections.push(section4LogOut);

    return sections;
  }, [
    t,
    basicFunctionality,
    isPopup,
    isSidepanel,
    hasUnapprovedTransactions,
    snapsUpdatesAvailable,
    showPriorityTag,
    notificationsUnreadCount,
    notificationsReadCount,
    isMetamaskNotificationFeatureSeen,
    onClose,
    navigate,
    dispatch,
    trackEvent,
    metaMetricsId,
    isMetaMetricsEnabled,
    isMarketingEnabled,
    browserSupportsSidePanel,
    isSidePanelEnabled,
    supportText,
    handleNotificationsClick,
    handleSupportMenuClick,
    toggleDefaultView,
  ]);
}
