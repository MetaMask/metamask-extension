import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BackupAndSyncFeaturesToggles } from '../../../components/app/identity/backup-and-sync-features-toggles/backup-and-sync-features-toggles';
import { BackupAndSyncToggle } from '../../../components/app/identity/backup-and-sync-toggle/backup-and-sync-toggle';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import { SettingItemConfig } from '../../settings-v2/types';
import { SettingsTab } from '../../settings-v2/shared';

const BackupAndSyncTab = () => {
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const items = useMemo<SettingItemConfig[]>(() => {
    const result: SettingItemConfig[] = [
      {
        id: 'backup-toggle',
        component: BackupAndSyncToggle,
      },
    ];

    if (isBackupAndSyncEnabled) {
      result.push({
        id: 'features-toggles',
        component: BackupAndSyncFeaturesToggles,
        hasDividerBefore: true,
      });
    }

    return result;
  }, [isBackupAndSyncEnabled]);

  return <SettingsTab items={items} tabMessageKey="backupAndSync" />;
};

export default BackupAndSyncTab;
