import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { MarketingPreference } from '@metamask/authenticated-user-storage';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import { setDataCollectionForMarketing } from '../../store/actions';
import { useDispatch } from '../../store/hooks';
import { useI18nContext } from '../useI18nContext';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import { useNotificationPreferences } from './useNotificationPreferences';

/**
 * Shared flow for turning marketing consent off while the Updates and rewards
 * channels (stored in AUS) may still be on. When channels are on, the caller
 * renders a confirmation sheet; confirming disables the channels, saves
 * consent to AUS, then runs `onOptedOut`.
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
  const { ensurePreferences, refetchPreferences, updatePreferencesSection } =
    useNotificationPreferences();
  const isSignedIn = useSelector(selectIsSignedIn);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOptOut = useCallback(async (): Promise<boolean> => {
    // The channels live in AUS, so the warning only applies while signed in. A
    // signed-out user has no AUS preferences: the read always fails and the
    // sheet confirm could never complete.
    if (!isSignedIn) {
      return false;
    }
    let needsWarning = true;
    try {
      const marketing = (await ensurePreferences())?.marketing;
      needsWarning = Boolean(
        marketing?.pushNotificationsEnabled ||
        marketing?.inAppNotificationsEnabled,
      );
    } catch {
      // Unknown channel state; keep the warning.
    }
    if (needsWarning) {
      setError(null);
      setIsOpen(true);
    }
    return needsWarning;
  }, [ensurePreferences, isSignedIn]);

  const rollBack = useCallback(
    async (previousMarketing?: MarketingPreference) => {
      try {
        // Restore consent before channels so channels are never on without it.
        await dispatch(setDataCollectionForMarketing(true));
        if (previousMarketing) {
          await updatePreferencesSection('marketing', previousMarketing);
          listNotifications();
        }
      } catch (rollbackError) {
        console.error('Failed to roll back marketing opt-out:', rollbackError);
      }
    },
    [dispatch, listNotifications, updatePreferencesSection],
  );

  const onConfirm = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Decide from a fresh read only; the cache may be stale.
      const { data } = await refetchPreferences({ throwOnError: true });
      const marketing = data?.marketing;
      const channelsEnabled = Boolean(
        marketing?.pushNotificationsEnabled ||
        marketing?.inAppNotificationsEnabled,
      );
      if (marketing && channelsEnabled) {
        await updatePreferencesSection('marketing', {
          ...marketing,
          pushNotificationsEnabled: false,
          inAppNotificationsEnabled: false,
        });
        listNotifications();
      }
      try {
        await dispatch(
          setDataCollectionForMarketing(false, { waitForAus: true }),
        );
      } catch (consentError) {
        await rollBack(channelsEnabled ? marketing : undefined);
        throw consentError;
      }
      await onOptedOut();
      setIsOpen(false);
    } catch (turnOffError) {
      console.error('Failed to turn off marketing consent:', turnOffError);
      setError(t('notificationsSettingsBoxError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    dispatch,
    listNotifications,
    onOptedOut,
    refetchPreferences,
    rollBack,
    t,
    updatePreferencesSection,
  ]);

  const onClose = useCallback(() => setIsOpen(false), []);

  return {
    requestOptOut,
    sheetProps: { isOpen, isSubmitting, error, onClose, onConfirm },
  };
}
