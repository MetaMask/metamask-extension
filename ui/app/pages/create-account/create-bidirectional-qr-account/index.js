import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as actions from '../../../store/actions'
import { getMetaMaskAccounts } from '../../../selectors'
import { formatBalance } from '../../../helpers/utils/util'
import { getMostRecentOverviewPage } from '../../../ducks/history/history'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'
import AccountList from './account-list'

const U2F_ERROR = 'U2F'

class CreateBidirectionalQrAccount extends Component {
  state = {
    error: null,
    selectedAccount: null,
    accounts: [],
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { accounts } = nextProps
    const newAccounts = this.state.accounts.map((a) => {
      const normalizedAddress = a.address.toLowerCase()
      const balanceValue =
        (accounts[normalizedAddress] && accounts[normalizedAddress].balance) ||
        null
      a.balance = balanceValue ? formatBalance(balanceValue, 6) : '...'
      return a
    })
    this.setState({ accounts: newAccounts })
  }

  onAccountChange = (account) => {
    this.setState({ selectedAccount: account.toString(), error: null })
  }

  onAccountRestriction = () => {
    this.setState({ error: this.context.t('ledgerAccountRestriction') })
  }

  componentDidMount() {
    this.getPage(0)
  }

  getPage = (page) => {
    this.props
      .getBidirectionalQrAccountsByPage(page)
      .then((accounts) => {
        if (accounts.length) {
          const newState = { error: null }
          // Default to the first account
          if (this.state.selectedAccount === null) {
            accounts.forEach((a) => {
              if (a.address.toLowerCase() === this.props.address) {
                newState.selectedAccount = a.index.toString()
              }
            })
            // If the page doesn't contain the selected account, let's deselect it
          } else if (
            !accounts.filter(
              (a) => a.index.toString() === this.state.selectedAccount,
            ).length
          ) {
            newState.selectedAccount = null
          }

          // Map accounts with balances
          newState.accounts = accounts.map((account) => {
            const normalizedAddress = account.address.toLowerCase()
            const balanceValue =
              (this.props.accounts[normalizedAddress] &&
                this.props.accounts[normalizedAddress].balance) ||
              null
            account.balance = balanceValue
              ? formatBalance(balanceValue, 6)
              : '...'
            return account
          })

          this.setState(newState)
        }
      })
      .catch((e) => {
        const errorMessage = typeof e === 'string' ? e : e.message
        if (errorMessage === 'Window blocked') {
          this.setState({ error: null })
        } else if (errorMessage.includes(U2F_ERROR)) {
          this.setState({ error: U2F_ERROR })
        } else if (
          errorMessage !== 'Window closed' &&
          errorMessage !== 'Popup closed'
        ) {
          this.setState({ error: errorMessage })
        }
      })
  }

  onUnlockAccount = () => {
    const { history, unlockBidirectionalQrAccount } = this.props

    if (this.state.selectedAccount === null) {
      this.setState({ error: this.context.t('accountSelectionRequired') })
    }

    unlockBidirectionalQrAccount(this.state.selectedAccount)
      .then((_) => {
        history.push(DEFAULT_ROUTE)
      })
      .catch((e) => {
        this.setState({ error: e.message })
      })
  }

  onCancel = () => {
    const { history, mostRecentOverviewPage } = this.props
    history.push(mostRecentOverviewPage)
  }

  renderError() {
    if (this.state.error === U2F_ERROR) {
      return (
        <p className="hw-connect__error">
          {this.context.t('troubleConnectingToWallet', [
            this.state.device,
            // eslint-disable-next-line react/jsx-key
            <a
              href="https://metamask.zendesk.com/hc/en-us/articles/360020394612-How-to-connect-a-Trezor-or-Ledger-Hardware-Wallet"
              key="hardware-connection-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="hw-connect__link"
              style={{ marginLeft: '5px', marginRight: '5px' }}
            >
              {this.context.t('walletConnectionGuide')}
            </a>,
          ])}
        </p>
      )
    }
    return this.state.error ? (
      <span className="hw-connect__error">{this.state.error}</span>
    ) : null
  }

  renderContent() {
    if (!this.state.accounts.length) {
      return null
    }

    return (
      <AccountList
        accounts={this.state.accounts}
        selectedAccount={this.state.selectedAccount}
        selectedAccounts={this.state.selectedAccounts}
        onAccountChange={this.onAccountChange}
        network={this.props.network}
        getPage={this.getPage}
        onUnlockAccount={this.onUnlockAccount}
        onCancel={this.onCancel}
        onAccountRestriction={this.onAccountRestriction}
      />
    )
  }

  render() {
    return (
      <>
        {this.renderError()}
        {this.renderContent()}
      </>
    )
  }
}

CreateBidirectionalQrAccount.propTypes = {
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
  history: PropTypes.object,
  network: PropTypes.string,
  accounts: PropTypes.object,
  address: PropTypes.string,
  mostRecentOverviewPage: PropTypes.string.isRequired,
  getBidirectionalQrAccountsByPage: PropTypes.func,
  unlockBidirectionalQrAccount: PropTypes.func,
}

const mapStateToProps = (state) => {
  const {
    metamask: { network, selectedAddress },
  } = state
  const accounts = getMetaMaskAccounts(state)
  const {
    appState: { defaultHdPaths },
  } = state

  return {
    network,
    accounts,
    address: selectedAddress,
    defaultHdPaths,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    unlockBidirectionalQrAccount: (index) => {
      return dispatch(actions.unlockBidirectionalQrAccount(index))
    },
    showAlert: (msg) => dispatch(actions.showAlert(msg)),
    hideAlert: () => dispatch(actions.hideAlert()),
    getBidirectionalQrAccountsByPage: (page) => {
      return dispatch(actions.getBidirectionalQrAccountsByPage(page))
    },
  }
}

CreateBidirectionalQrAccount.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CreateBidirectionalQrAccount)
