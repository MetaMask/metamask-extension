import React, { useCallback } from 'react';
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
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import { useBackupAndSync } from '../../../../hooks/identity/useBackupAndSync/useBackupAndSync';

export const backupAndSyncFeaturesTogglesTestIds = {
  container: 'backup-and-sync-features-toggles-container',
  accountSyncingToggleButton: 'account-syncing-toggle-button',
};

export const BackupAndSyncFeaturesToggles = () => {
  const t = useI18nContext();

  const { setIsBackupAndSyncFeatureEnabled } = useBackupAndSync();

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isAccountSyncingEnabled = useSelector(selectIsAccountSyncingEnabled);

  const isBackupAndSyncUpdateLoading = useSelector(
    selectIsBackupAndSyncUpdateLoading,
  );

  const handleUpdateAccountSyncingState = useCallback(
    (enabled: boolean) => {
      setIsBackupAndSyncFeatureEnabled(
        BACKUPANDSYNC_FEATURES.accountSyncing,
        enabled,
      );
    },
    [setIsBackupAndSyncFeatureEnabled],
  );

  return (
    <Box
      marginTop={4}
      marginBottom={4}
      className="privacy-settings__setting__wrapper"
      data-testid={backupAndSyncFeaturesTogglesTestIds.container}
    >
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.flexStart}
        marginBottom={4}
        id="backup-and-sync-features-toggles-account-syncing"
      >
        <Box display={Display.Flex} gap={4}>
          <Icon name={IconName.UserCircle} />
          <Text variant={TextVariant.bodyMdMedium}>
            {t('backupAndSyncFeatureAccounts')}
          </Text>
        </Box>
        {isBackupAndSyncUpdateLoading ? (
          <Box paddingLeft={5} paddingRight={5}>
            <Preloader size={36} />
          </Box>
        ) : (
          <div className="privacy-settings__setting__toggle">
            <ToggleButton
              value={isAccountSyncingEnabled}
              disabled={!isBackupAndSyncEnabled}
              dataTestId={
                backupAndSyncFeaturesTogglesTestIds.accountSyncingToggleButton
              }
              onToggle={() =>
                handleUpdateAccountSyncingState(!isAccountSyncingEnabled)
              }
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        )}
      </Box>
    </Box>
  );
};
