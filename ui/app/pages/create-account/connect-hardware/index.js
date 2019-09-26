const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../store/actions')
const { getMetaMaskAccounts } = require('../../../selectors/selectors')
const ConnectScreen = require('./connect-screen')
const AccountList = require('./account-list')
const { DEFAULT_ROUTE } = require('../../../helpers/constants/routes')
const { formatBalance } = require('../../../helpers/utils/util')

class ConnectHardwareForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      error: null,
      selectedAccount: null,
      accounts: [],
      browserSupported: true,
      unlocked: false,
      device: null,
    }
  }

  componentWillReceiveProps (nextProps) {
    const { accounts } = nextProps
    const newAccounts = this.state.accounts.map(a => {
      const normalizedAddress = a.address.toLowerCase()
      const balanceValue = accounts[normalizedAddress] && accounts[normalizedAddress].balance || null
      a.balance = balanceValue ? formatBalance(balanceValue, 6) : '...'
      return a
    })
    this.setState({accounts: newAccounts})
  }


  componentDidMount () {
    this.checkIfUnlocked()
  }

  async checkIfUnlocked () {
    ['trezor', 'ledger'].forEach(async device => {
      const unlocked = await this.props.checkHardwareStatus(device, this.props.defaultHdPaths[device])
      if (unlocked) {
        this.setState({unlocked: true})
        this.getPage(device, 0, this.props.defaultHdPaths[device])
      }
    })
  }

  connectToHardwareWallet = (device) => {
    if (this.state.accounts.length) {
      return null
    }

    // Default values
    this.getPage(device, 0, this.props.defaultHdPaths[device])
  }

  onPathChange = (path) => {
    this.props.setHardwareWalletDefaultHdPath({device: this.state.device, path})
    this.getPage(this.state.device, 0, path)
  }

  onAccountChange = (account) => {
    this.setState({selectedAccount: account.toString(), error: null})
  }

  onAccountRestriction = () => {
    this.setState({error: this.context.t('ledgerAccountRestriction') })
  }

  showTemporaryAlert () {
    this.props.showAlert(this.context.t('hardwareWalletConnected'))
    // Autohide the alert after 5 seconds
    setTimeout(_ => {
      this.props.hideAlert()
    }, 5000)
  }

  getPage = (device, page, hdPath) => {
    this.props
      .connectHardware(device, page, hdPath)
      .then(accounts => {
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
          } else if (!accounts.filter(a => a.index.toString() === this.state.selectedAccount).length) {
            newState.selectedAccount = null
          }


          // Map accounts with balances
          newState.accounts = accounts.map(account => {
            const normalizedAddress = account.address.toLowerCase()
            const balanceValue = this.props.accounts[normalizedAddress] && this.props.accounts[normalizedAddress].balance || null
            account.balance = balanceValue ? formatBalance(balanceValue, 6) : '...'
            return account
          })

          this.setState(newState)
        }
      })
      .catch(e => {
        if (e === 'Window blocked') {
          this.setState({ browserSupported: false, error: null})
        } else if (e !== 'Window closed' && e !== 'Popup closed') {
          this.setState({ error: e.toString() })
        }
      })
  }

  onForgetDevice = (device) => {
    this.props.forgetDevice(device)
      .then(_ => {
        this.setState({
          error: null,
          selectedAccount: null,
          accounts: [],
          unlocked: false,
        })
      }).catch(e => {
        this.setState({ error: e.toString() })
      })
  }

  onUnlockAccount = (device) => {

    if (this.state.selectedAccount === null) {
      this.setState({ error: this.context.t('accountSelectionRequired') })
    }

    this.props.unlockHardwareWalletAccount(this.state.selectedAccount, device)
      .then(_ => {
        this.context.metricsEvent({
          eventOpts: {
            category: 'Accounts',
            action: 'Connected Hardware Wallet',
            name: 'Connected Account with: ' + device,
          },
        })
        this.props.history.push(DEFAULT_ROUTE)
      }).catch(e => {
        this.context.metricsEvent({
          eventOpts: {
            category: 'Accounts',
            action: 'Connected Hardware Wallet',
            name: 'Error connecting hardware wallet',
          },
          customVariables: {
            error: e.toString(),
          },
        })
        this.setState({ error: e.toString() })
      })
  }

  onCancel = () => {
    this.props.history.push(DEFAULT_ROUTE)
  }

  renderError () {
    return this.state.error
      ? h('span.error', { style: { margin: '20px 20px 10px', display: 'block', textAlign: 'center' } }, this.state.error)
      : null
  }

  renderContent () {
    if (!this.state.accounts.length) {
      return h(ConnectScreen, {
        connectToHardwareWallet: this.connectToHardwareWallet,
        browserSupported: this.state.browserSupported,
      })
    }

    return h(AccountList, {
      onPathChange: this.onPathChange,
      selectedPath: this.props.defaultHdPaths[this.state.device],
      device: this.state.device,
      accounts: this.state.accounts,
      selectedAccount: this.state.selectedAccount,
      onAccountChange: this.onAccountChange,
      network: this.props.network,
      getPage: this.getPage,
      history: this.props.history,
      onUnlockAccount: this.onUnlockAccount,
      onForgetDevice: this.onForgetDevice,
      onCancel: this.onCancel,
      onAccountRestriction: this.onAccountRestriction,
    })
  }

  render () {
    return h('div', [
      this.renderError(),
      this.renderContent(),
    ])
  }
}

ConnectHardwareForm.propTypes = {
  hideModal: PropTypes.func,
  showImportPage: PropTypes.func,
  showConnectPage: PropTypes.func,
  connectHardware: PropTypes.func,
  checkHardwareStatus: PropTypes.func,
  forgetDevice: PropTypes.func,
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
  unlockHardwareWalletAccount: PropTypes.func,
  setHardwareWalletDefaultHdPath: PropTypes.func,
  numberOfExistingAccounts: PropTypes.number,
  history: PropTypes.object,
  t: PropTypes.func,
  network: PropTypes.string,
  accounts: PropTypes.object,
  address: PropTypes.string,
  defaultHdPaths: PropTypes.object,
}

const mapStateToProps = state => {
  const {
    metamask: { network, selectedAddress, identities = {} },
  } = state
  const accounts = getMetaMaskAccounts(state)
  const numberOfExistingAccounts = Object.keys(identities).length
  const {
    appState: { defaultHdPaths },
  } = state

  return {
    network,
    accounts,
    address: selectedAddress,
    numberOfExistingAccounts,
    defaultHdPaths,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setHardwareWalletDefaultHdPath: ({device, path}) => {
      return dispatch(actions.setHardwareWalletDefaultHdPath({device, path}))
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
      return dispatch(actions.unlockHardwareWalletAccount(index, deviceName, hdPath))
    },
    showImportPage: () => dispatch(actions.showImportPage()),
    showConnectPage: () => dispatch(actions.showConnectPage()),
    showAlert: (msg) => dispatch(actions.showAlert(msg)),
    hideAlert: () => dispatch(actions.hideAlert()),
  }
}

ConnectHardwareForm.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(
  ConnectHardwareForm
)
