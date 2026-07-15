import { useCallback, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import browser from 'webextension-polyfill';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import type { BrowserWithSidePanel } from '../../../../shared/types';
import { getIsBasicFunctionalityConsolidationEnabledInBuild } from '../../../../shared/lib/environment';
import {
  getDeferredDeepLinkRoute,
  buildInterstitialRoute,
} from '../../../../shared/lib/deep-links/utils';
import { createEvent } from '../../../../shared/lib/deep-links/metrics';
import {
  DeferredDeepLink,
  DeferredDeepLinkRoute,
  DeferredDeepLinkRouteType,
} from '../../../../shared/lib/deep-links/types';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useSidePanelEnabled } from '../../../hooks/useSidePanelEnabled';
import {
  getBackupAndSyncOnboardingToggleState,
  getExternalServicesOnboardingToggleState,
  getFirstTimeFlowType,
  getOptedIn,
  getDeferredDeepLink,
  getAccountTypeForOnboardingMetrics,
} from '../../../selectors';
import {
  getCompletedOnboarding,
  getHasSeenOnboardingCompletionPage,
} from '../../../ducks/metamask/metamask';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import {
  toggleExternalServices,
  toggleBasicFunctionality,
  setPreference,
  setCompletedOnboarding,
  setCompletedOnboardingWithSidepanel,
  setUseSidePanelAsDefault,
  removeDeferredDeepLink,
  setIsBackupAndSyncFeatureEnabled,
  setHasSeenOnboardingCompletionPage,
} from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';

/**
 * Shared onboarding-completion actions for the completion route.
 * Used by `CreationSuccessful` (interactive first visit) and `OnboardingFlow`
 * (auto-complete when the user returns without tapping Done).
 */
