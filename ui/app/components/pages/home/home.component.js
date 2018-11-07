import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import { Redirect } from 'react-router-dom'
import WalletView from '../../wallet-view'
import TransactionView from '../../transaction-view'
import Layer2AppView from '../../layer2App-view'
import ProviderApproval from '../provider-approval'

import {
  INITIALIZE_BACKUP_PHRASE_ROUTE,
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  NOTICE_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
} from '../../../routes'

export default class Home extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    noActiveNotices: PropTypes.bool,
    lostAccounts: PropTypes.array,
    forgottenPassword: PropTypes.bool,
    seedWords: PropTypes.string,
    suggestedTokens: PropTypes.object,
    unconfirmedTransactionsCount: PropTypes.number,
    providerRequests: PropTypes.array,
  }

  componentDidMount () {
    const {
      history,
      suggestedTokens = {},
      unconfirmedTransactionsCount = 0,
    } = this.props

    // suggested new tokens
    if (Object.keys(suggestedTokens).length > 0) {
        history.push(CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE)
    }

    if (unconfirmedTransactionsCount > 0) {
      history.push(CONFIRM_TRANSACTION_ROUTE)
    }
  }

  render () {
    const {
      noActiveNotices,
      lostAccounts,
      forgottenPassword,
      seedWords,
      providerRequests,
    } = this.props

    // notices
    if (!noActiveNotices || (lostAccounts && lostAccounts.length > 0)) {
      return <Redirect to={{ pathname: NOTICE_ROUTE }} />
    }

    // seed words
    if (seedWords) {
      return <Redirect to={{ pathname: INITIALIZE_BACKUP_PHRASE_ROUTE }}/>
    }

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />
    }

    if (providerRequests && providerRequests.length > 0) {
      return (
        <ProviderApproval providerRequest={providerRequests[0]} />
      )
    }

    return (
      <div className="main-container">
        <div className="account-and-transaction-details">
          <Media
            query="(min-width: 576px)"
            render={() => <WalletView />}
          />
	  <TransactionView />
	</div>
        <Layer2AppView />	
      </div>	
    )
  }
}




