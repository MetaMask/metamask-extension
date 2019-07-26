import React from 'react'
import PropTypes from 'prop-types'
import { Redirect, Route } from 'react-router-dom'
import { INITIALIZE_ROUTE } from '../../constants/routes'
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'

export default function Initialized (props) {
  if (props.completedOnboarding) {
    return <Route { ...props } />
  } else if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_FULLSCREEN) {
    return <Redirect to={{ pathname: INITIALIZE_ROUTE }} />
  }
  return global.platform.openExtensionInBrowser(INITIALIZE_ROUTE)
}

Initialized.propTypes = {
  completedOnboarding: PropTypes.bool,
}
