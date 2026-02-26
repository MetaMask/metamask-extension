import React, { useEffect, useMemo } from 'react';
import { Box } from '@metamask/design-system-react';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { useI18nContext } from '../../../hooks/useI18nContext';

import { NotificationsItem } from './notifications-item';
import { KeyringSnapsItem } from './keyring-snaps-item';
///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
import { WatchAccountItem } from './watch-account-item';
///: END:ONLY_INCLUDE_IF

const ExperimentalTab = () => {
  const t = useI18nContext();

  const settingsRefs = useMemo(() => {
    const count = getNumberOfSettingRoutesInTab(t, t('experimental'));
    return new Array(count)
      .fill(undefined)
      .map(() => React.createRef<HTMLDivElement>());
  }, [t]);

  useEffect(() => {
    handleSettingsRefs(t, t('experimental'), settingsRefs);
  }, [t, settingsRefs]);

  return (
    <Box paddingHorizontal={4} paddingBottom={4}>
      {process.env.NOTIFICATIONS ? (
        <NotificationsItem sectionRef={settingsRefs[0]} />
      ) : null}
      {<KeyringSnapsItem sectionRef={settingsRefs[0]} />}
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
        <WatchAccountItem sectionRef={settingsRefs[0]} />
        ///: END:ONLY_INCLUDE_IF
      }
    </Box>
  );
};

export default ExperimentalTab;
