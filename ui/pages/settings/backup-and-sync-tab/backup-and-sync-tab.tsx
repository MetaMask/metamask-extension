import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxBorderColor,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { BackupAndSyncFeaturesToggles } from '../../../components/app/identity/backup-and-sync-features-toggles/backup-and-sync-features-toggles';
import { BackupAndSyncToggle } from '../../../components/app/identity/backup-and-sync-toggle/backup-and-sync-toggle';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';

const BackupAndSyncTab = () => {
  const t = useI18nContext();
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const settingsRefs = useMemo(() => {
    const count = getNumberOfSettingRoutesInTab(t, t('backupAndSync'));
    return Array(count)
      .fill(undefined)
      .map(() => React.createRef<HTMLSpanElement>());
  }, [t]);

  useEffect(() => {
    handleSettingsRefs(t, t('backupAndSync'), settingsRefs);
  }, [t, settingsRefs]);

  return (
    <Box
      className="settings-page__body"
      flexDirection={BoxFlexDirection.Column}
      paddingTop={0}
      paddingRight={4}
      paddingBottom={4}
      paddingLeft={4}
    >
      <BackupAndSyncToggle />
      <Box
        borderColor={BoxBorderColor.BorderMuted}
        borderWidth={1}
        className="w-full h-px border-b-0"
      />
      {isBackupAndSyncEnabled && <BackupAndSyncFeaturesToggles />}
    </Box>
  );
};

export default BackupAndSyncTab;
