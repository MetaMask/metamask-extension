import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BackupAndSyncFeaturesToggles } from '../../../components/app/identity/backup-and-sync-features-toggles/backup-and-sync-features-toggles';
import { BackupAndSyncToggle } from '../../../components/app/identity/backup-and-sync-toggle/backup-and-sync-toggle';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import { getBackupAndSyncOnboardingToggleState } from '../../../selectors';
import { SettingItemConfig } from '../types';
import { SettingsTab } from '../shared';

type BackupAndSyncTabProps = {
  isOnboarding?: boolean;
};

const BackupAndSyncToggleSettingItem = ({
  isOnboarding = false,
}: {
  isOnboarding?: boolean;
}) => <BackupAndSyncToggle isOnboarding={isOnboarding} />;

const BackupAndSyncTab = ({ isOnboarding = false }: BackupAndSyncTabProps) => {
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isOnboardingBackupAndSyncEnabled = useSelector(
    getBackupAndSyncOnboardingToggleState,
  );
  const isFeaturesSectionEnabled = isOnboarding
    ? isOnboardingBackupAndSyncEnabled
    : isBackupAndSyncEnabled;

  const items = useMemo<SettingItemConfig[]>(() => {
    const result: SettingItemConfig[] = [
      {
        id: 'backup-toggle',
        component: () => (
          <BackupAndSyncToggleSettingItem isOnboarding={isOnboarding} />
        ),
      },
    ];

    if (isFeaturesSectionEnabled) {
      result.push({
        id: 'features-toggles',
        component: BackupAndSyncFeaturesToggles,
        hasDividerBefore: true,
      });
    }

    return result;
  }, [isFeaturesSectionEnabled, isOnboarding]);

  return <SettingsTab items={items} />;
};

export default BackupAndSyncTab;
