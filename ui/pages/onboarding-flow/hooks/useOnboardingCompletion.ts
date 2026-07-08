import { useCallback, useRef, useState } from 'react';
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
import {
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

type CompleteOnboardingFromCompletionPageOptions = {
  onSidePanelOpened?: () => void;
};

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
    (
      deferredDeepLinkResult: DeferredDeepLinkRoute | null,
      hasDeferredDeepLink: boolean,
      completedWithSidePanelFlow: boolean,
    ) => {
      if (hasDeferredDeepLink) {
        dispatch(removeDeferredDeepLink());
      }

      if (deferredDeepLinkResult) {
        if (
          deferredDeepLinkResult.type === DeferredDeepLinkRouteType.Redirect
        ) {
          if (completedWithSidePanelFlow) {
            window.location.assign(deferredDeepLinkResult.url);
          } else {
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
    [dispatch, navigate],
  );

  const completeOnboardingFromCompletionPage = useCallback(
    async (options?: CompleteOnboardingFromCompletionPageOptions) => {
      if (isFinishingOnboardingRef.current) {
        return;
      }
      isFinishingOnboardingRef.current = true;

      const deferredDeepLinkResult =
        await getDeferredDeepLinkRoute(deferredDeepLink);
      const shouldOpenSidePanel =
        deferredDeepLinkResult?.type !== DeferredDeepLinkRouteType.Navigate &&
        deferredDeepLinkResult?.type !== DeferredDeepLinkRouteType.Interstitial;

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
          setPreference('isBasicFunctionalityConsolidatedEnabled', true, false),
        );
      }

      await dispatch(
        isBasicFunctionalityToggleEnabled
          ? toggleBasicFunctionality(externalServicesOnboardingToggleState)
          : toggleExternalServices(externalServicesOnboardingToggleState),
      );

      if (!backupAndSyncOnboardingToggleState) {
        await dispatch(
          setIsBackupAndSyncFeatureEnabled(BACKUPANDSYNC_FEATURES.main, false),
        );
      }

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
        try {
          const browserWithSidePanel = browser as BrowserWithSidePanel;
          if (browserWithSidePanel?.sidePanel?.open) {
            const tabs = await browser.tabs.query({
              active: true,
              currentWindow: true,
            });
            if (tabs && tabs.length > 0) {
              if (shouldOpenSidePanel) {
                await browserWithSidePanel.sidePanel.open({
                  windowId: tabs[0].windowId,
                });
                setIsSidePanelOpen(true);
                options?.onSidePanelOpened?.();
              }
              await dispatch(setUseSidePanelAsDefault(true));
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
        }
      }

      await dispatch(setCompletedOnboarding());

      handleOnDoneNavigation(
        deferredDeepLinkResult,
        Boolean(deferredDeepLink),
        false,
      );
    },
    [
      accountTypeForMetrics,
      backupAndSyncOnboardingToggleState,
      createEventBuilder,
      deferredDeepLink,
      dispatch,
      externalServicesOnboardingToggleState,
      firstTimeFlowType,
      handleOnDoneNavigation,
      isBasicFunctionalityToggleEnabled,
      isOnboardingCompleted,
      isOptedIn,
      isSidePanelEnabled,
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
    completeOnboardingFromCompletionPage,
    markCompletionPageSeen,
    isSidePanelOpen,
    setIsSidePanelOpen,
  };
}
