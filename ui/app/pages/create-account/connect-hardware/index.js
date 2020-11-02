import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as actions from '../../../store/actions'
import { getMetaMaskAccounts } from '../../../selectors'
import { formatBalance } from '../../../helpers/utils/util'
import { getMostRecentOverviewPage } from '../../../ducks/history/history'
import SelectHardware from './select-hardware'
import AccountList from './account-list'

class ConnectHardwareForm extends Component {
  state = {
    error: null,
    selectedAccount: null,
    accounts: [],
    browserSupported: true,
    unlocked: false,
    device: null,
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

  componentDidMount() {
    this.checkIfUnlocked()
  }

  async checkIfUnlocked() {
    for (const device of ['trezor', 'ledger']) {
      const unlocked = await this.props.checkHardwareStatus(
        device,
        this.props.defaultHdPaths[device],
      )
      if (unlocked) {
        this.setState({ unlocked: true })
        this.getPage(device, 0, this.props.defaultHdPaths[device])
      }
    }
  }

  connectToHardwareWallet = (device) => {
    this.setState({ device })
    if (this.state.accounts.length) {
      return
    }

    // Default values
    this.getPage(device, 0, this.props.defaultHdPaths[device])
  }

  onPathChange = (path) => {
    this.props.setHardwareWalletDefaultHdPath({
      device: this.state.device,
      path,
    })
    this.getPage(this.state.device, 0, path)
  }

  onAccountChange = (account) => {
    this.setState({ selectedAccount: account.toString(), error: null })
  }

  onAccountRestriction = () => {
    this.setState({ error: this.context.t('ledgerAccountRestriction') })
  }

  showTemporaryAlert() {
    this.props.showAlert(this.context.t('hardwareWalletConnected'))
    // Autohide the alert after 5 seconds
    setTimeout((_) => {
      this.props.hideAlert()
    }, 5000)
  }

  getPage = (device, page, hdPath) => {
    this.props
      .connectHardware(device, page, hdPath)
      .then((accounts) => {
        if (accounts.length) {
          // If we just loaded the accounts for the first time
          // (device previously locked) show the global alert
          if (this.state.accounts.length === 0 && !this.state.unlocked) {
            this.showTemporaryAlert()
          }

          const newState = { unlocked: true, device, error: null }
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
        const errorMessage = e.message
        if (errorMessage === 'Window blocked') {
          this.setState({ browserSupported: false, error: null })
        } else if (e.indexOf('U2F') > -1) {
          this.setState({ error: 'U2F' })
        } else if (
          errorMessage !== 'Window closed' &&
          errorMessage !== 'Popup closed'
        ) {
          this.setState({ error: errorMessage })
        }
      })
  }

  onForgetDevice = (device) => {
    this.props
      .forgetDevice(device)
      .then((_) => {
        this.setState({
          error: null,
          selectedAccount: null,
          accounts: [],
          unlocked: false,
        })
      })
      .catch((e) => {
        this.setState({ error: e.message })
      })
  }

  onUnlockAccount = (device) => {
    const {
      history,
      mostRecentOverviewPage,
      unlockHardwareWalletAccount,
    } = this.props

    if (this.state.selectedAccount === null) {
      this.setState({ error: this.context.t('accountSelectionRequired') })
    }

    unlockHardwareWalletAccount(this.state.selectedAccount, device)
      .then((_) => {
        this.context.metricsEvent({
          eventOpts: {
            category: 'Accounts',
            action: 'Connected Hardware Wallet',
            name: `Connected Account with: ${device}`,
          },
        })
        history.push(mostRecentOverviewPage)
      })
      .catch((e) => {
        this.context.metricsEvent({
          eventOpts: {
            category: 'Accounts',
            action: 'Connected Hardware Wallet',
            name: 'Error connecting hardware wallet',
          },
          customVariables: {
            error: e.message,
          },
        })
        this.setState({ error: e.message })
      })
  }

  onCancel = () => {
    const { history, mostRecentOverviewPage } = this.props
    history.push(mostRecentOverviewPage)
  }

  renderError() {
    if (this.state.error === 'U2F') {
      return (
        <p className="hw-connect__error">
          {this.context.t('troubleConnectingToWallet', [
            this.state.device,
            // eslint-disable-next-line react/jsx-key
            <a
              href="https://metamask.zendesk.com/hc/en-us/articles/360020394612-How-to-connect-a-Trezor-or-Ledger-Hardware-Wallet"
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
      return (
        <SelectHardware
          connectToHardwareWallet={this.connectToHardwareWallet}
          browserSupported={this.state.browserSupported}
        />
      )
    }

    return (
      <AccountList
        onPathChange={this.onPathChange}
        selectedPath={this.props.defaultHdPaths[this.state.device]}
        device={this.state.device}
        accounts={this.state.accounts}
        selectedAccount={this.state.selectedAccount}
        onAccountChange={this.onAccountChange}
        network={this.props.network}
        getPage={this.getPage}
        onUnlockAccount={this.onUnlockAccount}
        onForgetDevice={this.onForgetDevice}
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

ConnectHardwareForm.propTypes = {
  connectHardware: PropTypes.func,
  checkHardwareStatus: PropTypes.func,
  forgetDevice: PropTypes.func,
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
  unlockHardwareWalletAccount: PropTypes.func,
  setHardwareWalletDefaultHdPath: PropTypes.func,
  history: PropTypes.object,
  network: PropTypes.string,
  accounts: PropTypes.object,
  address: PropTypes.string,
  defaultHdPaths: PropTypes.object,
  mostRecentOverviewPage: PropTypes.string.isRequired,
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
    setHardwareWalletDefaultHdPath: ({ device, path }) => {
      return dispatch(actions.setHardwareWalletDefaultHdPath({ device, path }))
    },
    connectHardware: (deviceName, page, hdPath) => {
      return dispatch(actions.connectHardware(deviceName, page, hdPath))
    },
    checkHardwareStatus: (deviceName, hdPath) => {
      return dispatch(actions.checkHardwareStatus(deviceName, hdPath))
    },
    forgetDevice: (deviceName) => {
      return dispatch(actions.forgetDevice(deviceName))
    },
    unlockHardwareWalletAccount: (index, deviceName, hdPath) => {
      return dispatch(
        actions.unlockHardwareWalletAccount(index, deviceName, hdPath),
      )
    },
    showAlert: (msg) => dispatch(actions.showAlert(msg)),
    hideAlert: () => dispatch(actions.hideAlert()),
  }
}

ConnectHardwareForm.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectHardwareForm)
