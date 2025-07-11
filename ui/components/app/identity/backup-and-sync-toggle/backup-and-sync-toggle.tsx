import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useBackupAndSync } from '../../../../hooks/identity/useBackupAndSync';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  selectIsBackupAndSyncEnabled,
  selectIsBackupAndSyncUpdateLoading,
} from '../../../../selectors/identity/backup-and-sync';
import { selectIsMetamaskNotificationsEnabled } from '../../../../selectors/metamask-notifications/metamask-notifications';
import { showModal } from '../../../../store/actions';
import { Box, Text } from '../../../component-library';
import ToggleButton from '../../../ui/toggle-button';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
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
  const trackEvent = useContext(MetaMetricsContext);

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

  // Cascading side effects
  useEffect(() => {
    if (!isBasicFunctionalityEnabled && isBackupAndSyncEnabled) {
      setIsBackupAndSyncFeatureEnabled(BACKUPANDSYNC_FEATURES.main, false);
    }
  }, [
    isBasicFunctionalityEnabled,
    isBackupAndSyncEnabled,
    setIsBackupAndSyncFeatureEnabled,
  ]);

  const handleBackupAndSyncToggleSetValue = async () => {
    if (isBackupAndSyncEnabled) {
      trackBackupAndSyncToggleEvent(false);
      await setIsBackupAndSyncFeatureEnabled(
        BACKUPANDSYNC_FEATURES.main,
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
              await setIsBackupAndSyncFeatureEnabled(
                BACKUPANDSYNC_FEATURES.main,
                true,
              );
            },
          }),
        );
      } else {
        await setIsBackupAndSyncFeatureEnabled(
          BACKUPANDSYNC_FEATURES.main,
          true,
        );
      }
    }
  };

  return (
    <Box
      marginTop={4}
      marginBottom={4}
      className="privacy-settings__setting__wrapper"
      id="backup-and-sync-toggle"
      data-testid={backupAndSyncToggleTestIds.container}
    >
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.flexStart}
        marginBottom={4}
      >
        <Text variant={TextVariant.bodyMdMedium}>
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
              offLabel={t('off')}
              onLabel={t('on')}
              dataTestId={backupAndSyncToggleTestIds.toggleButton}
            />
          </div>
        )}
      </Box>
      <div className="privacy-settings__setting__description">
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          as="div"
        >
          {t('backupAndSyncEnableDescription', [
            <Text
              as="a"
              variant={TextVariant.bodySm}
              href="https://support.metamask.io/privacy-and-security/profile-privacy"
              target="_blank"
              rel="noopener noreferrer"
              key="privacy-link"
              color={TextColor.infoDefault}
            >
              {t('backupAndSyncPrivacyLink')}
            </Text>,
          ])}
        </Text>

        {error && (
          <Box marginTop={4} paddingBottom={4}>
            <Text
              as="p"
              color={TextColor.errorDefault}
              variant={TextVariant.bodySm}
            >
              {t('notificationsSettingsBoxError')}
            </Text>
          </Box>
        )}
      </div>
    </Box>
  );
};
