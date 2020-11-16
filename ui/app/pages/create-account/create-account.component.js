import React, { Component } from 'react'
import { Switch, Route, matchPath } from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {
  NEW_ACCOUNT_ROUTE,
  IMPORT_ACCOUNT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
} from '../../helpers/constants/routes'
import NewAccountCreateForm from './new-account.container'
import NewAccountImportForm from './import-account'
import ConnectHardwareForm from './connect-hardware'

export default class CreateAccountPage extends Component {
  renderTabs() {
    const {
      history,
      location: { pathname },
    } = this.props
    const getClassNames = (path) =>
      classnames('new-account__tabs__tab', {
        'new-account__tabs__selected': matchPath(pathname, {
          path,
          exact: true,
        }),
      })

    return (
      <div className="new-account__tabs">
        <div
          className={getClassNames(NEW_ACCOUNT_ROUTE)}
          onClick={() => history.push(NEW_ACCOUNT_ROUTE)}
        >
          {this.context.t('create')}
        </div>
        <div
          className={getClassNames(IMPORT_ACCOUNT_ROUTE)}
          onClick={() => history.push(IMPORT_ACCOUNT_ROUTE)}
        >
          {this.context.t('import')}
        </div>
        <div
          className={getClassNames(CONNECT_HARDWARE_ROUTE)}
          onClick={() => history.push(CONNECT_HARDWARE_ROUTE)}
        >
          {this.context.t('hardware')}
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="new-account">
        <div className="new-account__header">
          <div
            className={`new-account__header ${this.context.t('newAccount')}`}
          >
            {this.renderTabs()}
          </div>
        </div>
        <div className="new-account__form">
          <Switch>
            <Route
              exact
              path={NEW_ACCOUNT_ROUTE}
              component={NewAccountCreateForm}
            />
            <Route
              exact
              path={IMPORT_ACCOUNT_ROUTE}
              component={NewAccountImportForm}
            />
            <Route
              exact
              path={CONNECT_HARDWARE_ROUTE}
              component={ConnectHardwareForm}
            />
          </Switch>
        </div>
      </div>
    )
  }
}

CreateAccountPage.propTypes = {
  location: PropTypes.object,
  history: PropTypes.object,
}

CreateAccountPage.contextTypes = {
  t: PropTypes.func,
}
