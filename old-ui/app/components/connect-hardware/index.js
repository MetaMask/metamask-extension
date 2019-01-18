import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import actions from '../../../../ui/app/actions'
import ConnectScreen from './connect-screen'
import AccountList from './account-list'
import { formatBalance } from '../../util'
import { getPlatform } from '../../../../app/scripts/lib/util'
import { PLATFORM_FIREFOX } from '../../../../app/scripts/lib/enums'
// import { isLedger } from './util'
import { getMetaMaskAccounts } from '../../../../ui/app/selectors'

class ConnectHardwareForm extends Component {
  constructor (props, context) {
    super(props)
    this.state = {
      error: null,
      selectedAccount: null,
      selectedAccounts: [],
      accounts: [],
      browserSupported: true,
      unlocked: false,
      device: null,
    }
  }

  componentWillReceiveProps (nextProps) {
    const { accounts, network } = nextProps
    const newAccounts = this.state.accounts.map(a => {
      const normalizedAddress = a.address.toLowerCase()
      const balanceValue = accounts[normalizedAddress] && accounts[normalizedAddress].balance || null
      a.balance = balanceValue ? formatBalance(balanceValue, 4, undefined, network) : '...'
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
    // None of the hardware wallets are supported
    // At least for now
    if (getPlatform() === PLATFORM_FIREFOX) {
      this.setState({ browserSupported: false, error: null})
      return null
    }

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
    let selectedAcc = account.toString()
    // if (isLedger(this.state.device)) {
    const selectedAccounts = this.state.selectedAccounts
    if (!selectedAccounts.includes(selectedAcc)) {
      selectedAccounts.push(selectedAcc)
    } else {
      const indToRemove = selectedAccounts.indexOf(selectedAcc)
      selectedAccounts.splice(indToRemove, 1)
      selectedAcc = selectedAccounts[selectedAccounts.length - 1]
    }
    const newState = {
      selectedAccounts,
      selectedAccount: selectedAcc,
      error: null,
    }
    this.setState(newState)
    // } else {
    //   this.setState({selectedAccount: account.toString(), error: null})
    // }
  }

  onAccountRestriction = () => {
    this.setState({error: 'You need to make use your last account before you can add a new one.' })
  }

  showTemporaryAlert () {
    this.props.showAlert('Hardware wallet connected')
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
          // if (!isLedger(device)) {
          // Default to the first account
          if (this.state.selectedAccount === null) {
            accounts.forEach((a, i) => {
              if (a.address.toLowerCase() === this.props.address) {
                newState.selectedAccount = a.index.toString()
              }
            })
          // If the page doesn't contain the selected account, let's deselect it
          } else if (!accounts.filter(a => a.index.toString() === this.state.selectedAccount).length) {
            newState.selectedAccount = null
          }
          // }

          // Map accounts with balances
          newState.accounts = accounts.map(account => {
            const normalizedAddress = account.address.toLowerCase()
            const balanceValue = this.props.accounts[normalizedAddress] && this.props.accounts[normalizedAddress].balance || null
            account.balance = balanceValue ? formatBalance(balanceValue, 4, undefined, this.props.network) : '...'
            return account
          })

          this.setState(newState)
        }
      })
      .catch(e => {
        if (e === 'Window blocked') {
          this.setState({ browserSupported: false, error: null})
        } else if (e !== 'Window closed') {
          this.setState({ error: (e.message || e.toString()) })
        }
      })
  }

  onForgetDevice = (device) => {
    this.props.forgetDevice(device)
    .then(_ => {
      this.setState({
        error: null,
        selectedAccount: null,
        selectedAccounts: [],
        accounts: [],
        unlocked: false,
      })
    }).catch(e => {
      this.setState({ error: (e.message || e.toString()) })
    })
  }

  onUnlockAccount = (device) => {

    if (!this.state.selectedAccount && this.state.selectedAccounts.length === 0) {
      this.setState({ error: 'You need to select an account!' })
    }

    if (this.state.selectedAccounts.length > 0) {
      this.unlockHardwareWalletAccounts(this.state.selectedAccounts, device)
      .then(_ => {
        this.props.goHome()
      })
    } else {
      this.props.unlockHardwareWalletAccount(this.state.selectedAccount, device)
      .then(_ => {
        this.props.goHome()
      }).catch(e => {
        this.setState({ error: (e.message || e.toString()) })
      })
    }
  }

  unlockHardwareWalletAccounts = (accounts, device) => {
    return accounts.reduce((promise, account) => {
      return promise
        .then((result) => {
          return new Promise((resolve, reject) => {
            resolve(this.props.unlockHardwareWalletAccount(account, device))
          })
        })
        .catch(e => this.setState({ error: (e.message || e.toString()) }))
    }, Promise.resolve())
  }

  onCancel = () => {
    this.props.goHome()
  }

  renderError () {
    return this.state.error
      ? <span className="error" style={{ display: 'block', textAlign: 'center' }}>{this.state.error}</span>
      : null
  }

  renderContent () {
    if (!this.state.accounts.length) {
      return (
        <ConnectScreen
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
        selectedAccounts={this.state.selectedAccounts}
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

  render () {
    return (
      <div style={{width: '100%'}}>
        <div className="section-title flex-row flex-center">
          <i className="fa fa-arrow-left fa-lg cursor-pointer"
            onClick={() => this.props.goHome() }
            style={{
              position: 'absolute',
              left: '30px',
          }}/>
          <h2>Connect to hardware wallet</h2>
        </div>
        <div style={{overflowY: 'auto', height: '482px'}}>
          <div style={{padding: '0 30px'}}>
            {this.renderError()}
            {this.renderContent()}
          </div>
        </div>
      </div>
    )
  }
}

ConnectHardwareForm.propTypes = {
  showImportPage: PropTypes.func,
  showConnectPage: PropTypes.func,
  connectHardware: PropTypes.func,
  checkHardwareStatus: PropTypes.func,
  forgetDevice: PropTypes.func,
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
  unlockHardwareWalletAccount: PropTypes.func,
  setHardwareWalletDefaultHdPath: PropTypes.func,
  goHome: PropTypes.func,
  numberOfExistingAccounts: PropTypes.number,
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
    goHome: () => {
      dispatch(actions.goHome())
    },
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

module.exports = connect(mapStateToProps, mapDispatchToProps)(ConnectHardwareForm)
