import React, {
  useCallback,
  useMemo,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import browser from 'webextension-polyfill';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
  IconColor,
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  TextButton,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
  DEFAULT_ROUTE,
  SECURITY_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getExternalServicesOnboardingToggleState,
  getFirstTimeFlowType,
  getIsSocialLoginFlow,
  getSocialLoginType,
  getParticipateInMetaMetrics,
  getPreferences,
  getDeferredDeepLink,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../../shared/constants/metametrics';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  getCompletedOnboarding,
  getIsInitialized,
  getIsPrimarySeedPhraseBackedUp,
} from '../../../ducks/metamask/metamask';
import {
  toggleExternalServices,
  setCompletedOnboarding,
  setCompletedOnboardingWithSidepanel,
  setUseSidePanelAsDefault,
  removeDeferredDeepLink,
} from '../../../store/actions';
import { LottieAnimation } from '../../../components/component-library/lottie-animation';
import { useSidePanelEnabled } from '../../../hooks/useSidePanelEnabled';
import type { BrowserWithSidePanel } from '../../../../shared/types';
import {
  getDeferredDeepLinkRoute,
  buildInterstitialRoute,
} from '../../../../shared/lib/deep-links/utils';
import {
  DeferredDeepLink,
  DeferredDeepLinkRoute,
  DeferredDeepLinkRouteType,
} from '../../../../shared/lib/deep-links/types';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import WalletReadyAnimation from './wallet-ready-animation';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function CreationSuccessful() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { search } = useLocation();
  const isWalletReady = useSelector(getIsPrimarySeedPhraseBackedUp);
  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );
  const { trackEvent } = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const socialLoginType = useSelector(getSocialLoginType);
  const isSidePanelEnabled = useSidePanelEnabled();
  const preferences = useSelector(getPreferences);
  const isSidePanelSetAsDefault = preferences?.useSidePanelAsDefault ?? false;
  const isOnboardingCompleted = useSelector(getCompletedOnboarding);
  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  const deferredDeepLink: DeferredDeepLink | null =
    useSelector(getDeferredDeepLink);

  const isInitialized = useSelector(getIsInitialized);

  const learnMoreLink = ZENDESK_URLS.BASIC_SAFETY_TIPS;

  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');
  const isFromSettingsSRPBackup = isWalletReady && isFromReminder;

  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);

  // Guard: redirect if wallet is not properly set up.
  // Prevents users from skipping onboarding steps by navigating directly to the completion route.
  useEffect(() => {
    if (isFromReminder) {
      return;
    }
    if (!isInitialized) {
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
  }, [isInitialized, isFromReminder, navigate]);

  useEffect(() => {
    const browserWithSidePanel = browser as BrowserWithSidePanel;
    const handleSidePanelClosed = (_args: unknown) => {
      setIsSidePanelOpen(false);
    };

    if (isSidePanelEnabled) {
      // NOTE: `sidePanel.onClosed` event is only available on later versions of Chrome
      // REFERENCE: {@link https://developer.chrome.com/docs/extensions/reference/api/sidePanel#event-onClosed}
      if (browserWithSidePanel?.sidePanel?.onClosed?.addListener) {
        browserWithSidePanel.sidePanel.onClosed.addListener(
          handleSidePanelClosed,
        );
      } else {
        console.warn('`sidePanel.onClosed` event is not available');
        // If the event is not available, we set the state to false to prevent the button from being disabled
        setIsSidePanelOpen(false);
      }
    }

    return () => {
      if (browserWithSidePanel?.sidePanel?.onClosed?.removeListener) {
        browserWithSidePanel.sidePanel.onClosed.removeListener(
          handleSidePanelClosed,
        );
      }
    };
  }, [isSidePanelEnabled]);

  const renderDetails1 = useMemo(() => {
    if (isFromReminder) {
      return t('walletReadyLoseSrpFromReminder');
    }

    return t('walletReadyLoseSrp');
  }, [isFromReminder, t]);

  const renderFox = useMemo(() => {
    return (
      <LottieAnimation
        path="images/animations/fox/celebrating.lottie.json"
        loop
        autoplay
      />
    );
  }, []);

  const renderSettingsActions = useMemo(() => {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        justifyContent={BoxJustifyContent.Start}
        className="creation-successful__settings-actions"
        gap={4}
      >
        <Button
          variant={ButtonVariant.Secondary}
          data-testid="manage-default-settings"
          className="rounded-lg w-full flex justify-between items-center"
          onClick={() =>
            navigate(`${ONBOARDING_PRIVACY_SETTINGS_ROUTE}?isFromReminder=true`)
          }
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
          >
            <Icon name={IconName.Setting} size={IconSize.Md} className="mr-3" />
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t('manageDefaultSettings')}
            </Text>
          </Box>
          <Icon
            name={IconName.ArrowRight}
            color={IconColor.IconAlternative}
            size={IconSize.Sm}
          />
        </Button>
      </Box>
    );
  }, [navigate, t]);

  const handleOnDoneNavigation = useCallback(
    (
      deferredDeepLinkResult: DeferredDeepLinkRoute,
      hasDeferredDeepLink: boolean,
      completedWithSidePanelFlow: boolean,
    ) => {
      // Clean up deferred deep link from the state (both: expired or active)
      if (hasDeferredDeepLink) {
        dispatch(removeDeferredDeepLink());
      }

      if (deferredDeepLinkResult) {
        if (
          deferredDeepLinkResult.type === DeferredDeepLinkRouteType.Redirect
        ) {
          if (completedWithSidePanelFlow) {
            // User completed onboarding with the side panel opened: navigate directly to the external URL
            window.location.assign(deferredDeepLinkResult.url);
          } else {
            // User completed onboarding without the side panel: opening the external URL in a new tab
            // prevents them from finishing their setup on an external website. Instead, we keep them
            // in the onboarding flow by navigating to the home page while opening the link separately.
            window.open(deferredDeepLinkResult.url, '_blank');
            navigate(DEFAULT_ROUTE);
          }
        } else if (
          deferredDeepLinkResult.type === DeferredDeepLinkRouteType.Navigate
        ) {
          navigate(deferredDeepLinkResult.route);
        } else if (
          deferredDeepLinkResult.type === DeferredDeepLinkRouteType.Interstitial
        ) {
          const interstitialRoute = buildInterstitialRoute(
            deferredDeepLinkResult.urlPathAndQuery,
          );
          navigate(interstitialRoute);
        }
      } else if (!completedWithSidePanelFlow) {
        navigate(DEFAULT_ROUTE);
      }
    },
    [dispatch, navigate],
  );

  const onDone = useCallback(async () => {
    if (isFromReminder) {
      navigate(isFromSettingsSecurity ? SECURITY_ROUTE : DEFAULT_ROUTE);
      return;
    }

    const deferredDeepLinkResult =
      await getDeferredDeepLinkRoute(deferredDeepLink);
    const shouldOpenSidePanel =
      deferredDeepLinkResult?.type !== DeferredDeepLinkRouteType.Navigate &&
      deferredDeepLinkResult?.type !== DeferredDeepLinkRouteType.Interstitial;

    // Track onboarding completion event
    if (!isOnboardingCompleted) {
      const isNewWallet =
        firstTimeFlowType === FirstTimeFlowType.create ||
        firstTimeFlowType === FirstTimeFlowType.socialCreate;

      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.OnboardingCompleted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          wallet_setup_type: firstTimeFlowType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_wallet: isNewWallet,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_basic_functionality_enabled: externalServicesOnboardingToggleState,
        },
      });
    }

    await dispatch(
      toggleExternalServices(externalServicesOnboardingToggleState),
    );

    // NOTE: Metametrics Opt In/Out event tracking should be done after `toggleExternalServices` dispatch.
    // Since we will track the `Metrics Opt In/Out` event even when participateInMetaMetrics is false,
    // this is to ensure that the `Metrics Opt In/Out` event will not be tracked if basic functionality is disabled.
    if (!isOnboardingCompleted) {
      // before onboarding completion, we track the MetricsOptIn/Out event

      const isNewWallet =
        firstTimeFlowType === FirstTimeFlowType.create ||
        firstTimeFlowType === FirstTimeFlowType.socialCreate;
      const baseAccountType = isNewWallet
        ? MetaMetricsEventAccountType.Default
        : MetaMetricsEventAccountType.Imported;
      const accountType =
        isSocialLoginFlow && socialLoginType
          ? `${baseAccountType}_${socialLoginType}`
          : baseAccountType;

      trackEvent(
        {
          category: MetaMetricsEventCategory.Onboarding,
          event: participateInMetaMetrics
            ? MetaMetricsEventName.MetricsOptIn
            : MetaMetricsEventName.MetricsOptOut,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: accountType,
          },
        },
        {
          isOptIn: !participateInMetaMetrics, // Force the event to be tracked even if participateInMetaMetrics is false
        },
      );
    }

    // Side Panel - only if feature flag is enabled
    if (isSidePanelEnabled) {
      // If useSidePanelAsDefault is already true, side panel is already set up
      // Just complete onboarding and redirect to home page
      if (isSidePanelSetAsDefault) {
        await dispatch(setCompletedOnboarding());
        navigate(DEFAULT_ROUTE);
        return;
      }

      try {
        // Type assertion needed as webextension-polyfill doesn't include sidePanel API types yet
        const browserWithSidePanel = browser as BrowserWithSidePanel;
        if (browserWithSidePanel?.sidePanel?.open) {
          const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tabs && tabs.length > 0) {
            // We deliberately skip the opening of the side panel
            // if a user is coming from a deep link
            if (shouldOpenSidePanel) {
              await browserWithSidePanel.sidePanel.open({
                windowId: tabs[0].windowId,
              });
              setIsSidePanelOpen(true);
            }
            await dispatch(setUseSidePanelAsDefault(true));
            // Use the sidepanel-specific action - no navigation needed, sidepanel is already open
            await dispatch(setCompletedOnboardingWithSidepanel());

            handleOnDoneNavigation(
              deferredDeepLinkResult,
              Boolean(deferredDeepLink),
              true,
            );

            return;
          }
        }
      } catch (error) {
        console.error('Error opening side panel:', error);
        // Fall through to regular onboarding
      }
    }
    // Fallback to regular onboarding completion
    await dispatch(setCompletedOnboarding());

    handleOnDoneNavigation(
      deferredDeepLinkResult,
      Boolean(deferredDeepLink),
      false,
    );
  }, [
    isFromReminder,
    deferredDeepLink,
    isOnboardingCompleted,
    dispatch,
    externalServicesOnboardingToggleState,
    isSidePanelEnabled,
    isSocialLoginFlow,
    socialLoginType,
    navigate,
    isFromSettingsSecurity,
    firstTimeFlowType,
    trackEvent,
    isSidePanelSetAsDefault,
    participateInMetaMetrics,
    handleOnDoneNavigation,
  ]);

  const renderDoneButton = () => {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
      >
        <Button
          data-testid="onboarding-complete-done"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          onClick={onDone}
          disabled={isSidePanelEnabled && isSidePanelOpen}
        >
          {isSidePanelEnabled ? t('openWallet') : t('done')}
        </Button>
      </Box>
    );
  };

  const handleLearnMoreClick = () => {
    global.platform.openTab({
      url: learnMoreLink,
    });
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={6}
      className="creation-successful h-full"
      data-testid="wallet-ready"
    >
      {isFromSettingsSRPBackup && (
        <Box>
          <Box
            flexDirection={BoxFlexDirection.Column}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Start}
          >
            <Text
              variant={TextVariant.HeadingLg}
              className="self-start mb-4 flex justify-center"
            >
              {t('yourWalletIsReadyFromReminder')}
            </Text>
            <Box className="w-full mb-6">
              <Box className="w-36 h-36 mx-auto">{renderFox}</Box>
            </Box>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="mb-6"
            >
              {renderDetails1}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="mb-6"
            >
              {t('walletReadyLearn', [
                <TextButton
                  key="walletReadyLearn"
                  className="hover:bg-transparent active:bg-transparent w-fit"
                  onClick={handleLearnMoreClick}
                >
                  {t('learnHow')}
                </TextButton>,
              ])}
            </Text>
          </Box>
          {renderSettingsActions}
        </Box>
      )}
      {!isFromSettingsSRPBackup && <WalletReadyAnimation />}
      {!isFromSettingsSRPBackup && (
        <Text className="title">{t('yourWalletIsReady')}</Text>
      )}
      {renderDoneButton()}
      {!isFromSettingsSRPBackup && (
        <Box>
          <TextButton
            onClick={() => navigate(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
            className="hover:bg-transparent active:bg-transparent w-full text-center"
            data-testid="manage-default-settings"
          >
            {t('manageDefaultSettings')}
          </TextButton>
        </Box>
      )}
    </Box>
  );
}
