import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { getDataCollectionForMarketing } from '../../selectors/metametrics';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import {
  saveMarketingConsent,
  setDataCollectionForMarketing,
} from '../../store/actions';
import { useDispatch } from '../../store/hooks';
import { useI18nContext } from '../useI18nContext';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import { useNotificationPreferences } from './useNotificationPreferences';

/**
 * Shared flow for turning marketing consent off while the Updates and rewards
 * channels (stored in AUS) may still be on. When channels are on, the caller
 * renders a confirmation sheet; confirming saves consent to AUS (which
 * turns the channels off), then runs `onOptedOut`.
 *
 * @param options - Hook options.
 * @param options.onOptedOut - Runs once consent is off and the sheet flow succeeded.
 * @returns `requestOptOut` resolves `true` when the sheet was opened (caller
 * must stop) or `false` when no confirmation is needed; `sheetProps` is for
 * `MarketingConsentSheet`.
 */
export function useMarketingOptOut({
  onOptedOut,
}: {
  onOptedOut: () => Promise<void> | void;
}) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { listNotifications } = useMetamaskNotificationsContext();
  const isSignedIn = useSelector(selectIsSignedIn);
  // The privacy tab renders while signed out (e.g. with basic functionality
  // off), where reading AUS would sign the user in.
  const { ensurePreferences, markMarketingChannelsOff, refetchPreferences } =
    useNotificationPreferences({ enabled: isSignedIn });
  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOptOut = useCallback(async (): Promise<boolean> => {
    // The channels live in AUS, so the warning only applies while signed in.
    // Reading AUS while signed out would sign the user in.
    if (!isSignedIn) {
      return false;
    }
    let needsWarning = false;
    try {
      const marketing = (await ensurePreferences())?.marketing;
      needsWarning = Boolean(
        marketing?.pushNotificationsEnabled ||
        marketing?.inAppNotificationsEnabled,
      );
    } catch {
      // Unknown channel state; the consent sync turns the channels off anyway.
    }
    if (needsWarning) {
      setError(null);
      setIsOpen(true);
    }
    return needsWarning;
  }, [ensurePreferences, isSignedIn]);

  const onConfirm = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      try {
        await dispatch(saveMarketingConsent(false));
      } catch (consentError) {
        // Only restore consent the user actually had, so a rollback never
        // opts them in.
        if (dataCollectionForMarketing === true) {
          await dispatch(setDataCollectionForMarketing(true));
        }
        throw consentError;
      }
      // The consent sync turned the channels off in AUS. Mirror that in the
      // cache first, so a failed refresh cannot leave a channel-on snapshot
      // that a later preferences write would send back to AUS.
      markMarketingChannelsOff();
      await refetchPreferences();
      listNotifications();
      await onOptedOut();
      setIsOpen(false);
    } catch (turnOffError) {
      console.error('Failed to turn off marketing consent:', turnOffError);
      setError(t('notificationsSettingsBoxError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    dataCollectionForMarketing,
    dispatch,
    listNotifications,
    markMarketingChannelsOff,
    onOptedOut,
    refetchPreferences,
    t,
  ]);

  const onClose = useCallback(() => setIsOpen(false), []);

  return {
    requestOptOut,
    sheetProps: { isOpen, isSubmitting, error, onClose, onConfirm },
  };
}
