import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useBackupAndSync } from '../../../../hooks/identity/useBackupAndSync';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import {
  selectIsBackupAndSyncEnabled,
  selectIsBackupAndSyncUpdateLoading,
} from '../../../../selectors/identity/backup-and-sync';
import { selectIsMetamaskNotificationsEnabled } from '../../../../selectors/metamask-notifications/metamask-notifications';
import { showModal, toggleExternalServices } from '../../../../store/actions';
import ToggleButton from '../../../ui/toggle-button';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import {
  getBackupAndSyncOnboardingToggleState,
  getExternalServicesOnboardingToggleState,
  getUseExternalServices,
} from '../../../../selectors';
import {
  onboardingToggleBackupAndSyncOff,
  onboardingToggleBackupAndSyncOn,
  onboardingToggleBasicFunctionalityOn,
} from '../../../../ducks/app/app';
import { CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME } from '../../modals/identity';

export const backupAndSyncToggleTestIds = {
  container: 'backup-and-sync-container',
  toggleContainer: 'backup-and-sync-toggle-container',
  toggleButton: 'backup-and-sync-toggle-button',
};

type BackupAndSyncToggleProps = {
  /**
   * When true, the toggle is rendered inside the onboarding flow and writes to
   * an "onboarding-only" intent flag instead of calling the
   * `UserStorageController`. This is required because enabling backup & sync
   * before onboarding completes triggers `auth.signIn()`, which hangs while the
   * keyring/snap is still being set up. The intent is committed to the
   * controller after onboarding completes (see `creation-successful.tsx`).
   */
  isOnboarding?: boolean;
};

