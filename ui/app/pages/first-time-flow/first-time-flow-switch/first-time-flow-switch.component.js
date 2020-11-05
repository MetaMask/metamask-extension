import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router-dom'
import {
  DEFAULT_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
} from '../../../helpers/constants/routes'

export default class FirstTimeFlowSwitch extends PureComponent {
  static propTypes = {
    completedOnboarding: PropTypes.bool,
    isInitialized: PropTypes.bool,
    isUnlocked: PropTypes.bool,
  }

  render() {
    const { completedOnboarding, isInitialized, isUnlocked } = this.props

    if (completedOnboarding) {
      return <Redirect to={{ pathname: DEFAULT_ROUTE }} />
    }

    if (!isInitialized) {
      return <Redirect to={{ pathname: INITIALIZE_WELCOME_ROUTE }} />
    }

    return <Redirect to={{ pathname: INITIALIZE_UNLOCK_ROUTE }} />
  }
}
