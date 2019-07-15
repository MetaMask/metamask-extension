import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import { Redirect } from 'react-router-dom'
import HomeNotification from '../../components/app/home-notification'
import WalletView from '../../components/app/wallet-view'
import TransactionView from '../../components/app/transaction-view'
import ProviderApproval from '../provider-approval'

import {
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
} from '../../helpers/constants/routes'

export default class Home extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    activeTab: null,
    unsetMigratedPrivacyMode: null,
    forceApproveProviderRequestByOrigin: null,
  }

  static propTypes = {
    activeTab: PropTypes.shape({
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    }),
    history: PropTypes.object,
    forgottenPassword: PropTypes.bool,
    suggestedTokens: PropTypes.object,
    unconfirmedTransactionsCount: PropTypes.number,
    providerRequests: PropTypes.array,
    showPrivacyModeNotification: PropTypes.bool.isRequired,
    unsetMigratedPrivacyMode: PropTypes.func,
    viewingUnconnectedDapp: PropTypes.bool.isRequired,
    forceApproveProviderRequestByOrigin: PropTypes.func,
  }

  componentWillMount () {
    const {
      history,
      unconfirmedTransactionsCount = 0,
    } = this.props

    if (unconfirmedTransactionsCount > 0) {
      history.push(CONFIRM_TRANSACTION_ROUTE)
    }
  }

  componentDidMount () {
    const {
      history,
      suggestedTokens = {},
    } = this.props

    // suggested new tokens
    if (Object.keys(suggestedTokens).length > 0) {
      history.push(CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE)
    }
  }

  render () {
    const { t } = this.context
    const {
      activeTab,
      forgottenPassword,
      providerRequests,
      history,
      showPrivacyModeNotification,
      unsetMigratedPrivacyMode,
      viewingUnconnectedDapp,
      forceApproveProviderRequestByOrigin,
    } = this.props

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
          { !history.location.pathname.match(/^\/confirm-transaction/)
            ? (
              <TransactionView>
                {
                  showPrivacyModeNotification
                    ? (
                      <HomeNotification
                        descriptionText={t('privacyModeDefault')}
                        acceptText={t('learnMore')}
                        onAccept={() => {
                          window.open('https://medium.com/metamask/42549d4870fa', '_blank', 'noopener')
                          unsetMigratedPrivacyMode()
                        }}
                      />
                    )
                    : null
                }
                {
                  viewingUnconnectedDapp
                    ? (
                      <HomeNotification
                        descriptionText={t('shareAddressToConnect', [activeTab.origin])}
                        acceptText={t('shareAddress')}
                        onAccept={() => {
                          forceApproveProviderRequestByOrigin(activeTab.origin)
                        }}
                        infoText={t('shareAddressInfo', [activeTab.origin])}
                      />
                    )
                    : null
                }
              </TransactionView>
            )
            : null }
        </div>
      </div>
    )
  }
}
