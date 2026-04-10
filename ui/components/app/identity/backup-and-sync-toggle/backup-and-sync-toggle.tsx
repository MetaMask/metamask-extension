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
import { showModal } from '../../../../store/actions';
import ToggleButton from '../../../ui/toggle-button';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import {
  getExternalServicesOnboardingToggleState,
  getUseExternalServices,
} from '../../../../selectors';
import { CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME } from '../../modals/identity';

export const backupAndSyncToggleTestIds = {
  container: 'backup-and-sync-container',
  toggleContainer: 'backup-and-sync-toggle-container',
  toggleButton: 'backup-and-sync-toggle-button',
};

export const BackupAndSyncToggle = () => {
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
  const isBackupAndSyncUpdateLoading = useSelector(
    selectIsBackupAndSyncUpdateLoading,
  );

  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

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
          old_value: isBackupAndSyncEnabled,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_value: newValue,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          was_notifications_on: isMetamaskNotificationsEnabled,
        },
      });
    },
    [trackEvent, isBackupAndSyncEnabled, isMetamaskNotificationsEnabled],
  );

  // Cascading side effects - disable backup & sync when basic functionality is disabled
  useEffect(() => {
    // Check both basic functionality states: production and onboarding
    const isBasicFunctionalityDisabled =
      isBasicFunctionalityEnabled === false ||
      isOnboardingBasicFunctionalityEnabled === false;

    if (isBasicFunctionalityDisabled && isBackupAndSyncEnabled) {
      (async () => {
        try {
          // Turn off main backup and sync
          await setIsBackupAndSyncFeatureEnabled(
            BACKUPANDSYNC_FEATURES.main,
            false,
          );
          // Also turn off all sub-features when basic functionality is disabled
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
    isBasicFunctionalityEnabled,
    isOnboardingBasicFunctionalityEnabled,
    isBackupAndSyncEnabled,
    setIsBackupAndSyncFeatureEnabled,
  ]);

  const handleBackupAndSyncToggleSetValue = async () => {
    if (isBackupAndSyncEnabled) {
      trackBackupAndSyncToggleEvent(false);
      // Turn off main backup and sync
      await setIsBackupAndSyncFeatureEnabled(
        BACKUPANDSYNC_FEATURES.main,
        false,
      );
      // Also turn off all sub-features when main toggle is disabled
      await setIsBackupAndSyncFeatureEnabled(
        BACKUPANDSYNC_FEATURES.accountSyncing,
        false,
      );
      await setIsBackupAndSyncFeatureEnabled(
        BACKUPANDSYNC_FEATURES.contactSyncing,
        false,
      );
    } else {
      trackBackupAndSyncToggleEvent(true);

      if (
        isBasicFunctionalityEnabled === false ||
        isOnboardingBasicFunctionalityEnabled === false
      ) {
        dispatch(
          showModal({
            name: CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
            enableBackupAndSync: async () => {
              // Turn on main backup and sync
              await setIsBackupAndSyncFeatureEnabled(
                BACKUPANDSYNC_FEATURES.main,
                true,
              );
              // Also turn on all sub-features for convenient 1-click restore
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
      } else {
        // Turn on main backup and sync
        await setIsBackupAndSyncFeatureEnabled(
          BACKUPANDSYNC_FEATURES.main,
          true,
        );
        // Also turn on all sub-features for convenient 1-click restore
        await setIsBackupAndSyncFeatureEnabled(
          BACKUPANDSYNC_FEATURES.accountSyncing,
          true,
        );
        await setIsBackupAndSyncFeatureEnabled(
          BACKUPANDSYNC_FEATURES.contactSyncing,
          true,
        );
      }
    }
  };

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

        {isBackupAndSyncUpdateLoading ? (
          <Box paddingLeft={5} paddingRight={5}>
            <Preloader size={36} />
          </Box>
        ) : (
          <div
            className="privacy-settings__setting__toggle"
            data-testid={backupAndSyncToggleTestIds.toggleContainer}
          >
            <ToggleButton
              value={isBackupAndSyncEnabled}
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
