import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route, matchPath } from 'react-router-dom'
import TabBar from '../../tab-bar'
import SettingsTab from './settings-tab'
import InfoTab from './info-tab'
import { DEFAULT_ROUTE, SETTINGS_ROUTE, INFO_ROUTE } from '../../../routes'

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
    const { history, location } = this.props

    return (
      <div className="main-container settings-page">
        <div className="settings-page__header">
          <div
            className="settings-page__close-button"
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
          <TabBar
            tabs={[
              { content: this.context.t('settings'), key: SETTINGS_ROUTE },
              { content: this.context.t('info'), key: INFO_ROUTE },
            ]}
            isActive={key => matchPath(location.pathname, { path: key, exact: true })}
            onSelect={key => history.push(key)}
          />
        </div>
        <Switch>
          <Route
            exact
            path={INFO_ROUTE}
            component={InfoTab}
          />
          <Route
            exact
            path={SETTINGS_ROUTE}
            component={SettingsTab}
          />
        </Switch>
      </div>
    )
  }
}
