import React, { useEffect, useMemo } from 'react';
import { Box } from '@metamask/design-system-react';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isExperimental, isFlask } from '../../../../shared/lib/build-types';
import { NotificationsItem } from './notifications-item';
import { KeyringSnapsItem } from './keyring-snaps-item';
import { WatchAccountItem } from './watch-account-item';

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
      {process.env.NOTIFICATIONS && (
        <NotificationsItem sectionRef={settingsRefs[0]} />
      )}
      {<KeyringSnapsItem sectionRef={settingsRefs[0]} />}
      {(isFlask() || isExperimental()) && (
        <WatchAccountItem sectionRef={settingsRefs[0]} />
      )}
    </Box>
  );
};

export default ExperimentalTab;
