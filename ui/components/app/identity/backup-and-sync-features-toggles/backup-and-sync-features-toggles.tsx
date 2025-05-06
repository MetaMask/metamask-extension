import React from 'react';
import { useSelector } from 'react-redux';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  selectIsAccountSyncingEnabled,
  selectIsBackupAndSyncEnabled,
  selectIsBackupAndSyncUpdateLoading,
} from '../../../../selectors/identity/backup-and-sync';
import { Box, Icon, IconName, Text } from '../../../component-library';
import ToggleButton from '../../../ui/toggle-button';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import { useBackupAndSync } from '../../../../hooks/identity/useBackupAndSync/useBackupAndSync';

export const backupAndSyncFeaturesTogglesTestIds = {
  container: 'backup-and-sync-features-toggles-container',
  accountSyncingToggleContainer: 'account-syncing-toggle-container',
  accountSyncingToggleButton: 'account-syncing-toggle-button',
};

export const backupAndSyncFeaturesTogglesSections = [
  {
    id: 'accountSyncing',
    titleI18NKey: 'backupAndSyncFeatureAccounts',
    iconName: IconName.UserCircle,
    backupAndSyncfeatureKey: BACKUPANDSYNC_FEATURES.accountSyncing,
    featureReduxSelector: selectIsAccountSyncingEnabled,
    toggleContainerTestId:
      backupAndSyncFeaturesTogglesTestIds.accountSyncingToggleContainer,
    toggleButtonTestId:
      backupAndSyncFeaturesTogglesTestIds.accountSyncingToggleButton,
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
  const { setIsBackupAndSyncFeatureEnabled } = useBackupAndSync();

  const isFeatureEnabled = useSelector(section.featureReduxSelector);

  const handleToggleFeature = async () => {
    await setIsBackupAndSyncFeatureEnabled(
      section.backupAndSyncfeatureKey,
      !isFeatureEnabled,
    );
  };

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.flexStart}
      marginBottom={4}
      id={`backup-and-sync-features-toggles-${section.id}`}
    >
      <Box display={Display.Flex} gap={4}>
        <Icon name={section.iconName} />
        <Text variant={TextVariant.bodyMdMedium}>
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
            offLabel={t('off')}
            onLabel={t('on')}
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

  return (
    <Box
      marginTop={4}
      marginBottom={4}
      className="privacy-settings__setting__wrapper"
      data-testid={backupAndSyncFeaturesTogglesTestIds.container}
    >
      <Text variant={TextVariant.bodyMdMedium}>
        {t('backupAndSyncManageWhatYouSync')}
      </Text>
      <Text
        variant={TextVariant.bodySm}
        color={TextColor.textAlternative}
        as="div"
        marginBottom={4}
      >
        {t('backupAndSyncManageWhatYouSyncDescription')}
      </Text>

      {backupAndSyncFeaturesTogglesSections.map((section) =>
        FeatureToggle({
          section,
          isBackupAndSyncUpdateLoading,
          isBackupAndSyncEnabled,
        }),
      )}
    </Box>
  );
};
