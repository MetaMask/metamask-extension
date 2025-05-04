import React, { useContext, useEffect } from 'react';
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
import { Box, Text } from '../../../../components/component-library';
import ToggleButton from '../../../../components/ui/toggle-button';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Preloader from '../../../../components/ui/icon/preloader/preloader-icon.component';
import { getUseExternalServices } from '../../../../selectors';

const ProfileSyncToggle = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const dispatch = useDispatch();
  const basicFunctionality: boolean = useSelector(getUseExternalServices);
  const { error, setIsBackupAndSyncFeatureEnabled } = useBackupAndSync();

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const isBackupAndSyncUpdateLoading = useSelector(
    selectIsBackupAndSyncUpdateLoading,
  );
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  useEffect(() => {
    if (basicFunctionality === false) {
      setIsBackupAndSyncFeatureEnabled(BACKUPANDSYNC_FEATURES.main, false);
    }
  }, [basicFunctionality, setIsBackupAndSyncFeatureEnabled]);

  const handleProfileSyncToggleSetValue = async () => {
    if (isBackupAndSyncEnabled) {
      dispatch(
        showModal({
          name: 'CONFIRM_TURN_OFF_PROFILE_SYNCING',
          turnOffProfileSyncing: () => {
            trackEvent({
              category: MetaMetricsEventCategory.Settings,
              event: MetaMetricsEventName.SettingsUpdated,
              properties: {
                settings_group: 'security_privacy',
                settings_type: 'profile_syncing',
                old_value: true,
                new_value: false,
                was_notifications_on: isMetamaskNotificationsEnabled,
              },
            });
            setIsBackupAndSyncFeatureEnabled(
              BACKUPANDSYNC_FEATURES.main,
              false,
            );
          },
        }),
      );
    } else {
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          settings_group: 'security_privacy',
          settings_type: 'profile_syncing',
          old_value: false,
          new_value: true,
          was_notifications_on: isMetamaskNotificationsEnabled,
        },
      });
      await setIsBackupAndSyncFeatureEnabled(BACKUPANDSYNC_FEATURES.main, true);
    }
  };

  return (
    <Box>
      <Box
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
        data-testid="profileSyncToggle"
      >
        <div className="settings-page__content-item" id="profileSyncLabel">
          <span>{t('profileSync')}</span>
          <div
            className="settings-page__content-description"
            data-testid="profileSyncDescription"
          >
            {t('profileSyncDescription', [
              <a
                href="https://support.metamask.io/privacy-and-security/profile-privacy"
                key="link"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="privacyPolicyLink"
              >
                {t('profileSyncPrivacyLink')}
              </a>,
            ])}
          </div>
        </div>

        {isBackupAndSyncUpdateLoading && (
          <Box paddingLeft={5} paddingRight={5}>
            <Preloader size={36} />
          </Box>
        )}

        {!isBackupAndSyncUpdateLoading && (
          <div className="settings-page__content-item-col">
            <ToggleButton
              disabled={!basicFunctionality}
              value={isBackupAndSyncEnabled}
              onToggle={handleProfileSyncToggleSetValue}
              offLabel={t('off')}
              onLabel={t('on')}
              dataTestId="toggleButton"
            />
          </div>
        )}
      </Box>
      {error && (
        <Box paddingBottom={4}>
          <Text
            as="p"
            color={TextColor.errorDefault}
            variant={TextVariant.bodySm}
          >
            {t('notificationsSettingsBoxError')}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default ProfileSyncToggle;
