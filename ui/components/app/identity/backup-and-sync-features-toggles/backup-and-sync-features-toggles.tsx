import React, { useCallback, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  selectIsAccountSyncingEnabled,
  selectIsContactSyncingEnabled,
  selectIsBackupAndSyncEnabled,
  selectIsBackupAndSyncUpdateLoading,
} from '../../../../selectors/identity/backup-and-sync';
import ToggleButton from '../../../ui/toggle-button';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import { useBackupAndSync } from '../../../../hooks/identity/useBackupAndSync/useBackupAndSync';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';

export const backupAndSyncFeaturesTogglesTestIds = {
  container: 'backup-and-sync-features-toggles-container',
  accountSyncingToggleContainer: 'account-syncing-toggle-container',
  accountSyncingToggleButton: 'account-syncing-toggle-button',
  contactSyncingToggleContainer: 'contact-syncing-toggle-container',
  contactSyncingToggleButton: 'contact-syncing-toggle-button',
};

export const backupAndSyncFeaturesTogglesSections = [
  {
    id: 'accounts',
    titleI18NKey: 'backupAndSyncFeatureAccounts',
    iconName: IconName.UserCircle,
    backupAndSyncfeatureKey: BACKUPANDSYNC_FEATURES.accountSyncing,
    featureReduxSelector: selectIsAccountSyncingEnabled,
    toggleContainerTestId:
      backupAndSyncFeaturesTogglesTestIds.accountSyncingToggleContainer,
    toggleButtonTestId:
      backupAndSyncFeaturesTogglesTestIds.accountSyncingToggleButton,
  },
  {
    id: 'contactSyncing',
    titleI18NKey: 'backupAndSyncFeatureContacts',
    iconName: IconName.Book,
    backupAndSyncfeatureKey: BACKUPANDSYNC_FEATURES.contactSyncing,
    featureReduxSelector: selectIsContactSyncingEnabled,
    toggleContainerTestId:
      backupAndSyncFeaturesTogglesTestIds.contactSyncingToggleContainer,
    toggleButtonTestId:
      backupAndSyncFeaturesTogglesTestIds.contactSyncingToggleButton,
  },
];

const FeatureToggle = ({
  section,
  isBackupAndSyncUpdateLoading,
  isBackupAndSyncEnabled,
}: {
  section: (typeof backupAndSyncFeaturesTogglesSections)[number];
  isBackupAndSyncUpdateLoading: boolean;
  isBackupAndSyncEnabled: boolean;
}) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { setIsBackupAndSyncFeatureEnabled } = useBackupAndSync();

  const isFeatureEnabled = useSelector(section.featureReduxSelector);

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
          settings_type: section.id,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          old_value: isFeatureEnabled,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_value: newValue,
        },
      });
    },
    [trackEvent, isFeatureEnabled, section.id],
  );

  const handleToggleFeature = async () => {
    trackBackupAndSyncToggleEvent(!isFeatureEnabled);
    await setIsBackupAndSyncFeatureEnabled(
      section.backupAndSyncfeatureKey,
      !isFeatureEnabled,
    );
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Start}
      marginBottom={4}
      id={`backup-and-sync-features-toggles-${section.id}`}
    >
      <Box flexDirection={BoxFlexDirection.Row} gap={4}>
        <Icon name={section.iconName} />
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t(section.titleI18NKey)}
        </Text>
      </Box>
      {isBackupAndSyncUpdateLoading ? (
        <Box paddingLeft={5} paddingRight={5}>
          <Preloader size={36} />
        </Box>
      ) : (
        <div
          className="privacy-settings__setting__toggle"
          data-testid={section.toggleContainerTestId}
        >
          <ToggleButton
            value={isFeatureEnabled}
            disabled={!isBackupAndSyncEnabled}
            onToggle={handleToggleFeature}
            dataTestId={section.toggleButtonTestId}
          />
        </div>
      )}
    </Box>
  );
};

export const BackupAndSyncFeaturesToggles = () => {
  const t = useI18nContext();

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isBackupAndSyncUpdateLoading = useSelector(
    selectIsBackupAndSyncUpdateLoading,
  );
  const isAccountSyncingEnabled = useSelector(selectIsAccountSyncingEnabled);
  const isContactSyncingEnabled = useSelector(selectIsContactSyncingEnabled);

  const { setIsBackupAndSyncFeatureEnabled } = useBackupAndSync();

  // Reverse cascading: if all sub-features are manually turned off, turn off main toggle
  // Guard against race conditions by not running while updates are in progress
  useEffect(() => {
    const allSubFeaturesDisabled =
      !isAccountSyncingEnabled && !isContactSyncingEnabled;

    if (
      isBackupAndSyncEnabled &&
      allSubFeaturesDisabled &&
      !isBackupAndSyncUpdateLoading
    ) {
      (async () => {
        try {
          await setIsBackupAndSyncFeatureEnabled(
            BACKUPANDSYNC_FEATURES.main,
            false,
          );
        } catch (err) {
          console.error('Failed to disable main backup and sync toggle:', err);
        }
      })();
    }
  }, [
    isBackupAndSyncEnabled,
    isAccountSyncingEnabled,
    isContactSyncingEnabled,
    isBackupAndSyncUpdateLoading,
    setIsBackupAndSyncFeatureEnabled,
  ]);

  return (
    <Box
      marginTop={4}
      marginBottom={4}
      paddingLeft={4}
      paddingRight={4}
      className="privacy-settings__setting__wrapper"
      data-testid={backupAndSyncFeaturesTogglesTestIds.container}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {t('backupAndSyncManageWhatYouSync')}
      </Text>
      <Box marginBottom={4}>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          asChild
        >
          <div>{t('backupAndSyncManageWhatYouSyncDescription')}</div>
        </Text>
      </Box>

      {backupAndSyncFeaturesTogglesSections.map((section) => (
        <FeatureToggle
          key={section.id}
          section={section}
          isBackupAndSyncUpdateLoading={isBackupAndSyncUpdateLoading}
          isBackupAndSyncEnabled={isBackupAndSyncEnabled}
        />
      ))}
    </Box>
  );
};
