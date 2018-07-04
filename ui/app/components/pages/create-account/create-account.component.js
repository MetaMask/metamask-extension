import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {Switch, Route, matchPath} from 'react-router-dom'
import classnames from 'classnames'
import NewAccountCreateForm from './new-account/new-account.component'
import NewAccountImportForm from './import-account'
import {NEW_ACCOUNT_ROUTE, IMPORT_ACCOUNT_ROUTE} from '../../../routes'


export default class CreateAccountPage extends Component {

  static propTypes = {
    location: PropTypes.object,
    history: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  renderTabs () {
    const {history, location} = this.props

    return (
      <div className={'new-account__tabs'}>
        <div
          className={classnames('new-account__tabs__tab', {
            'new-account__tabs__selected': matchPath(location.pathname, {
              path: NEW_ACCOUNT_ROUTE,
              exact: true,
            }),
          })}
          onClick={() => history.push(NEW_ACCOUNT_ROUTE)}
        >
          {this.context.t('create')}
        </div>
        <div
          className={classnames('new-account__tabs__tab', {
            'new-account__tabs__selected': matchPath(location.pathname, {
              path: IMPORT_ACCOUNT_ROUTE,
              exact: true,
            }),
          })}
          onClick={() => history.push(IMPORT_ACCOUNT_ROUTE)}
        >
          {this.context.t('import')}
        </div>
      </div>
    )
  }

  render () {
    return (
      <div className={'new-account'}>
        <div className={'new-account__header'}>
          <div className={'new-account__title'}>
            {this.context.t('newAccount')}
          </div>
          {this.renderTabs()}
        </div>
        <div className={'new-account__form'}>
          <Switch>
            <Route exact path={NEW_ACCOUNT_ROUTE} component={NewAccountCreateForm}/>
            <Route exact path={IMPORT_ACCOUNT_ROUTE} component={NewAccountImportForm}/>
          </Switch>
        </div>
      </div>
    )
  }
}
