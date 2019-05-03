import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route } from 'react-router-dom'
import RevealSeedPhrase from './reveal-seed-phrase'
import ConfirmSeedPhrase from './confirm-seed-phrase'
import {
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes'
import HTML5Backend from 'react-dnd-html5-backend'
import {DragDropContextProvider} from 'react-dnd'

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
    const { seedPhrase } = this.props

    return (
      <DragDropContextProvider backend={HTML5Backend}>
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
              path={INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE}
              render={props => (
                <ConfirmSeedPhrase
                  { ...props }
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
                  seedPhrase={seedPhrase}
                />
              )}
            />
          </Switch>
        </div>
      </DragDropContextProvider>
    )
  }
}
