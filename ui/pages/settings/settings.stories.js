import React from 'react';
import { SETTINGS_ROUTE } from '../../helpers/constants/routes';
import SettingsPage from './settings.component';

global.platform = {
  getVersion: () => 'V3.14.159',
};

export default {
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Pages/SettingsPage',
};

const CURRENT_PATH = '/settings/general';

export const SettingsPageComponent = () => (
  <SettingsPage
    addNewNetwork={false}
    addressName=""
    backRoute={SETTINGS_ROUTE}
    breadCrumbTextKey=""
    conversionDate={Date.now()}
    currentPath={CURRENT_PATH} // Default to general settings page
    initialBreadCrumbKey=""
    initialBreadCrumbRoute=""
    isAddressEntryPage={false}
    isPasswordChangePage={false}
    isPopup={false}
    isRevealSrpListPage={false}
    isSeedlessPasswordOutdated={false}
    location={{ pathname: CURRENT_PATH }}
    mostRecentOverviewPage={CURRENT_PATH}
    navigate={() => undefined}
    pathnameI18nKey="general"
    settingsPageSnaps={[]}
    snapSettingsTitle=""
    toggleNetworkMenu={() => undefined}
    useExternalServices
  />
);
