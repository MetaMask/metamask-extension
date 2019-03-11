import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route } from 'react-router-dom'
import NewAccount from './new-account'
import ImportWithSeedPhrase from './import-with-seed-phrase'
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  INITIALIZE_SEED_PHRASE_ROUTE,
} from '../../../../routes'

export default class CreatePassword extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    isInitialized: PropTypes.bool,
    onCreateNewAccount: PropTypes.func,
    onCreateNewAccountFromSeed: PropTypes.func,
  }

  componentDidMount () {
    const { isInitialized, history } = this.props

    if (isInitialized) {
      history.push(INITIALIZE_SEED_PHRASE_ROUTE)
    }
  }

  render () {
    const { onCreateNewAccount, onCreateNewAccountFromSeed } = this.props

    return (
      <div className="first-time-flow__wrapper">
        <div className="app-header__logo-container">
          <img
            className="app-header__metafox-logo app-header__metafox-logo--horizontal"
            src="/images/logo/metamask-logo-horizontal.svg"
            height={30}
          />
          <img
            className="app-header__metafox-logo app-header__metafox-logo--icon"
            src="/images/logo/metamask-fox.svg"
            height={42}
            width={42}
          />
        </div>
        <Switch>
          <Route
            exact
            path={INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE}
            render={props => (
              <ImportWithSeedPhrase
                { ...props }
                onSubmit={onCreateNewAccountFromSeed}
              />
            )}
          />
          <Route
            exact
            path={INITIALIZE_CREATE_PASSWORD_ROUTE}
            render={props => (
              <NewAccount
                { ...props }
                onSubmit={onCreateNewAccount}
              />
            )}
          />
        </Switch>
      </div>
    )
  }
}
