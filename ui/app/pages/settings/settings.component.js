import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route, matchPath } from 'react-router-dom'
import TabBar from '../../components/app/tab-bar'
import SettingsTab from './settings-tab'
import AdvancedTab from './advanced-tab'
import InfoTab from './info-tab'
import {
  DEFAULT_ROUTE,
  ADVANCED_ROUTE,
  COMPANY_ROUTE,
  LEGAL_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
} from '../../helpers/constants/routes'

export default class SettingsPage extends PureComponent {
  static propTypes = {
    location: PropTypes.object,
    history: PropTypes.object,
    t: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { t } = this.context
    const { history, location } = this.props

    if (location && location.pathname !== '/settings') {
      return this.renderContent()
    }

    return (
      <div className="main-container settings-page">
        <div className="settings-page__header">
          <div className="settings-page__header__title">{t('settings')}</div>
          <div
            className="settings-page__close-button"
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
        </div>
        <div className="settings-page__content">
          { this.renderTabs() }
        </div>
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
          { content: t('securityAndPrivacy'), description: t('securitySettingsDescription'), key: SECURITY_ROUTE },
          { content: t('company'), key: COMPANY_ROUTE },
          { content: t('legal'), key: LEGAL_ROUTE },
        ]}
        isActive={key => matchPath(location.pathname, { path: key, exact: true })}
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
          path={COMPANY_ROUTE}
          component={InfoTab}
        />
        <Route
          exact
          path={ADVANCED_ROUTE}
          component={AdvancedTab}
        />
      </Switch>
    )
  }
}
