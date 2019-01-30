import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route } from 'react-router-dom'
import NewAccount from './new-account'
import ImportWithSeedPhrase from './import-with-seed-phrase'
import UniqueImage from './unique-image'
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  INITIALIZE_UNIQUE_IMAGE_ROUTE,
  INITIALIZE_NOTICE_ROUTE,
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
      history.push(INITIALIZE_NOTICE_ROUTE)
    }
  }

  render () {
    const { onCreateNewAccount, onCreateNewAccountFromSeed } = this.props

    return (
      <div className="first-time-flow__wrapper">
        <Switch>
          <Route exact path={INITIALIZE_UNIQUE_IMAGE_ROUTE} component={UniqueImage} />
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