export const BackupAndSyncToggle = ({
  isOnboarding = false,
}: BackupAndSyncToggleProps) => {
  const { trackEvent } = useContext(MetaMetricsContext);

  const t = useI18nContext();
  const dispatch = useDispatch();

  const { setIsBackupAndSyncFeatureEnabled, error } = useBackupAndSync();

  const isBasicFunctionalityEnabled: boolean = useSelector(
    getUseExternalServices,
  );
  const isOnboardingBasicFunctionalityEnabled = useSelector(
    getExternalServicesOnboardingToggleState,
  );

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isOnboardingBackupAndSyncEnabled = useSelector(
    getBackupAndSyncOnboardingToggleState,
  );
  const isBackupAndSyncUpdateLoading = useSelector(
    selectIsBackupAndSyncUpdateLoading,
  );

  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  // Use the appropriate flags for the current context. During onboarding, only
  // the onboarding intent flags are authoritative; production flags are applied
  // on completion in `creation-successful.tsx`.
  const displayedBackupAndSyncEnabled = isOnboarding
    ? isOnboardingBackupAndSyncEnabled
    : isBackupAndSyncEnabled;

  const trackBackupAndSyncToggleEvent = useCallback(
    (newValue: boolean) => {
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          settings_group: 'backup_and_sync',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          settings_type: 'main',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          old_value: displayedBackupAndSyncEnabled,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_value: newValue,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          was_notifications_on: isMetamaskNotificationsEnabled,
        },
      });
    },
    [trackEvent, displayedBackupAndSyncEnabled, isMetamaskNotificationsEnabled],
  );

  // Cascading side effects: keep backup & sync in sync with basic functionality.
  // Disabling does not call `signIn()` so it's safe in either context.
  useEffect(() => {
    if (isOnboarding) {
      if (
        isOnboardingBasicFunctionalityEnabled === false &&
        isOnboardingBackupAndSyncEnabled === true
      ) {
        dispatch(onboardingToggleBackupAndSyncOff());
      }
      return;
    }

    if (isBasicFunctionalityEnabled === false && isBackupAndSyncEnabled) {
      (async () => {
        try {
          await setIsBackupAndSyncFeatureEnabled(
            BACKUPANDSYNC_FEATURES.main,
            false,
          );
          await setIsBackupAndSyncFeatureEnabled(
            BACKUPANDSYNC_FEATURES.accountSyncing,
            false,
          );
          await setIsBackupAndSyncFeatureEnabled(
            BACKUPANDSYNC_FEATURES.contactSyncing,
            false,
          );
        } catch (err) {
          console.error('Failed to disable backup and sync features:', err);
        }
      })();
    }
  }, [
    isOnboarding,
    isBasicFunctionalityEnabled,
    isOnboardingBasicFunctionalityEnabled,
    isBackupAndSyncEnabled,
    isOnboardingBackupAndSyncEnabled,
    setIsBackupAndSyncFeatureEnabled,
    dispatch,
  ]);

  const handleBackupAndSyncToggleSetValue = async () => {
    // Onboarding mode: write to the intent flag only. The real controller call
    // happens in `creation-successful.tsx` once the wallet is ready and
    // `auth.signIn()` can succeed.
    if (isOnboarding) {
      if (displayedBackupAndSyncEnabled) {
        trackBackupAndSyncToggleEvent(false);
        dispatch(onboardingToggleBackupAndSyncOff());
        return;
      }

      trackBackupAndSyncToggleEvent(true);

      if (isOnboardingBasicFunctionalityEnabled === false) {
        dispatch(
          showModal({
            name: CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
            enableBackupAndSync: async () => {
              dispatch(onboardingToggleBasicFunctionalityOn());
              dispatch(onboardingToggleBackupAndSyncOn());
            },
          }),
        );
        return;
      }

      dispatch(onboardingToggleBackupAndSyncOn());
      return;
    }

    if (isBackupAndSyncEnabled) {
      trackBackupAndSyncToggleEvent(false);
      await setIsBackupAndSyncFeatureEnabled(
        BACKUPANDSYNC_FEATURES.main,
        false,
      );
      await setIsBackupAndSyncFeatureEnabled(
        BACKUPANDSYNC_FEATURES.accountSyncing,
        false,
      );
      await setIsBackupAndSyncFeatureEnabled(
        BACKUPANDSYNC_FEATURES.contactSyncing,
        false,
      );
      return;
    }

    trackBackupAndSyncToggleEvent(true);

    if (isBasicFunctionalityEnabled === false) {
      dispatch(
        showModal({
          name: CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
          enableBackupAndSync: async () => {
            await dispatch(toggleExternalServices(true));
            await setIsBackupAndSyncFeatureEnabled(
              BACKUPANDSYNC_FEATURES.main,
              true,
            );
            await setIsBackupAndSyncFeatureEnabled(
              BACKUPANDSYNC_FEATURES.accountSyncing,
              true,
            );
            await setIsBackupAndSyncFeatureEnabled(
              BACKUPANDSYNC_FEATURES.contactSyncing,
              true,
            );
          },
        }),
      );
      return;
    }

    await setIsBackupAndSyncFeatureEnabled(BACKUPANDSYNC_FEATURES.main, true);
    await setIsBackupAndSyncFeatureEnabled(
      BACKUPANDSYNC_FEATURES.accountSyncing,
      true,
    );
    await setIsBackupAndSyncFeatureEnabled(
      BACKUPANDSYNC_FEATURES.contactSyncing,
      true,
    );
  };

  // Onboarding flips the intent flag synchronously so the controller's loading
  // flag is irrelevant there.
  const showLoadingIndicator = !isOnboarding && isBackupAndSyncUpdateLoading;

  return (
    <Box
      marginTop={4}
      marginBottom={4}
      paddingLeft={4}
      paddingRight={4}
      className="privacy-settings__setting__wrapper"
      id="backup-and-sync-toggle"
      data-testid={backupAndSyncToggleTestIds.container}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Start}
        marginBottom={1}
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('backupAndSyncEnable')}
        </Text>

        {showLoadingIndicator ? (
          <Box paddingLeft={5} paddingRight={5}>
            <Preloader size={36} />
          </Box>
        ) : (
          <div
            className="privacy-settings__setting__toggle"
            data-testid={backupAndSyncToggleTestIds.toggleContainer}
          >
            <ToggleButton
              value={displayedBackupAndSyncEnabled}
              onToggle={handleBackupAndSyncToggleSetValue}
              dataTestId={backupAndSyncToggleTestIds.toggleButton}
            />
          </div>
        )}
      </Box>
      <div className="privacy-settings__setting__description">
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          asChild
        >
          <div>
            {t('backupAndSyncEnableDescription', [
              <Text
                asChild
                variant={TextVariant.BodyMd}
                key="privacy-link"
                color={TextColor.InfoDefault}
              >
                <a
                  href={ZENDESK_URLS.PROFILE_PRIVACY}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('backupAndSyncPrivacyLink')}
                </a>
              </Text>,
            ])}
          </div>
        </Text>

        {error && (
          <Box marginTop={4} paddingBottom={4}>
            <Text color={TextColor.ErrorDefault} variant={TextVariant.BodySm}>
              {t('notificationsSettingsBoxError')}
            </Text>
          </Box>
        )}
      </div>
    </Box>
  );
};
