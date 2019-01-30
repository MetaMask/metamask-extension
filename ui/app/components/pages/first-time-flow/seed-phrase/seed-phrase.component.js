import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route } from 'react-router-dom'
import RevealSeedPhrase from './reveal-seed-phrase'
import ConfirmSeedPhrase from './confirm-seed-phrase'
import {
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../routes'

export default class SeedPhrase extends PureComponent {
  static propTypes = {
    address: PropTypes.string,
    history: PropTypes.object,
    seedPhrase: PropTypes.string,
  }

  componentDidMount () {
    const { seedPhrase, history } = this.props

    if (!seedPhrase) {
      history.push(DEFAULT_ROUTE)
    }
  }

  render () {
    const { address, seedPhrase } = this.props

    return (
      <div className="first-time-flow__wrapper">
        <Switch>
          <Route
            exact
            path={INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE}
            render={props => (
              <ConfirmSeedPhrase
                { ...props }
                address={address}
                seedPhrase={seedPhrase}
              />
            )}
          />
          <Route
            exact
            path={INITIALIZE_SEED_PHRASE_ROUTE}
            render={props => (
              <RevealSeedPhrase
                { ...props }
                address={address}
                seedPhrase={seedPhrase}
              />
            )}
          />
        </Switch>
      </div>
    )
  }
}
