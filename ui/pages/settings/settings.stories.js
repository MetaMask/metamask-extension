import React from 'react';

import PropTypes from 'prop-types';
import { MemoryRouter, withRouter } from 'react-router-dom';
import {
  ABOUT_US_ROUTE,
  ADVANCED_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_VIEW_ROUTE,
  GENERAL_ROUTE,
  NETWORKS_FORM_ROUTE,
  NETWORKS_ROUTE,
  SECURITY_ROUTE,
  SETTINGS_ROUTE,
} from '../../helpers/constants/routes';
import SettingsPage from './settings.component';

export default {
  decorators: [
    (story) => (
      <MemoryRouter initialEntries={['/settings/general']}>
        {story()}
      </MemoryRouter>
    ),
  ],

  title: 'Pages/SettingsPage',
};

const ROUTES_TO_I18N_KEYS = {
  [ABOUT_US_ROUTE]: 'about',
  [ADVANCED_ROUTE]: 'advanced',
  [CONTACT_ADD_ROUTE]: 'newContact',
  [CONTACT_EDIT_ROUTE]: 'editContact',
  [CONTACT_LIST_ROUTE]: 'contacts',
  [CONTACT_VIEW_ROUTE]: 'viewContact',
  [GENERAL_ROUTE]: 'general',
  [NETWORKS_FORM_ROUTE]: 'networks',
  [NETWORKS_ROUTE]: 'networks',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
};

global.platform = {
  getVersion: () => 'V3.14.159',
};

const Settings = ({ history }) => {
  const { location } = history;
  const pathname =
    location.pathname === '/iframe.html'
      ? '/settings/general'
      : location.pathname;
  const pathnameI18nKey = ROUTES_TO_I18N_KEYS[pathname];
  return (
    <div style={{ height: 500 }}>
      <SettingsPage
        currentPath={pathname}
        mostRecentOverviewPage={pathname}
        history={history}
        pathnameI18nKey={pathnameI18nKey}
        backRoute={SETTINGS_ROUTE}
        remoteFeatureFlags={{}}
      />
    </div>
  );
};

Settings.propTypes = {
  history: PropTypes.object,
};

export const SettingsPageComponent = withRouter(Settings);
