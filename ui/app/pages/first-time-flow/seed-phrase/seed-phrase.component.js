import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route } from 'react-router-dom'
import RevealSeedPhrase from './reveal-seed-phrase'
import ConfirmSeedPhrase from './confirm-seed-phrase'
import {
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes'
import HTML5Backend from 'react-dnd-html5-backend'
import { DragDropContextProvider } from 'react-dnd'
import MetaFoxLogo from '../../../components/ui/metafox-logo'

export default class SeedPhrase extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    seedPhrase: PropTypes.string,
    verifySeedPhrase: PropTypes.func,
  }

  state = {
    verifiedSeedPhrase: '',
  }

  componentDidMount () {
    const { seedPhrase, history, verifySeedPhrase } = this.props

    if (!seedPhrase) {
      verifySeedPhrase()
        .then(verifiedSeedPhrase => {
          if (!verifiedSeedPhrase) {
            history.push(DEFAULT_ROUTE)
          } else {
            this.setState({ verifiedSeedPhrase })
          }
        })
    }
  }

  render () {
    const { seedPhrase } = this.props
    const { verifiedSeedPhrase } = this.state

    return (
      <DragDropContextProvider backend={HTML5Backend}>
        <div className="first-time-flow__wrapper">
          <MetaFoxLogo />
          <Switch>
            <Route
              exact
              path={INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE}
              render={routeProps => (
                <ConfirmSeedPhrase
                  { ...routeProps }
                  seedPhrase={seedPhrase || verifiedSeedPhrase}
                />
              )}
            />
            <Route
              exact
              path={INITIALIZE_SEED_PHRASE_ROUTE}
              render={routeProps => (
                <RevealSeedPhrase
                  { ...routeProps }
                  seedPhrase={seedPhrase || verifiedSeedPhrase}
                />
              )}
            />
            <Route
              exact
              path={INITIALIZE_BACKUP_SEED_PHRASE_ROUTE}
              render={routeProps => (
                <RevealSeedPhrase
                  { ...routeProps }
                  seedPhrase={seedPhrase || verifiedSeedPhrase}
                />
              )}
            />
          </Switch>
        </div>
      </DragDropContextProvider>
    )
  }
}
