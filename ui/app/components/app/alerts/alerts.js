import React from 'react'
import { useSelector } from 'react-redux'

import UnconnectedAccountAlert from './unconnected-account-alert'
import SwitchToConnectedAlert from './switch-to-connected-alert'
import { alertIsOpen as unconnectedAccountAlertIsOpen } from '../../../ducks/alerts/unconnected-account'
import { alertIsOpen as switchToConnectedAlertIsOpen } from '../../../ducks/alerts/switch-to-connected'

const Alerts = () => {
  const _unconnectedAccountAlertIsOpen = useSelector(unconnectedAccountAlertIsOpen)
  const _switchToConnectedAlertIsOpen = useSelector(switchToConnectedAlertIsOpen)

  if (_unconnectedAccountAlertIsOpen) {
    return (
      <UnconnectedAccountAlert />
    )
  } else if (_switchToConnectedAlertIsOpen) {
    return (
      <SwitchToConnectedAlert />
    )
  }

  return null
}

export default Alerts
