import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router-dom'
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
  INITIALIZE_METAMETRICS_OPT_IN_ROUTE,
} from '../../../helpers/constants/routes'

export default class FirstTimeFlowSwitch extends PureComponent {
  static propTypes = {
    completedOnboarding: PropTypes.bool,
    isInitialized: PropTypes.bool,
    isUnlocked: PropTypes.bool,
    optInMetaMetrics: PropTypes.bool,
  }

  render () {
    const {
      completedOnboarding,
      isInitialized,
      isUnlocked,
      optInMetaMetrics,
    } = this.props

    if (completedOnboarding) {
      return <Redirect to={{ pathname: DEFAULT_ROUTE }} />
    }

    if (isUnlocked) {
      return <Redirect to={{ pathname: LOCK_ROUTE }} />
    }

    if (!isInitialized) {
      return <Redirect to={{ pathname: INITIALIZE_WELCOME_ROUTE }} />
    }

    if (!isUnlocked) {
      return <Redirect to={{ pathname: INITIALIZE_UNLOCK_ROUTE }} />
    }

    if (optInMetaMetrics === null) {
      return <Redirect to={{ pathname: INITIALIZE_WELCOME_ROUTE }} />
    }

    return <Redirect to={{ pathname: INITIALIZE_METAMETRICS_OPT_IN_ROUTE }} />
  }
}
