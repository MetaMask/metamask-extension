import React from 'react';

import PropTypes from 'prop-types';
import { withRouter, MemoryRouter } from 'react-router-dom';
import {
  ABOUT_US_ROUTE,
  ADVANCED_ROUTE,
  ALERTS_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
  GENERAL_ROUTE,
  NETWORKS_FORM_ROUTE,
  NETWORKS_ROUTE,
  SECURITY_ROUTE,
  SETTINGS_ROUTE,
  SNAPS_LIST_ROUTE,
  SNAPS_VIEW_ROUTE,
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
  [ALERTS_ROUTE]: 'alerts',
  [CONTACT_ADD_ROUTE]: 'newContact',
  [CONTACT_EDIT_ROUTE]: 'editContact',
  [CONTACT_LIST_ROUTE]: 'contacts',
  [CONTACT_VIEW_ROUTE]: 'viewContact',
  [GENERAL_ROUTE]: 'general',
  [NETWORKS_FORM_ROUTE]: 'networks',
  [NETWORKS_ROUTE]: 'networks',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
  [SNAPS_LIST_ROUTE]: 'snaps',
  [SNAPS_VIEW_ROUTE]: 'snaps',
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
  const isSnapViewPage = Boolean(pathname.match(SNAPS_VIEW_ROUTE));
  const backRoute = isSnapViewPage ? SNAPS_LIST_ROUTE : SETTINGS_ROUTE;

  return (
    <div style={{ height: 500 }}>
      <SettingsPage
        currentPath={pathname}
        mostRecentOverviewPage={pathname}
        history={history}
        pathnameI18nKey={pathnameI18nKey}
        backRoute={backRoute}
        isSnapViewPage={isSnapViewPage}
      />
    </div>
  );
};

Settings.propTypes = {
  history: PropTypes.object,
};

export const SettingsPageComponent = withRouter(Settings);