export function useOnboardingCompletion() {
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const isSidePanelEnabled = useSidePanelEnabled();

  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );
  const backupAndSyncOnboardingToggleState = useSelector(
    getBackupAndSyncOnboardingToggleState,
  );
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isOnboardingCompleted = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const hasSeenOnboardingCompletionPage = useSelector(
    getHasSeenOnboardingCompletionPage,
  );
  const isOptedIn = useSelector(getOptedIn);
  const accountTypeForMetrics = useSelector(getAccountTypeForOnboardingMetrics);
  const deferredDeepLink = useSelector(getDeferredDeepLink);
  const isBasicFunctionalityToggleEnabled =
    getIsBasicFunctionalityConsolidationEnabledInBuild();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const isFinishingOnboardingRef = useRef(false);

  const handleOnDoneNavigation = useCallback(
    async (
      deferredDeepLinkResult: DeferredDeepLinkRoute | null,
      deferredDeepLinkToUse: DeferredDeepLink | null,
      completedWithSidePanelFlow: boolean,
    ) => {
      if (deferredDeepLinkToUse) {
        dispatch(removeDeferredDeepLink());
      }

      if (deferredDeepLinkResult && deferredDeepLinkToUse?.referringLink) {
        await trackEvent(
          createEvent({
            signature: deferredDeepLinkResult.signature,
            url: new URL(deferredDeepLinkToUse.referringLink),
          }),
        );
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
          navigate(
            buildInterstitialRoute(deferredDeepLinkResult.urlPathAndQuery),
          );
        }
      } else if (!completedWithSidePanelFlow) {
        navigate(DEFAULT_ROUTE);
      }
    },
    [dispatch, navigate, trackAnalyticsEvent],
  );

  const completeOnboardingWithSidePanel = useCallback(
    async ({
      deferredDeepLinkResult,
      shouldOpenSidePanel,
      autoCompleteWithoutUserGesture,
    }: {
      deferredDeepLinkResult: DeferredDeepLinkRoute | null;
      shouldOpenSidePanel: boolean;
      autoCompleteWithoutUserGesture: boolean;
    }): Promise<boolean> => {
      try {
        const browserWithSidePanel = browser as BrowserWithSidePanel;
        if (!browserWithSidePanel?.sidePanel?.open) {
          return false;
        }

        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tabs || tabs.length === 0) {
          return false;
        }

        // `browser.sidePanel.open()` requires a user gesture. Auto-complete
        // runs from `useEffect`, so skip the call there. Navigate/Interstitial
        // deferred deep links also skip opening so the popup can route first.
        if (shouldOpenSidePanel && !autoCompleteWithoutUserGesture) {
          await browserWithSidePanel.sidePanel.open({
            windowId: tabs[0].windowId,
          });
          setIsSidePanelOpen(true);
        }

        // Prefer the side panel on the next toolbar click after onboarding.
        await dispatch(setUseSidePanelAsDefault(true));
        await dispatch(setCompletedOnboardingWithSidepanel());

        // Auto-complete passes `completedWithSidePanelFlow: false` so navigation
        // uses popup rules (home redirect, `_blank` external redirects) even
        // though the panel did not open in this popup context.
        await handleOnDoneNavigation(
          deferredDeepLinkResult,
          deferredDeepLink,
          !autoCompleteWithoutUserGesture,
        );

        return true;
      } catch (error) {
        // Unexpected `.open()` failure: fall through to popup completion below.
        console.error('Error opening side panel:', error);
        return false;
      }
    },
    [deferredDeepLink, dispatch, handleOnDoneNavigation],
  );

  const completeOnboardingNormally = useCallback(
    async (deferredDeepLinkResult: DeferredDeepLinkRoute | null) => {
      await dispatch(setCompletedOnboarding());

      await handleOnDoneNavigation(
        deferredDeepLinkResult,
        deferredDeepLink,
        false,
      );
    },
    [deferredDeepLink, dispatch, handleOnDoneNavigation],
  );

  /**
   * Runs the shared onboarding "Done" flow from the completion page.
   *
   * @param autoCompleteWithoutUserGesture - When true (unlock after seeing
   * wallet-ready without tapping Done), skips `sidePanel.open()` because
   * completion runs without a user gesture. Side panel is still enabled on the
   * next toolbar click, and navigation follows popup rules.
   */
  const completeOnboarding = useCallback(
    async (autoCompleteWithoutUserGesture: boolean = false) => {
      if (!isUnlocked) {
        return;
      }
      if (isFinishingOnboardingRef.current) {
        return;
      }
      isFinishingOnboardingRef.current = true;

      try {
        const deferredDeepLinkResult =
          await getDeferredDeepLinkRoute(deferredDeepLink);
        const shouldOpenSidePanel =
          deferredDeepLinkResult?.type !== DeferredDeepLinkRouteType.Navigate &&
          deferredDeepLinkResult?.type !==
            DeferredDeepLinkRouteType.Interstitial;

        if (!isOnboardingCompleted) {
          const isNewWallet =
            firstTimeFlowType === FirstTimeFlowType.create ||
            firstTimeFlowType === FirstTimeFlowType.socialCreate;

          trackEvent(
            createEventBuilder(MetaMetricsEventName.OnboardingCompleted)
              .addCategory(MetaMetricsEventCategory.Onboarding)
              .addProperties({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                wallet_setup_type: firstTimeFlowType,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                new_wallet: isNewWallet,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                is_basic_functionality_enabled:
                  externalServicesOnboardingToggleState,
              })
              .build(),
          );
        }

        if (isBasicFunctionalityToggleEnabled) {
          await dispatch(
            setPreference(
              'isBasicFunctionalityConsolidatedEnabled',
              true,
              false,
            ),
          );
        }

        await dispatch(
          isBasicFunctionalityToggleEnabled
            ? toggleBasicFunctionality(externalServicesOnboardingToggleState)
            : toggleExternalServices(externalServicesOnboardingToggleState),
        );

        if (!backupAndSyncOnboardingToggleState) {
          await dispatch(
            setIsBackupAndSyncFeatureEnabled(
              BACKUPANDSYNC_FEATURES.main,
              false,
            ),
          );
        }

        // NOTE: Metametrics Opt In/Out event tracking should be done after `toggleExternalServices` dispatch.
        // Since we will track the `Metrics Opt In/Out` event even when optedIn is false,
        // this is to ensure that the `Metrics Opt In/Out` event will not be tracked if basic functionality is disabled.
        if (!isOnboardingCompleted) {
          trackEvent(
            createEventBuilder(
              isOptedIn
                ? MetaMetricsEventName.MetricsOptIn
                : MetaMetricsEventName.MetricsOptOut,
            )
              .addCategory(MetaMetricsEventCategory.Onboarding)
              .addProperties({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                account_type: accountTypeForMetrics,
              })
              .build(),
          );
        }

        if (isSidePanelEnabled) {
          const completedWithSidePanel = await completeOnboardingWithSidePanel({
            deferredDeepLinkResult,
            shouldOpenSidePanel,
            autoCompleteWithoutUserGesture,
          });
          if (completedWithSidePanel) {
            return;
          }
        }

        await completeOnboardingNormally(deferredDeepLinkResult);
      } catch (error) {
        isFinishingOnboardingRef.current = false;
        throw error;
      }
    },
    [
      accountTypeForMetrics,
      backupAndSyncOnboardingToggleState,
      completeOnboardingNormally,
      completeOnboardingWithSidePanel,
      createEventBuilder,
      deferredDeepLink,
      dispatch,
      externalServicesOnboardingToggleState,
      firstTimeFlowType,
      isBasicFunctionalityToggleEnabled,
      isOnboardingCompleted,
      isOptedIn,
      isSidePanelEnabled,
      isUnlocked,
      trackEvent,
    ],
  );

  const markCompletionPageSeen = useCallback(() => {
    if (hasSeenOnboardingCompletionPage) {
      return;
    }
    dispatch(setHasSeenOnboardingCompletionPage(true));
  }, [dispatch, hasSeenOnboardingCompletionPage]);

  return {
    completeOnboarding,
    markCompletionPageSeen,
    isSidePanelOpen,
    setIsSidePanelOpen,
  };
}
