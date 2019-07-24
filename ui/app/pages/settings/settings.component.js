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
import AddContact from './contact-list-tab/add-contact'
import EditContact from './contact-list-tab/edit-contact'
import ViewContact from './contact-list-tab/view-contact'
import {
  DEFAULT_ROUTE,
  ADVANCED_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  SETTINGS_ROUTE,
  NETWORKS_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
} from '../../helpers/constants/routes'
import {addressSlicer} from '../../helpers/utils/util'

const ROUTES_TO_I18N_KEYS = {
  [GENERAL_ROUTE]: 'general',
  [ADVANCED_ROUTE]: 'advanced',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
  [ABOUT_US_ROUTE]: 'about',
  [CONTACT_LIST_ROUTE]: 'contactList',
  [CONTACT_ADD_ROUTE]: 'newContact',
  [CONTACT_EDIT_ROUTE]: 'editContact',
  [CONTACT_VIEW_ROUTE]: 'viewContact',
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
    const { history, location } = this.props
    const isAddressEntryPage = location.pathname.includes('0x')

    let backRoute
    if (isAddressEntryPage) {
      backRoute = CONTACT_LIST_ROUTE
    } else {
      backRoute = SETTINGS_ROUTE
    }

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
                onClick={() => history.push(backRoute)}
              />
            )
          }
          { this.renderTitle() }
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

  renderTitle () {
    const { t } = this.context
    const { location } = this.props

    let titleText

    const pathnameI18nKey = ROUTES_TO_I18N_KEYS[location.pathname]
    const isAddressEntryPage = location.pathname.includes('0x')
    const isPopupView = getEnvironmentType(location.href) === ENVIRONMENT_TYPE_POPUP

    if (isPopupView && isAddressEntryPage) {
      titleText = addressSlicer(location.pathname.slice(-42))
    } else if (pathnameI18nKey && isPopupView) {
      titleText = t(pathnameI18nKey)
    } else {
      titleText = t('settings')
    }

    return (
      <div className="settings-page__header__title">
        {titleText}
      </div>
    )
  }

  renderSubHeader () {
    const { t } = this.context
    const { location: { pathname } } = this.props
    const isPopupView = getEnvironmentType(location.href) === ENVIRONMENT_TYPE_POPUP

    let subheaderText

    if (isPopupView && pathname.includes('0x')) {
      subheaderText = t('settings')
    } else if (pathname.includes('0x')) {
      subheaderText = addressSlicer(pathname.slice(-42))
    } else {
      subheaderText = t(ROUTES_TO_I18N_KEYS[pathname] || 'general')
    }

    return pathname !== NETWORKS_ROUTE && (
      <div className="settings-page__subheader">
        {subheaderText}
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
          path={`${CONTACT_VIEW_ROUTE}/:id`}
          component={ViewContact}
        />
        <Route
          component={SettingsTab}
        />
      </Switch>
    )
  }
}

export default withRouter(SettingsPage)
