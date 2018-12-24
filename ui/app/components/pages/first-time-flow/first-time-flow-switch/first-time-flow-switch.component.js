import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router-dom'
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_NOTICE_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
  INITIALIZE_SEED_PHRASE_ROUTE,
} from '../../../../routes'

export default class FirstTimeFlowSwitch extends PureComponent {
  static propTypes = {
    completedOnboarding: PropTypes.bool,
    isInitialized: PropTypes.bool,
    isUnlocked: PropTypes.bool,
    noActiveNotices: PropTypes.bool,
    seedPhrase: PropTypes.string,
  }

  render () {
    const {
      completedOnboarding,
      isInitialized,
      isUnlocked,
      noActiveNotices,
      seedPhrase,
    } = this.props

    console.log('SWITCH', seedPhrase, isUnlocked)

    if (completedOnboarding) {
      return <Redirect to={{ pathname: DEFAULT_ROUTE }} />
    }

    if (isUnlocked && !seedPhrase) {
      return <Redirect to={{ pathname: LOCK_ROUTE }} />
    }

    if (!isInitialized) {
      return <Redirect to={{ pathname: INITIALIZE_WELCOME_ROUTE }} />
    }

    if (!isUnlocked) {
      return <Redirect to={{ pathname: INITIALIZE_UNLOCK_ROUTE }} />
    }

    if (!noActiveNotices) {
      return <Redirect to={{ pathname: INITIALIZE_NOTICE_ROUTE }} />
    }

    if (seedPhrase) {
      return <Redirect to={{ pathname: INITIALIZE_SEED_PHRASE_ROUTE }} />
    }

    return <Redirect to={{ pathname: INITIALIZE_WELCOME_ROUTE }} />
  }
}
