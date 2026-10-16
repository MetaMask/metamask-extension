import { useCallback } from 'react';
import { useSelector } from 'react-redux';
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
  state: PreferencesMetaMaskState,
): boolean | null => {
  const { shouldShowSupportConsent, supportDataSharingPreference } =
    getPreferences(state);
  if (shouldShowSupportConsent !== false) {
    return null;
  }
  return supportDataSharingPreference ?? null;
};

/**
 * Opens the support site with or without the user's data, tracking the click.
 * Shared by the consent modal and by entry points that apply a saved choice.
 */
export const useSupportLinks = () => {
  const version = process.env.METAMASK_VERSION as string;
  const { trackEvent, createEventBuilder } = useAnalytics();
  const segmentContext = useSegmentContext();
  const { customerId: shieldCustomerId } = useUserSubscriptions();

  const trackAndOpen = useCallback(
    (url: string) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.SupportLinkClicked)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            url,
            [MetaMetricsContextProp.PageTitle]: segmentContext.page?.title,
          })
          .build(),
      );
      openWindow(url);
    },
    [trackEvent, createEventBuilder, segmentContext.page?.title],
  );

  const openSupportLink = useCallback(
    (customerServiceToken?: string) => {
      const params: SupportLinkUserData = {
        version,
        customerServiceToken,
        shieldCustomerId,
      };
      trackAndOpen(
        buildSupportLinkWithUserData(SUPPORT_LINK as string, params),
      );
    },
    [version, shieldCustomerId, trackAndOpen],
  );

  const openSupportLinkWithoutUserData = useCallback(() => {
    trackAndOpen(SUPPORT_LINK as string);
  }, [trackAndOpen]);

  return { openSupportLink, openSupportLinkWithoutUserData };
};

/**
 * Returns a click handler for "contact support" entry points: applies the
 * saved data sharing choice directly when there is one, otherwise shows the
 * consent modal. Runs from the click so the support tab opens from a user
 * gesture, like the modal's own buttons.
 *
 * @param showConsentModal - Opens the entry point's consent modal.
 * @returns The click handler.
 */
export const useOpenSupport = (showConsentModal: () => void) => {
  const savedPreference = useSelector(getSavedSupportDataSharingPreference);
  const { openSupportLink, openSupportLinkWithoutUserData } = useSupportLinks();

  return useCallback(async () => {
    if (savedPreference === true) {
      openSupportLink(await getCustomerServiceToken());
      return;
    }
    if (savedPreference === false) {
      openSupportLinkWithoutUserData();
      return;
    }
    showConsentModal();
  }, [
    savedPreference,
    openSupportLink,
    openSupportLinkWithoutUserData,
    showConsentModal,
  ]);
};
