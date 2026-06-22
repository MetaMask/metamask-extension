import React from 'react';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import BackupAndSyncTab from '../../settings/backup-and-sync-tab/backup-and-sync-tab';

const OnboardingBackupSyncSubPage = () => (
  <BackupAndSyncTab isOnboarding />
);

export default OnboardingBackupSyncSubPage;
