import React from 'react'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router-dom'

import {
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  PROVIDER_APPROVAL,
} from '../../helpers/constants/routes'

const NotificationRedirect = (props) => {
  const {
    forgottenPassword,
    providerRequests,
    suggestedTokens,
    unconfirmedTransactionsCount,
  } = props

  if (unconfirmedTransactionsCount > 0) {
    return <Redirect to={{ pathname: CONFIRM_TRANSACTION_ROUTE }} />
  } else if (Object.keys(suggestedTokens).length > 0) {
    return <Redirect to={{ pathname: CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE }} />
  } else if (providerRequests && providerRequests.length > 0) {
    return <Redirect to={{ pathname: PROVIDER_APPROVAL }}/>
  } else if (forgottenPassword) {
    return global.platform.openExtensionInBrowser(RESTORE_VAULT_ROUTE)
  }

  return null
}

NotificationRedirect.propTypes = {
  forgottenPassword: PropTypes.bool,
  providerRequests: PropTypes.array,
  suggestedTokens: PropTypes.object,
  unconfirmedTransactionsCount: PropTypes.number,
}

export default NotificationRedirect
