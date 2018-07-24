import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router-dom'
import WalletView from '../../wallet-view'
import TxView from '../../tx-view'
import {
  INITIALIZE_BACKUP_PHRASE_ROUTE,
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  NOTICE_ROUTE,
} from '../../../routes'

export default class Home extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    unapprovedTxs: PropTypes.object,
    unapprovedMsgCount: PropTypes.number,
    unapprovedPersonalMsgCount: PropTypes.number,
    unapprovedTypedMessagesCount: PropTypes.number,
    noActiveNotices: PropTypes.bool,
    lostAccounts: PropTypes.array,
    forgottenPassword: PropTypes.bool,
    seedWords: PropTypes.string,
  }

  componentDidMount () {
    const {
      history,
      unapprovedTxs = {},
      unapprovedMsgCount = 0,
      unapprovedPersonalMsgCount = 0,
      unapprovedTypedMessagesCount = 0,
    } = this.props

    // unapprovedTxs and unapproved messages
    if (Object.keys(unapprovedTxs).length ||
      unapprovedTypedMessagesCount + unapprovedMsgCount + unapprovedPersonalMsgCount > 0) {
      history.push(CONFIRM_TRANSACTION_ROUTE)
    }
  }

  render () {
    const {
      noActiveNotices,
      lostAccounts,
      forgottenPassword,
      seedWords,
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

    return (
      <div className="main-container">
        <div className="account-and-transaction-details">
          <WalletView responsiveDisplayClassname="lap-visible" />
          <TxView />
        </div>
      </div>
    )
  }
}
