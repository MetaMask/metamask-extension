import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  buildSupportLinkWithUserData,
  type SupportLinkUserData,
} from '../../../../../shared/lib/build-support-link';
import {
  getPreferences,
  type PreferencesMetaMaskState,
} from '../../../../../shared/lib/selectors/preferences';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { openWindow } from '../../../../helpers/utils/window';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useSegmentContext } from '../../../../hooks/useSegmentContext';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import { getCustomerServiceToken } from '../../../../store/actions';

/**
 * Returns the support data sharing choice the user saved with "Save my
 * preference", or `null` when the consent modal should be shown (no choice
 * saved, or "Remember my support preference" turned off in Settings).
 *
 * @param state - The Redux state.
 * @returns `true` (share), `false` (don't share) or `null` (ask).
 */
export const getSavedSupportDataSharingPreference = (
  state: PreferencesMetaMaskState | undefined,
): boolean | null => {
  if (!state) {
    return null;
  }
  const { shouldShowSupportConsent, supportDataSharingPreference } =
    getPreferences(state);
  if (shouldShowSupportConsent !== false) {
    return null;
  }
  return supportDataSharingPreference ?? null;
};

/**
 * Opens a URL in a new tab through the extension API. Unlike `window.open`, it
 * does not depend on the user gesture, which a token fetch can outlast, and it
 * still works when the popup closes as the tab takes focus. Falls back to
 * `window.open` if the extension API fails.
 *
 * @param url - The URL to open.
 */
const openUrlInNewTab = async (url: string) => {
  try {
    await global.platform.openTab({ url });
  } catch (error) {
    log.warn(
      '[SupportConsent] Failed to open support tab, falling back to window.open',
      error,
    );
    openWindow(url);
  }
};

/**
 * Opens the support site with or without the user's data, tracking the click.
 * Shared by the consent modal and by entry points that apply a saved choice.
 */
export const useSupportLinks = (
  supportLink: string = SUPPORT_LINK as string,
) => {
  const version = process.env.METAMASK_VERSION as string;
  const { trackEvent, createEventBuilder } = useAnalytics();
  const segmentContext = useSegmentContext();
  const { customerId: shieldCustomerId } = useUserSubscriptions();

  const trackSupportLinkClicked = useCallback(
    (url: string) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.SupportLinkClicked)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            url,
            [MetaMetricsContextProp.PageTitle]: segmentContext.page?.title,
          })
          .build(),
      ).catch(() => undefined);
    },
    [trackEvent, createEventBuilder, segmentContext.page?.title],
  );

  const openSupportLink = useCallback(
    async (customerServiceToken?: string) => {
      const params: SupportLinkUserData = {
        version,
        customerServiceToken,
        ...(customerServiceToken ? { shieldCustomerId } : {}),
      };
      const url = buildSupportLinkWithUserData(supportLink, params);
      trackSupportLinkClicked(supportLink);
      await openUrlInNewTab(url);
    },
    [version, shieldCustomerId, trackSupportLinkClicked, supportLink],
  );

  const openSupportLinkWithoutUserData = useCallback(() => {
    trackSupportLinkClicked(supportLink);
    openWindow(supportLink);
  }, [trackSupportLinkClicked, supportLink]);

  const getCustomerServiceTokenForSupport = useCallback(
    () => getCustomerServiceToken().catch(() => undefined),
    [],
  );

  return {
    getCustomerServiceTokenForSupport,
    openSupportLink,
    openSupportLinkWithoutUserData,
  };
};

/**
 * Returns a click handler for "contact support" entry points: applies the
 * saved data sharing choice directly when there is one, otherwise shows the
 * consent modal. The share path waits for the customer service token, so
 * repeated clicks while it is pending are ignored to avoid opening the tab twice.
 *
 * @param showConsentModal - Opens the entry point's consent modal.
 * @returns The click handler.
 */
export const useOpenSupport = (showConsentModal: () => void) => {
  const savedPreference = useSelector(getSavedSupportDataSharingPreference);
  const {
    getCustomerServiceTokenForSupport,
    openSupportLink,
    openSupportLinkWithoutUserData,
  } = useSupportLinks();
  const isOpeningRef = useRef(false);

  return useCallback(async () => {
    if (savedPreference === true) {
      if (isOpeningRef.current) {
        return;
      }
      isOpeningRef.current = true;
      try {
        await openSupportLink(await getCustomerServiceTokenForSupport());
      } finally {
        isOpeningRef.current = false;
      }
      return;
    }
    if (savedPreference === false) {
      openSupportLinkWithoutUserData();
      return;
    }
    showConsentModal();
  }, [
    savedPreference,
    getCustomerServiceTokenForSupport,
    openSupportLink,
    openSupportLinkWithoutUserData,
    showConsentModal,
  ]);
};
