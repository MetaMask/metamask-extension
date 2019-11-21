import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route, matchPath, withRouter } from 'react-router-dom'
import TabBar from '../../components/app/tab-bar'
import c from 'classnames'
import SettingsTab from './settings-tab'
import ConnectionsTab from './connections-tab'
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
  CONNECTIONS_ROUTE,
  ABOUT_US_ROUTE,
  SETTINGS_ROUTE,
  NETWORKS_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
} from '../../helpers/constants/routes'

class SettingsPage extends PureComponent {
  static propTypes = {
    addressName: PropTypes.string,
    backRoute: PropTypes.string,
    currentPath: PropTypes.string,
    history: PropTypes.object,
    isAddressEntryPage: PropTypes.bool,
    isPopupView: PropTypes.bool,
    location: PropTypes.object,
    pathnameI18nKey: PropTypes.string,
    initialBreadCrumbRoute: PropTypes.string,
    breadCrumbTextKey: PropTypes.string,
    initialBreadCrumbKey: PropTypes.string,
    t: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { history, backRoute, currentPath } = this.props

    return (
      <div
        className={c('main-container settings-page', {
          'settings-page--selected': currentPath !== SETTINGS_ROUTE,
        })}
      >
        <div className="settings-page__header">
          {
            currentPath !== SETTINGS_ROUTE && currentPath !== NETWORKS_ROUTE && (
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
    const { isPopupView, pathnameI18nKey, addressName } = this.props

    let titleText

    if (isPopupView && addressName) {
      titleText = addressName
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
    const {
      currentPath,
      isPopupView,
      isAddressEntryPage,
      pathnameI18nKey,
      addressName,
      initialBreadCrumbRoute,
      breadCrumbTextKey,
      history,
      initialBreadCrumbKey,
    } = this.props

    let subheaderText

    if (isPopupView && isAddressEntryPage) {
      subheaderText = t('settings')
    } else if (initialBreadCrumbKey) {
      subheaderText = t(initialBreadCrumbKey)
    } else {
      subheaderText = t(pathnameI18nKey || 'general')
    }

    return currentPath !== NETWORKS_ROUTE && (
      <div className="settings-page__subheader">
        <div
          className={c({ 'settings-page__subheader--link': initialBreadCrumbRoute })}
          onClick={() => initialBreadCrumbRoute && history.push(initialBreadCrumbRoute)}
        >{subheaderText}</div>
        {breadCrumbTextKey && <div
          className="settings-page__subheader--break"
        ><span>{' > '}</span>{t(breadCrumbTextKey)}</div>}
        {isAddressEntryPage && <div
          className="settings-page__subheader--break"
        ><span>{' > '}</span>{addressName}</div>}
      </div>
    )
  }

  renderTabs () {
    const { history, currentPath } = this.props
    const { t } = this.context

    return (
      <TabBar
        tabs={[
          { content: t('general'), description: t('generalSettingsDescription'), key: GENERAL_ROUTE },
          { content: t('connections'), description: t('connectionsSettingsDescription'), key: CONNECTIONS_ROUTE },
          { content: t('advanced'), description: t('advancedSettingsDescription'), key: ADVANCED_ROUTE },
          { content: t('contacts'), description: t('contactsSettingsDescription'), key: CONTACT_LIST_ROUTE },
          { content: t('securityAndPrivacy'), description: t('securitySettingsDescription'), key: SECURITY_ROUTE },
          { content: t('networks'), description: t('networkSettingsDescription'), key: NETWORKS_ROUTE },
          { content: t('about'), description: t('aboutSettingsDescription'), key: ABOUT_US_ROUTE },
        ]}
        isActive={key => {
          if (key === GENERAL_ROUTE && currentPath === SETTINGS_ROUTE) {
            return true
          }
          return matchPath(currentPath, { path: key, exact: true })
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
          path={CONNECTIONS_ROUTE}
          component={ConnectionsTab}
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
          component={ContactListTab}
        />
        <Route
          exact
          path={CONTACT_MY_ACCOUNTS_ROUTE}
          component={ContactListTab}
        />
        <Route
          exact
          path={`${CONTACT_EDIT_ROUTE}/:id`}
          component={ContactListTab}
        />
        <Route
          exact
          path={`${CONTACT_VIEW_ROUTE}/:id`}
          component={ContactListTab}
        />
        <Route
          exact
          path={`${CONTACT_MY_ACCOUNTS_VIEW_ROUTE}/:id`}
          component={ContactListTab}
        />
        <Route
          exact
          path={`${CONTACT_MY_ACCOUNTS_EDIT_ROUTE}/:id`}
          component={ContactListTab}
        />
        <Route
          component={SettingsTab}
        />
      </Switch>
    )
  }
}

export default withRouter(SettingsPage)
