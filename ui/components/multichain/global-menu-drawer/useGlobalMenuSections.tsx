import React, { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useSegmentContext } from '../../../hooks/useSegmentContext';
import {
  useReadNotificationsCounter,
  useUnreadNotificationsCounter,
} from '../../../hooks/metamask-notifications/useCounter';
import { NotificationsTagCounter } from '../notifications-tag-counter';
import { NewFeatureTag } from '../../../pages/notifications/NewFeatureTag';
import {
  SETTINGS_ROUTE,
  NOTIFICATIONS_ROUTE,
  SNAPS_ROUTE,
  PERMISSIONS,
  GATOR_PERMISSIONS,
  CONTACTS_ROUTE,
  NETWORKS_ROUTE,
} from '../../../helpers/constants/routes';
import {
  lockMetamask,
  setShowSupportDataConsentModal,
  toggleDefaultView,
} from '../../../store/actions';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../shared/lib/environment';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useSidePanelEnabled } from '../../../hooks/useSidePanelEnabled';
import { useBrowserSupportsSidePanel } from '../../../hooks/useBrowserSupportsSidePanel';
import { selectIsMetamaskNotificationsFeatureSeen } from '../../../selectors/metamask-notifications/metamask-notifications';
import { Tag } from '../../component-library';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  PLATFORM_FIREFOX,
} from '../../../../shared/constants/app';
import { getBrowserName } from '../../../../shared/lib/browser-runtime.utils';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import {
  getUnapprovedTransactions,
  getAnySnapUpdateAvailable,
  getUseExternalServices,
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
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
import { isBeta, isFlask } from '../../../../shared/lib/build-types';

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
  const { trackEvent, createEventBuilder } = useAnalytics();
  const segmentContext = useSegmentContext();
  const { captureCommonExistingShieldSubscriptionEvents } =
    useSubscriptionMetrics();
  const location = useLocation();
  const navigate = useNavigate();

  const basicFunctionality = useSelector(getUseExternalServices);
  const { notificationsUnreadCount } = useUnreadNotificationsCounter();
  const { notificationsReadCount } = useReadNotificationsCounter();
  const isMetamaskNotificationFeatureSeen = useSelector(
    selectIsMetamaskNotificationsFeatureSeen,
  );
  const unapprovedTransactions = useSelector(getUnapprovedTransactions);
  const hasUnapprovedTransactions =
    Object.keys(unapprovedTransactions).length > 0;
  const snapsUpdatesAvailable = useSelector(getAnySnapUpdateAvailable);

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

  const analyticsId = useSelector(getAnalyticsId);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isOptedIn = useSelector(getOptedIn);
  const isMetaMetricsEnabled = completedMetaMetricsOnboarding && isOptedIn;
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const supportText =
    isBeta() || isFlask() ? t('needHelpSubmitTicket') : t('support');
  const supportLink = SUPPORT_LINK || '';

  const handleNotificationsClick = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NotificationsMenuOpened)
        .addCategory(MetaMetricsEventCategory.NotificationInteraction)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          unread_count: notificationsUnreadCount,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          read_count: notificationsReadCount,
        })
        .build(),
    );
    navigate(
      `${NOTIFICATIONS_ROUTE}?from=${encodeURIComponent(location.pathname)}`,
      { state: { globalMenuTransition: 'forward' } },
    );
  }, [
    trackEvent,
    createEventBuilder,
    navigate,
    notificationsUnreadCount,
    notificationsReadCount,
    location.pathname,
  ]);

  const handleSupportMenuClick = useCallback(() => {
    dispatch(setShowSupportDataConsentModal(true));
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SupportLinkClicked)
        .addCategory(MetaMetricsEventCategory.Home)
        .addProperties({
          url: supportLink,
          location: segmentContext.page?.title,
        })
        .build(),
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
    createEventBuilder,
    segmentContext.page?.title,
    supportLink,
    showPriorityTag,
    subscriptions,
    captureCommonExistingShieldSubscriptionEvents,
    onClose,
  ]);

  return useMemo(() => {
    const section1: GlobalMenuSection = {
      id: 'global-menu-section-1',
      items: [],
    };

    if (basicFunctionality) {
      section1.items.push({
        id: 'notifications-menu-item',
        iconName: IconName.Notification,
        showChevron: true,
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
      hideDividerAbove: true, // No divider between notifications and this section
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
          analyticsId,
          isMetaMetricsEnabled === true,
          isMarketingEnabled === true,
        );
        global.platform.openTab({ url });
        trackEvent(
          createEventBuilder(MetaMetricsEventName.PortfolioLinkClicked)
            .addCategory(MetaMetricsEventCategory.Navigation)
            .addProperties({ location: METRICS_LOCATION, text: 'Portfolio' })
            .build(),
        );
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
          trackEvent(
            createEventBuilder(MetaMetricsEventName.AppWindowExpanded)
              .addCategory(MetaMetricsEventCategory.Navigation)
              .addProperties({ location: METRICS_LOCATION })
              .build(),
          );
          onClose();
        },
      });
    }

    const shouldRenderSidePanelToggle =
      getBrowserName() !== PLATFORM_FIREFOX &&
      browserSupportsSidePanel !== false &&
      isSidePanelEnabled &&
      (isPopup || isSidepanel);

    if (shouldRenderSidePanelToggle) {
      if (browserSupportsSidePanel === null) {
        section2.items.push({
          id: 'global-menu-toggle-view-placeholder',
          iconName: isSidepanel ? IconName.PopUp : IconName.SidePanel,
          label: isSidepanel ? t('switchToPopup') : t('switchToSidePanel'),
          onClick: () => undefined,
          disabled: true,
          className: 'invisible pointer-events-none',
        });
      } else {
        section2.items.push({
          id: 'global-menu-toggle-view',
          iconName: isSidepanel ? IconName.PopUp : IconName.SidePanel,
          label: isSidepanel ? t('switchToPopup') : t('switchToSidePanel'),
          onClick: async () => {
            await dispatch(toggleDefaultView());
            trackEvent(
              createEventBuilder(MetaMetricsEventName.ViewportSwitched)
                .addCategory(MetaMetricsEventCategory.Navigation)
                .addProperties({
                  location: METRICS_LOCATION,
                  to: isSidepanel
                    ? ENVIRONMENT_TYPE_POPUP
                    : ENVIRONMENT_TYPE_SIDEPANEL,
                })
                .build(),
            );
            onClose();
          },
        });
      }
    }

    const section2Manage: GlobalMenuSection = {
      id: 'global-menu-section-manage',
      title: t('manage'),
      items: [
        {
          id: 'global-menu-contacts',
          iconName: IconName.Book,
          label: t('contacts'),
          to: `${CONTACTS_ROUTE}?from=${encodeURIComponent(location.pathname)}`,
        },
        {
          id: 'global-menu-connected-sites',
          iconName: IconName.SecurityTick,
          label: t('allPermissions'),
          to: isGatorPermissionsRevocationFeatureEnabled()
            ? `${GATOR_PERMISSIONS}?from=${encodeURIComponent(location.pathname)}`
            : `${PERMISSIONS}?from=${encodeURIComponent(location.pathname)}`,
          onClick: () => {
            trackEvent(
              createEventBuilder(MetaMetricsEventName.NavPermissionsOpened)
                .addCategory(MetaMetricsEventCategory.Navigation)
                .addProperties({ location: METRICS_LOCATION })
                .build(),
            );
          },
          disabled: hasUnapprovedTransactions,
        },
        {
          id: 'global-menu-networks',
          iconName: IconName.Hierarchy,
          label: t('networks'),
          to: `${NETWORKS_ROUTE}?drawerOpen=true`,
        },
        {
          id: 'global-menu-snaps',
          iconName: IconName.Snaps,
          label: t('snaps'),
          to: `${SNAPS_ROUTE}?from=${encodeURIComponent(location.pathname)}`,
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
          to: `${SETTINGS_ROUTE}?drawerOpen=true`,
          onClick: () => {
            trackEvent(
              createEventBuilder(MetaMetricsEventName.NavSettingsOpened)
                .addCategory(MetaMetricsEventCategory.Navigation)
                .addProperties({ location: METRICS_LOCATION })
                .build(),
            );
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
          label: t('lock'),
          onClick: async () => {
            trackEvent(
              createEventBuilder(MetaMetricsEventName.AppLocked)
                .addCategory(MetaMetricsEventCategory.Navigation)
                .addProperties({ location: METRICS_LOCATION })
                .build(),
            );
            onClose();

            await dispatch(lockMetamask(t('lockMetaMaskLoadingMessage')));
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
    location.pathname,
    basicFunctionality,
    isPopup,
    isSidepanel,
    hasUnapprovedTransactions,
    snapsUpdatesAvailable,
    showPriorityTag,
    notificationsUnreadCount,
    isMetamaskNotificationFeatureSeen,
    onClose,
    dispatch,
    trackEvent,
    createEventBuilder,
    analyticsId,
    isMetaMetricsEnabled,
    isMarketingEnabled,
    browserSupportsSidePanel,
    isSidePanelEnabled,
    supportText,
    handleNotificationsClick,
    handleSupportMenuClick,
  ]);
}
