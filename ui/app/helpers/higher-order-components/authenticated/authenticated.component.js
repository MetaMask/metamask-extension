import React from 'react'
import PropTypes from 'prop-types'
import { Redirect, Route } from 'react-router-dom'
import { UNLOCK_ROUTE, INITIALIZE_ROUTE } from '../../constants/routes'
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'

export default function Authenticated (props) {
  const { isUnlocked, completedOnboarding } = props

  switch (true) {
    case isUnlocked && completedOnboarding:
      return <Route { ...props } />
    case !completedOnboarding:
      if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_FULLSCREEN) {
        return <Redirect to={{ pathname: INITIALIZE_ROUTE }} />
      }
      return global.platform.openExtensionInBrowser(INITIALIZE_ROUTE)
    default:
      return <Redirect to={{ pathname: UNLOCK_ROUTE }} />
  }
}

Authenticated.propTypes = {
  isUnlocked: PropTypes.bool,
  completedOnboarding: PropTypes.bool,
}
