import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route, matchPath, withRouter } from 'react-router-dom'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import TabBar from '../../components/app/tab-bar'
import c from 'classnames'
import SettingsTab from './settings-tab'
import NetworksTab from './networks-tab'
import AdvancedTab from './advanced-tab'
import InfoTab from './info-tab'
import SecurityTab from './security-tab'
import ContactListTab from './contact-list-tab'
import {
  DEFAULT_ROUTE,
  ADVANCED_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  SETTINGS_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  NETWORKS_ROUTE,
} from '../../helpers/constants/routes'

import AddContact from './contact-list-tab/add-contact'
import EditContact from './contact-list-tab/edit-contact'

const ROUTES_TO_I18N_KEYS = {
  [GENERAL_ROUTE]: 'general',
  [ADVANCED_ROUTE]: 'advanced',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
  [ABOUT_US_ROUTE]: 'about',
  [CONTACT_LIST_ROUTE]: 'contactList',
}

class SettingsPage extends PureComponent {
  static propTypes = {
    location: PropTypes.object,
    history: PropTypes.object,
    t: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  isCurrentPath (pathname) {
    return this.props.location.pathname === pathname
  }

  render () {
    const { t } = this.context
    const { history, location } = this.props

    const pathnameI18nKey = ROUTES_TO_I18N_KEYS[location.pathname]
    const isPopupView = getEnvironmentType(location.href) === ENVIRONMENT_TYPE_POPUP

    return (
      <div
        className={c('main-container settings-page', {
          'settings-page--selected': !this.isCurrentPath(SETTINGS_ROUTE),
        })}
      >
        <div className="settings-page__header">
          {
            !this.isCurrentPath(SETTINGS_ROUTE) && !this.isCurrentPath(NETWORKS_ROUTE) && (
              <div
                className="settings-page__back-button"
                onClick={() => history.push(SETTINGS_ROUTE)}
              />
            )
          }
          <div className="settings-page__header__title">
            {t(pathnameI18nKey && isPopupView ? pathnameI18nKey : 'settings')}
          </div>
          <div
            className="settings-page__close-button"
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
        </div>
        <div className="settings-page__content">
          <div className="settings-page__content__tabs">
            { this.renderTabs() }
          </div>
          <div className="settings-page__content__modules">
            { this.renderSubHeader() }
            { this.renderContent() }
          </div>
        </div>
      </div>
    )
  }

  renderSubHeader () {
    const { t } = this.context
    const { location: { pathname } } = this.props

    return (
      <div className="settings-page__subheader">
        {t(ROUTES_TO_I18N_KEYS[pathname] || 'general')}
      </div>
    )
  }

  renderTabs () {
    const { history, location } = this.props
    const { t } = this.context

    return (
      <TabBar
        tabs={[
          { content: t('general'), description: t('generalSettingsDescription'), key: GENERAL_ROUTE },
          { content: t('advanced'), description: t('advancedSettingsDescription'), key: ADVANCED_ROUTE },
          { content: t('contactList'), description: t('contactListDescription'), key: CONTACT_LIST_ROUTE },
          { content: t('securityAndPrivacy'), description: t('securitySettingsDescription'), key: SECURITY_ROUTE },
          { content: t('networks'), description: t('networkSettingsDescription'), key: NETWORKS_ROUTE },
          { content: t('about'), description: t('aboutSettingsDescription'), key: ABOUT_US_ROUTE },
        ]}
        isActive={key => {
          if (key === GENERAL_ROUTE && this.isCurrentPath(SETTINGS_ROUTE)) {
            return true
          }
          return matchPath(location.pathname, { path: key, exact: true })
        }}
        onSelect={key => history.push(key)}
      />
    )
  }

  renderContent () {
    return (
      <Switch>
        <Route
          exact
          path={GENERAL_ROUTE}
          component={SettingsTab}
        />
        <Route
          exact
          path={ABOUT_US_ROUTE}
          component={InfoTab}
        />
        <Route
          exact
          path={ADVANCED_ROUTE}
          component={AdvancedTab}
        />
        <Route
          exact
          path={NETWORKS_ROUTE}
          component={NetworksTab}
        />
        <Route
          exact
          path={SECURITY_ROUTE}
          component={SecurityTab}
        />
        <Route
          exact
          path={CONTACT_LIST_ROUTE}
          component={ContactListTab}
        />
        <Route
          exact
          path={CONTACT_ADD_ROUTE}
          component={AddContact}
        />
        <Route
          exact
          path={`${CONTACT_EDIT_ROUTE}/:id`}
          component={EditContact}
        />
        <Route
          exact
          path={CONTACT_EDIT_ROUTE}
          component={AddContact}
        />
        <Route
          component={SettingsTab}
        />
      </Switch>
    )
  }
}

export default withRouter(SettingsPage)
